import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getDb, memory } from "./mongodb";
import type { AiQuota } from "./types";

/**
 * Testing-phase limits.
 * AI_TRYONS_PER_TESTER: AI try-on renders each tester may generate (default 1).
 * AI_TRYONS_TOTAL_LIMIT: hard cap across all testers, protects the fal credit (default 300).
 */
export const PER_TESTER_LIMIT = Number(process.env.AI_TRYONS_PER_TESTER || 1);
export const TOTAL_LIMIT = Number(process.env.AI_TRYONS_TOTAL_LIMIT || 300);

const COOKIE = "mira_tid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Anonymous tester id from an httpOnly cookie, created on first visit. */
export async function getTesterId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;
  const id = randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return id;
}

export interface TesterRecord {
  name: string;
  variant: string;
  userAgent: string;
  registeredAt: Date;
  lastSeenAt: Date;
}

/** Name the tester gave at the gate, or null if they have not registered yet. */
export async function getTesterName(testerId: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return memory().names.get(testerId)?.name ?? null;
  const doc = await db.collection("testers").findOne({ _id: testerId as never }, { projection: { name: 1 } });
  const name = doc?.name;
  return typeof name === "string" && name ? name : null;
}

/**
 * Save a tester's name. Creates the tester record if it does not exist yet.
 * `source` is "tester" when typed at the gate, "admin" when added in the admin portal
 * (used for the version without AI, which has no gate).
 */
export async function registerTester(
  testerId: string,
  input: { name: string; variant: string; userAgent: string; source?: "tester" | "admin" },
): Promise<void> {
  const now = new Date();
  const source = input.source ?? "tester";
  const db = await getDb();
  if (!db) {
    const m = memory();
    const prev = m.names.get(testerId);
    m.names.set(testerId, {
      name: input.name,
      variant: input.variant,
      userAgent: input.userAgent || prev?.userAgent || "",
      registeredAt: prev?.registeredAt ?? now,
      lastSeenAt: source === "admin" ? (prev?.lastSeenAt ?? now) : now,
      source,
    });
    return;
  }
  // aiUsed must exist on insert: reserveGeneration() matches on `aiUsed: { $lt: limit }`.
  const set: Record<string, unknown> = { name: input.name, variant: input.variant, nameSource: source };
  if (input.userAgent) set.userAgent = input.userAgent;
  if (source === "tester") set.lastSeenAt = now;
  await db.collection("testers").updateOne(
    { _id: testerId as never },
    { $set: set, $setOnInsert: { createdAt: now, registeredAt: now, lastSeenAt: now, aiUsed: 0 } },
    { upsert: true },
  );
}

/** Note that a registered tester opened the app again. */
export async function touchTester(testerId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const rec = memory().names.get(testerId);
    if (rec) rec.lastSeenAt = new Date();
    return;
  }
  await db.collection("testers").updateOne({ _id: testerId as never, name: { $exists: true } }, { $set: { lastSeenAt: new Date() } });
}

export async function getQuota(testerId: string): Promise<AiQuota> {
  const db = await getDb();
  const used = db
    ? (((await db.collection("testers").findOne({ _id: testerId as never }))?.aiUsed as number | undefined) ?? 0)
    : (memory().testers.get(testerId) ?? 0);
  return { used, limit: PER_TESTER_LIMIT, remaining: Math.max(0, PER_TESTER_LIMIT - used) };
}

export type ReserveResult = { ok: true } | { ok: false; reason: "tester_limit" | "total_limit" };

/**
 * Atomically reserve one AI generation for this tester.
 * Call refund() if the generation then fails, so the tester keeps their try-on.
 */
export async function reserveGeneration(testerId: string): Promise<ReserveResult> {
  const db = await getDb();
  if (!db) {
    const m = memory();
    if (m.generations >= TOTAL_LIMIT) return { ok: false, reason: "total_limit" };
    const used = m.testers.get(testerId) ?? 0;
    if (used >= PER_TESTER_LIMIT) return { ok: false, reason: "tester_limit" };
    m.testers.set(testerId, used + 1);
    m.generations++;
    return { ok: true };
  }

  const total = await db.collection("ai_generations").countDocuments({ success: true });
  if (total >= TOTAL_LIMIT) return { ok: false, reason: "total_limit" };

  try {
    // Matches only while the tester is under the limit; otherwise the upsert
    // collides with the existing _id and throws a duplicate-key error.
    await db.collection("testers").updateOne(
      { _id: testerId as never, aiUsed: { $lt: PER_TESTER_LIMIT } },
      { $inc: { aiUsed: 1 }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    return { ok: true };
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return { ok: false, reason: "tester_limit" };
    throw err;
  }
}

export async function refundGeneration(testerId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const m = memory();
    m.testers.set(testerId, Math.max(0, (m.testers.get(testerId) ?? 1) - 1));
    m.generations = Math.max(0, m.generations - 1);
    return;
  }
  await db.collection("testers").updateOne({ _id: testerId as never, aiUsed: { $gt: 0 } }, { $inc: { aiUsed: -1 } });
}

export type EventType = "registered" | "photo_uploaded" | "ai_tryon" | "ai_tryon_failed" | "fit_result" | "demo_order";

/**
 * Append one step to the tester's activity track (shown in the admin portal). Never throws.
 * `meta` records which version and browser the step came from, so testers who never
 * gave a name (the version without AI) can still be listed and named by the admin.
 */
export async function logEvent(
  testerId: string,
  type: EventType,
  detail = "",
  meta: { variant?: string; userAgent?: string | null } = {},
): Promise<void> {
  try {
    const db = await getDb();
    const doc = {
      testerId,
      type,
      detail: detail.slice(0, 200),
      variant: meta.variant === "standard" ? "standard" : meta.variant === "ai" ? "ai" : undefined,
      userAgent: (meta.userAgent ?? "").slice(0, 300) || undefined,
      createdAt: new Date(),
    };
    if (db) await db.collection("events").insertOne(doc);
    else memory().events.push(doc);
  } catch (err) {
    console.error("[tester] event log failed", err);
  }
}

export async function logGeneration(entry: { testerId: string; productId: string; success: boolean; ms: number }) {
  const db = await getDb();
  if (db) await db.collection("ai_generations").insertOne({ ...entry, createdAt: new Date() });
}
