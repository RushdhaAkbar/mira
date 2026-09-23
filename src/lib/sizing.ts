import type { FitPref, FitZone, Measurements, Size, SizeRecommendation } from "./types";

export const DEFAULT_MEASUREMENTS: Measurements = {
  height: 165,
  weight: 58,
  bust: 88,
  waist: 70,
  hips: 94,
};

const ORDER: Record<Size, number> = { S: 0, M: 1, L: 2 };

/**
 * Rule-based S/M/L recommendation.
 * Ported from the prototype: each body measurement is compared with the
 * size-M reference and the deltas are combined into one score.
 */
export function recommendSize(m: Measurements, fitPref: FitPref): SizeRecommendation {
  const h = m.height || 165;
  const w = m.weight || 58;
  const bu = m.bust || 88;
  const wa = m.waist || 70;
  const hp = m.hips || 94;

  let score = (bu - 84) / 8 + (wa - 66) / 8 + (hp - 90) / 8 + (w - (h - 105)) / 12;
  if (fitPref === "slim") score -= 0.5;
  if (fitPref === "oversized") score += 0.5;

  const size: Size = score < -0.6 ? "S" : score > 1.1 ? "L" : "M";
  const confidence = Math.max(62, Math.min(97, Math.round(95 - Math.abs(score - 0.25) * 9)));

  return {
    size,
    confidence,
    score: Math.round(score * 100) / 100,
    reason: `Based on your bust (${bu} cm), waist (${wa} cm) and hips (${hp} cm) with a ${fitPref} fit, size ${size} should sit best.`,
  };
}

export function bodyShape(m: Measurements): string {
  const { bust, waist, hips } = m;
  if (!bust || !waist || !hips) return "balanced";
  const bh = bust - hips;
  const wRatio = waist / Math.max(bust, hips);
  if (wRatio < 0.75 && Math.abs(bh) <= 5) return "hourglass";
  if (bh < -5) return "pear";
  if (bh > 5) return "inverted triangle";
  if (wRatio > 0.85) return "rectangle";
  return "balanced";
}

export interface FitScore {
  score: number;
  verdict: "Highly fit" | "Moderate fit" | "Poor fit";
  zones: FitZone[];
  diff: number;
}

/** Fit score for the size the shopper tried versus the recommended size. */
export function scoreFit(tried: Size, recommended: Size): FitScore {
  const diff = ORDER[tried] - ORDER[recommended];
  const match = diff === 0;
  const score = match ? 92 : Math.abs(diff) === 1 ? 61 : 38;
  const verdict = score >= 80 ? "Highly fit" : score >= 55 ? "Moderate fit" : "Poor fit";
  const status = (ok: boolean): FitZone["status"] => (ok ? "good" : diff < 0 ? "tight" : "loose");
  const zones: FitZone[] = [
    { zone: "Shoulders", status: "good" },
    { zone: "Bust / chest", status: status(match) },
    { zone: "Waist", status: status(match) },
    { zone: "Hips", status: status(diff >= 0) },
  ];
  return { score, verdict, zones, diff };
}

export function fallbackExplanation(tried: Size, recommended: Size, confidence: number): string {
  if (tried === recommended) {
    return `Final recommendation: go with ${recommended}. Size ${recommended} matches your measurements with ${confidence}% confidence. Expected fit: true to size.`;
  }
  const diff = ORDER[tried] - ORDER[recommended];
  return `Final recommendation: switch to ${recommended}. You tried ${tried}, but your measurements point to ${recommended}. ${
    diff < 0 ? `The ${tried} will pull at the bust and waist.` : `The ${tried} will hang loose at the waist.`
  }`;
}
