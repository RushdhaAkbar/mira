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

export const EVENT_LABELS: Record<string, string> = {
  registered: "Gave name",
  photo_uploaded: "Uploaded photo",
  ai_tryon: "AI try-on",
  ai_tryon_failed: "AI try-on failed",
  fit_result: "Fit result",
  demo_order: "Demo order",
};

export interface TesterEvent {
  type: string;
  detail: string;
  at: string;
}

export interface TesterRow {
  id: string;
  name: string;
  variant: "ai" | "standard";
  registeredAt: string;
  lastSeenAt: string;
  aiUsed: number;
  device: "Mobile" | "Desktop";
  events: TesterEvent[];
}

/** Every tester who gave a name, newest first, with their activity track. */
export async function getTesterRows(): Promise<TesterRow[]> {
  const db = await getDb();
  const m = memory();

  const testers: { id: string; name: string; variant: string; userAgent: string; registeredAt: Date; lastSeenAt: Date; aiUsed: number }[] = db
    ? (await db.collection("testers").find({ name: { $exists: true } }).sort({ registeredAt: -1 }).limit(2000).toArray()).map((d) => {
        const r = d as Record<string, unknown>;
        return {
          id: String(r._id),
          name: String(r.name ?? ""),
          variant: String(r.variant ?? "ai"),
          userAgent: String(r.userAgent ?? ""),
          registeredAt: new Date((r.registeredAt as Date) ?? (r.createdAt as Date) ?? 0),
          lastSeenAt: new Date((r.lastSeenAt as Date) ?? (r.registeredAt as Date) ?? 0),
          aiUsed: Number(r.aiUsed ?? 0),
        };
      })
    : [...m.names.entries()]
        .map(([id, r]) => ({ id, ...r, aiUsed: m.testers.get(id) ?? 0 }))
        .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());

  const ids = testers.map((t) => t.id);
  const rawEvents = db
    ? await db.collection("events").find({ testerId: { $in: ids } }).sort({ createdAt: 1 }).limit(20000).toArray()
    : m.events.filter((e) => ids.includes(e.testerId));
  const byTester = new Map<string, TesterEvent[]>();
  for (const e of rawEvents) {
    const r = e as Record<string, unknown>;
    const list = byTester.get(String(r.testerId)) ?? [];
    list.push({ type: String(r.type), detail: String(r.detail ?? ""), at: new Date(r.createdAt as Date).toISOString() });
    byTester.set(String(r.testerId), list);
  }

  return testers.map((t) => ({
    id: t.id,
    name: t.name,
    variant: t.variant === "standard" ? "standard" : "ai",
    registeredAt: t.registeredAt.toISOString(),
    lastSeenAt: t.lastSeenAt.toISOString(),
    aiUsed: t.aiUsed,
    device: /Mobi|Android|iPhone/i.test(t.userAgent) ? "Mobile" : "Desktop",
    events: byTester.get(t.id) ?? [],
  }));
}

export async function getUsage() {
  const db = await getDb();
  if (!db) {
    const m = memory();
    return { aiGenerations: m.generations, testers: m.names.size, demoOrders: 0, perTester: PER_TESTER_LIMIT, totalLimit: TOTAL_LIMIT };
  }
  const [aiGenerations, testers, demoOrders] = await Promise.all([
    db.collection("ai_generations").countDocuments({ success: true }),
    db.collection("testers").countDocuments({ name: { $exists: true } }),
    db.collection("orders").countDocuments({ demo: true }),
  ]);
  return { aiGenerations, testers, demoOrders, perTester: PER_TESTER_LIMIT, totalLimit: TOTAL_LIMIT };
}
