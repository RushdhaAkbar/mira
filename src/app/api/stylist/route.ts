import { NextResponse } from "next/server";
import { claudeEnabled, stylist } from "@/lib/ai/claude";
import { PRODUCTS } from "@/lib/products";
import { bodyShape } from "@/lib/sizing";
import type { FitPref, Measurements, Size, StylistOutfit } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  occasion?: string;
  measurements?: Measurements;
  styleTags?: string[];
  fitPref?: FitPref;
  recommendedSize?: Size | null;
}

const FALLBACK: Record<string, StylistOutfit[]> = {
  default: [
    {
      title: "Soft tailoring",
      occasion: "Work",
      pieces: ["Tailored blazer in camel", "Moss silk blouse", "Wide-leg trouser in sand"],
      why: "A defined shoulder and high-rise trouser lengthen the leg and balance the hip.",
      match: 91,
    },
    {
      title: "Golden hour",
      occasion: "Brunch",
      pieces: ["Linen wrap dress in caramel", "Gold necklace", "Sunglasses"],
      why: "The tie waist draws the eye to the narrowest point for an easy hourglass line.",
      match: 88,
    },
    {
      title: "After dark",
      occasion: "Evening",
      pieces: ["Evening column in charcoal", "Leather handbag", "Slim gold hoops"],
      why: "A bias cut skims the body without clinging, elegant without effort.",
      match: 84,
    },
  ],
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const occasion = body.occasion?.trim() || "Everyday";
  const shape = body.measurements ? bodyShape(body.measurements) : "balanced";

  const outfits = claudeEnabled()
    ? await stylist({
        occasion,
        bodyShape: shape,
        styleTags: body.styleTags ?? [],
        fitPref: body.fitPref ?? "regular",
        recommendedSize: body.recommendedSize ?? null,
        catalogue: PRODUCTS.map((p) => ({ name: p.name, type: p.type, colors: p.colors.map((c) => c.name) })),
      })
    : null;

  return NextResponse.json({
    bodyShape: shape,
    outfits: outfits ?? FALLBACK.default.map((o) => ({ ...o, occasion })),
    source: outfits ? "claude" : "fallback",
  });
}
