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

export async function logGeneration(entry: { testerId: string; productId: string; success: boolean; ms: number }) {
  const db = await getDb();
  if (db) await db.collection("ai_generations").insertOne({ ...entry, createdAt: new Date() });
}
