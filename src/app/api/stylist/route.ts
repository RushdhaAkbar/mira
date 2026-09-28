import { NextResponse } from "next/server";
import { claudeEnabled, stylist } from "@/lib/ai/claude";
import { getProducts } from "@/lib/productsServer";
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
      pieces: ["Tailored blazer in camel", "Satin blouse in ivory", "Slim black trousers"],
      why: "A defined shoulder and a fluid blouse balance the frame and lengthen the torso.",
      match: 91,
    },
    {
      title: "Golden hour",
      occasion: "Brunch",
      pieces: ["Linen wrap dress in terracotta", "Tan sandals"],
      why: "The tie waist draws the eye to the narrowest point for an easy hourglass line.",
      match: 88,
    },
    {
      title: "Easy weekend",
      occasion: "Weekend",
      pieces: ["Classic denim jacket", "Classic cotton tee in white", "Straight-leg jeans"],
      why: "Clean layers with structure at the shoulder flatter almost every body shape.",
      match: 85,
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
        catalogue: (await getProducts()).map((p) => ({ name: p.name, type: p.type, colors: p.colors.map((c) => c.name) })),
      })
    : null;

  return NextResponse.json({
    bodyShape: shape,
    outfits: outfits ?? FALLBACK.default.map((o) => ({ ...o, occasion })),
    source: outfits ? "claude" : "fallback",
  });
}
