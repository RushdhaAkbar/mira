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

export interface FeedbackRow {
  id: string;
  createdAt: string;
  variant: "ai" | "standard";
  overall: number;
  realism: number;
  fitConfidence: number;
  easeOfUse: number;
  purchaseIntent: number;
  photoComfort: number | null;
  recommend: number;
  liked: string;
  improve: string;
  ageRange: string;
  gender: string;
  shopsOnline: string;
  email: string;
  productName: string;
  colorName: string;
  triedSize: string;
  recommendedSize: string | null;
  aiRendered: boolean;
  device: "Mobile" | "Desktop";
}

export const RATING_KEYS = ["overall", "realism", "fitConfidence", "easeOfUse", "purchaseIntent", "photoComfort"] as const;
export const RATING_LABELS: Record<(typeof RATING_KEYS)[number], string> = {
  overall: "Overall liking",
  realism: "Realism",
  fitConfidence: "Fit confidence",
  easeOfUse: "Ease of use",
  purchaseIntent: "Purchase intent",
  photoComfort: "Photo comfort (AI only)",
};

export interface VariantStats {
  count: number;
  averages: Record<(typeof RATING_KEYS)[number], number | null>;
  nps: number | null;
}

export async function getFeedbackRows(): Promise<FeedbackRow[]> {
  const db = await getDb();
  const raw = db
    ? await db.collection("feedback").find({}).sort({ createdAt: -1 }).limit(2000).toArray()
    : [...memory().feedback].reverse();

  return raw.map((d, i) => {
    const r = d as Record<string, unknown> & { context?: Record<string, unknown> };
    const ctx = r.context ?? {};
    const ua = String(r.userAgent ?? "");
    return {
      id: String(r._id ?? i),
      createdAt: new Date(r.createdAt as Date).toISOString(),
      variant: r.variant === "standard" ? "standard" : "ai",
      overall: Number(r.overall),
      realism: Number(r.realism),
      fitConfidence: Number(r.fitConfidence),
      easeOfUse: Number(r.easeOfUse),
      purchaseIntent: Number(r.purchaseIntent),
      photoComfort: r.photoComfort === null || r.photoComfort === undefined ? null : Number(r.photoComfort),
      recommend: Number(r.recommend),
      liked: String(r.liked ?? ""),
      improve: String(r.improve ?? ""),
      ageRange: String(r.ageRange ?? ""),
      gender: String(r.gender ?? ""),
      shopsOnline: String(r.shopsOnline ?? ""),
      email: String(r.email ?? ""),
      productName: String(ctx.productName ?? ""),
      colorName: String(ctx.colorName ?? ""),
      triedSize: String(ctx.triedSize ?? ""),
      recommendedSize: ctx.recommendedSize ? String(ctx.recommendedSize) : null,
      aiRendered: Boolean(ctx.aiRendered),
      device: /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop",
    } satisfies FeedbackRow;
  });
}

export function statsFor(rows: FeedbackRow[]): VariantStats {
  const avg = (k: (typeof RATING_KEYS)[number]) => {
    const vals = rows.map((r) => r[k]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    return vals.length ? Math.round((vals.reduce((a, v) => a + v, 0) / vals.length) * 100) / 100 : null;
  };
  const averages = Object.fromEntries(RATING_KEYS.map((k) => [k, avg(k)])) as VariantStats["averages"];
  // Net Promoter Score: % promoters (9-10) minus % detractors (0-6).
  const nps = rows.length
    ? Math.round(
        ((rows.filter((r) => r.recommend >= 9).length - rows.filter((r) => r.recommend <= 6).length) / rows.length) * 100,
      )
    : null;
  return { count: rows.length, averages, nps };
}

export async function getUsage() {
  const db = await getDb();
  if (!db) {
    const m = memory();
    return { aiGenerations: m.generations, testers: m.testers.size, demoOrders: 0, perTester: PER_TESTER_LIMIT, totalLimit: TOTAL_LIMIT };
  }
  const [aiGenerations, testers, demoOrders] = await Promise.all([
    db.collection("ai_generations").countDocuments({ success: true }),
    db.collection("testers").countDocuments({}),
    db.collection("orders").countDocuments({ demo: true }),
  ]);
  return { aiGenerations, testers, demoOrders, perTester: PER_TESTER_LIMIT, totalLimit: TOTAL_LIMIT };
}
