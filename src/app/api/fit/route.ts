import { NextResponse } from "next/server";
import { claudeEnabled, explainFit } from "@/lib/ai/claude";
import { getDb } from "@/lib/mongodb";
import { getProduct } from "@/lib/productsServer";
import { fallbackExplanation, recommendSize, scoreFit } from "@/lib/sizing";
import type { FitPref, FitResult, Measurements, Size, Variant } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  productId?: string;
  measurements?: Measurements;
  fitPref?: FitPref;
  trySize?: Size;
  variant?: Variant;
}

/** Fit score + final size recommendation, explained by Claude when available. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const product = await getProduct(body.productId);
  if (!product || !body.measurements) {
    return NextResponse.json({ error: "productId and measurements are required" }, { status: 400 });
  }
  const fitPref = body.fitPref ?? "regular";
  const tried = body.trySize ?? "M";

  const rec = recommendSize(body.measurements, fitPref);
  const fit = scoreFit(tried, rec.size);

  // The standard (no-AI) study arm uses the rule-based explanation only.
  const useAi = body.variant !== "standard" && claudeEnabled();
  const explained = useAi
    ? await explainFit({
        productName: product.name,
        fabric: product.fabric,
        garmentType: product.type,
        measurements: body.measurements,
        fitPref,
        tried,
        recommended: rec.size,
        confidence: rec.confidence,
        score: fit.score,
        zones: fit.zones,
      })
    : null;

  const result: FitResult = {
    score: fit.score,
    verdict: fit.verdict,
    zones: fit.zones,
    recommended: rec.size,
    tried,
    confidence: rec.confidence,
    explanation: explained ?? fallbackExplanation(tried, rec.size, rec.confidence),
    source: explained ? "claude" : "rules",
  };

  const db = await getDb();
  if (db) {
    await db.collection("profiles").insertOne({
      productId: product.id,
      measurements: body.measurements,
      fitPref,
      tried,
      recommended: rec.size,
      score: fit.score,
      variant: body.variant ?? "ai",
      createdAt: new Date(),
    });
  }
  return NextResponse.json(result);
}
