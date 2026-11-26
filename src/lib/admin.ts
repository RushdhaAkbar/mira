import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getDb, memory } from "./mongodb";
import { PER_TESTER_LIMIT, TOTAL_LIMIT } from "./tester";

export const ADMIN_COOKIE = "mira_admin";

/** Session token derived from ADMIN_PASSWORD, so changing the password logs everyone out. */
function token(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("mira-admin-session-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(input: string): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !safeEqual(input, pw)) return null;
  return token();
}

export async function isAdmin(): Promise<boolean> {
  const t = token();
  if (!t) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(value && safeEqual(value, t));
}

/* ---------- dashboard data ---------- */

export interface TesterEvent {
  type: string;
  detail: string;
  at: string;
}

export interface TesterRow {
  id: string;
  /** Empty when nobody has given this tester a name yet. */
  name: string;
  /** Who supplied the name: the tester at the gate, the admin in the portal, or nobody yet. */
  nameSource: "tester" | "admin" | null;
  variant: "ai" | "standard";
  /** First time this tester was seen (gate, or first recorded step). */
  registeredAt: string;
  lastSeenAt: string;
  aiUsed: number;
  device: "Mobile" | "Desktop";
  events: TesterEvent[];
}

const device = (ua: string): TesterRow["device"] => (/Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop");

/**
 * Every tester with a name or any recorded activity, newest first.
 * Testers in the version without AI never see the name gate, so they appear
 * here without a name until the admin adds one from their own records.
 */
export async function getTesterRows(): Promise<TesterRow[]> {
  const db = await getDb();
  const m = memory();

  type Doc = { id: string; name: string; nameSource: TesterRow["nameSource"]; variant?: string; userAgent: string; registeredAt?: Date; lastSeenAt?: Date; aiUsed: number };
  const docs = new Map<string, Doc>();
  if (db) {
    for (const d of await db.collection("testers").find({}).limit(5000).toArray()) {
      const r = d as Record<string, unknown>;
      const name = typeof r.name === "string" ? r.name : "";
      docs.set(String(r._id), {
        id: String(r._id),
        name,
        nameSource: name ? (r.nameSource === "admin" ? "admin" : "tester") : null,
        variant: typeof r.variant === "string" ? r.variant : undefined,
        userAgent: String(r.userAgent ?? ""),
        registeredAt: r.registeredAt ? new Date(r.registeredAt as Date) : r.createdAt ? new Date(r.createdAt as Date) : undefined,
        lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt as Date) : undefined,
        aiUsed: Number(r.aiUsed ?? 0),
      });
    }
  } else {
    for (const [id, r] of m.names) {
      docs.set(id, { id, name: r.name, nameSource: r.source ?? "tester", variant: r.variant, userAgent: r.userAgent, registeredAt: r.registeredAt, lastSeenAt: r.lastSeenAt, aiUsed: m.testers.get(id) ?? 0 });
    }
    for (const [id, aiUsed] of m.testers) if (!docs.has(id)) docs.set(id, { id, name: "", nameSource: null, userAgent: "", aiUsed });
  }

  const rawEvents = db ? await db.collection("events").find({}).sort({ createdAt: 1 }).limit(50000).toArray() : m.events;
  const byTester = new Map<string, TesterEvent[]>();
  const seen = new Map<string, { first: Date; last: Date; variant?: string; userAgent: string; types: Set<string> }>();
  for (const e of rawEvents) {
    const r = e as Record<string, unknown>;
    const id = String(r.testerId);
    const at = new Date(r.createdAt as Date);
    const list = byTester.get(id) ?? [];
    list.push({ type: String(r.type), detail: String(r.detail ?? ""), at: at.toISOString() });
    byTester.set(id, list);
    const s = seen.get(id) ?? { first: at, last: at, userAgent: "", types: new Set<string>() };
    if (at < s.first) s.first = at;
    if (at > s.last) s.last = at;
    if (typeof r.variant === "string") s.variant = r.variant;
    if (typeof r.userAgent === "string" && r.userAgent) s.userAgent = r.userAgent;
    s.types.add(String(r.type));
    seen.set(id, s);
  }

  const ids = new Set<string>([...docs.keys(), ...seen.keys()]);
  const rows: TesterRow[] = [];
  for (const id of ids) {
    const d = docs.get(id);
    const s = seen.get(id);
    if (!d?.name && !s) continue; // a bare quota record with no activity: nothing to show
    const types = s?.types ?? new Set<string>();
    const aiSignal = types.has("ai_tryon") || types.has("ai_tryon_failed") || types.has("photo_uploaded") || (d?.aiUsed ?? 0) > 0;
    const variant = d?.variant ?? s?.variant ?? (aiSignal ? "ai" : "standard");
    const registeredAt = d?.registeredAt ?? s?.first ?? new Date(0);
    const lastSeenAt = [d?.lastSeenAt, s?.last].filter((x): x is Date => Boolean(x)).sort((a, b) => b.getTime() - a.getTime())[0] ?? registeredAt;
    rows.push({
      id,
      name: d?.name ?? "",
      nameSource: d?.nameSource ?? null,
      variant: variant === "standard" ? "standard" : "ai",
      registeredAt: registeredAt.toISOString(),
      lastSeenAt: lastSeenAt.toISOString(),
      aiUsed: d?.aiUsed ?? 0,
      device: device(d?.userAgent || s?.userAgent || ""),
      events: byTester.get(id) ?? [],
    });
  }
  return rows.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
}

export async function getUsage() {
  const db = await getDb();
  if (!db) {
    const m = memory();
    return { aiGenerations: m.generations, testers: m.names.size, demoOrders: m.events.filter((e) => e.type === "demo_order").length, perTester: PER_TESTER_LIMIT, totalLimit: TOTAL_LIMIT };
  }
  const [aiGenerations, testers, demoOrders] = await Promise.all([
    db.collection("ai_generations").countDocuments({ success: true }),
    db.collection("testers").countDocuments({ name: { $exists: true } }),
    db.collection("orders").countDocuments({ demo: true }),
  ]);
  return { aiGenerations, testers, demoOrders, perTester: PER_TESTER_LIMIT, totalLimit: TOTAL_LIMIT };
}
