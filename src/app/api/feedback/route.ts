import { NextResponse } from "next/server";
import { getDb, memory } from "@/lib/mongodb";
import { getTesterId } from "@/lib/tester";
import type { FeedbackInput } from "@/lib/types";

export const dynamic = "force-dynamic";

const clampInt = (v: unknown, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};
const text = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Stores one tester's feedback for the thesis analysis. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Partial<FeedbackInput> | null;
  if (!b) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const variant = b.variant === "standard" ? "standard" : "ai";
  const ratings = {
    overall: clampInt(b.overall, 1, 5),
    realism: clampInt(b.realism, 1, 5),
    fitConfidence: clampInt(b.fitConfidence, 1, 5),
    easeOfUse: clampInt(b.easeOfUse, 1, 5),
    purchaseIntent: clampInt(b.purchaseIntent, 1, 5),
    recommend: clampInt(b.recommend, 0, 10),
  };
  // Photo comfort is only asked in the AI version (the standard version uses no photo).
  const photoComfort = variant === "ai" ? clampInt(b.photoComfort, 1, 5) : null;
  if (Object.values(ratings).some((r) => r === null) || (variant === "ai" && photoComfort === null)) {
    return NextResponse.json({ error: "Please answer every rating question." }, { status: 400 });
  }

  const c = (b.context ?? {}) as Partial<FeedbackInput["context"]>;
  const doc = {
    testerId: await getTesterId(),
    variant,
    ...ratings,
    photoComfort,
    liked: text(b.liked),
    improve: text(b.improve),
    ageRange: text(b.ageRange, 40),
    gender: text(b.gender, 40),
    shopsOnline: text(b.shopsOnline, 40),
    email: text(b.email, 200),
    context: {
      productId: text(c.productId, 80),
      productName: text(c.productName, 120),
      colorName: text(c.colorName, 60),
      triedSize: text(c.triedSize, 2),
      recommendedSize: c.recommendedSize ? text(c.recommendedSize, 2) : null,
      aiRendered: Boolean(c.aiRendered),
    },
    userAgent: text(req.headers.get("user-agent"), 300),
    createdAt: new Date(),
  };

  const db = await getDb();
  if (db) await db.collection("feedback").insertOne(doc);
  else memory().feedback.push(doc);

  return NextResponse.json({ ok: true });
}
