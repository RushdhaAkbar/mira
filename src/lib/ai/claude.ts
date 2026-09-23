import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { FitZone, Measurements, Size, StylistOutfit } from "../types";

/**
 * Claude powers three analysis features. Every function returns null when
 * ANTHROPIC_API_KEY is missing or the call fails, and the API route falls
 * back to the rule-based template so the site keeps working.
 */

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

export function claudeEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM = `You are Mira, a warm and honest virtual fitting-room assistant for a fashion e-commerce app in Sri Lanka.
Write in plain, friendly English for shoppers aged 18 to 34. Be concise. Never invent measurements. Never use em dashes.`;

/* ---------- 1. Photo quality check (vision) ---------- */

const PhotoCheck = z.object({
  usable: z.boolean(),
  full_body_visible: z.boolean(),
  issues: z.array(z.string()),
  message: z.string(),
});

export async function analyzePhoto(
  base64: string,
  mime: "image/jpeg" | "image/png" | "image/webp",
): Promise<{ ok: boolean; message: string; issues: string[] } | null> {
  const c = client();
  if (!c) return null;
  try {
    const res = await c.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      output_config: { effort: "low", format: zodOutputFormat(PhotoCheck) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mime, data: base64 } },
            {
              type: "text",
              text: "Check whether this photo works for a virtual clothing try-on. It should show one person, full body from head to feet, facing the camera, arms slightly away from the body, in reasonable light. List concrete issues if any, and write one short friendly sentence for the shopper.",
            },
          ],
        },
      ],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    const p = res.parsed_output;
    return { ok: p.usable && p.full_body_visible, message: p.message, issues: p.issues };
  } catch (err) {
    console.error("[claude] analyzePhoto failed", err);
    return null;
  }
}

/* ---------- 2. Fit explanation ---------- */

export async function explainFit(input: {
  productName: string;
  fabric: string;
  garmentType: string;
  measurements: Measurements;
  fitPref: string;
  tried: Size;
  recommended: Size;
  confidence: number;
  score: number;
  zones: FitZone[];
}): Promise<string | null> {
  const c = client();
  if (!c) return null;
  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM,
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: `A shopper tried the "${input.productName}" (${input.garmentType}, ${input.fabric}) in size ${input.tried}.
Their measurements: height ${input.measurements.height} cm, weight ${input.measurements.weight} kg, bust ${input.measurements.bust} cm, waist ${input.measurements.waist} cm, hips ${input.measurements.hips} cm. Preferred fit: ${input.fitPref}.
Our sizing engine recommends size ${input.recommended} with ${input.confidence}% confidence and scored this try-on ${input.score}/100.
Per-zone result: ${input.zones.map((z) => `${z.zone}: ${z.status}`).join(", ")}.

Write the final recommendation for the shopper in 2 to 3 short sentences. Start with "Final recommendation:" and name the size to buy. Mention the one zone that matters most. Do not repeat all the numbers.`,
        },
      ],
    });
    if (res.stop_reason === "refusal") return null;
    const text = res.content.find((b) => b.type === "text");
    return text && text.type === "text" ? text.text.trim() : null;
  } catch (err) {
    console.error("[claude] explainFit failed", err);
    return null;
  }
}

/* ---------- 3. AI stylist ---------- */

const Outfits = z.object({
  outfits: z.array(
    z.object({
      title: z.string(),
      occasion: z.string(),
      pieces: z.array(z.string()),
      why: z.string(),
      match: z.number(),
    }),
  ),
});

export async function stylist(input: {
  occasion: string;
  bodyShape: string;
  styleTags: string[];
  fitPref: string;
  recommendedSize: Size | null;
  catalogue: { name: string; type: string; colors: string[] }[];
}): Promise<StylistOutfit[] | null> {
  const c = client();
  if (!c) return null;
  try {
    const res = await c.messages.parse({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM,
      output_config: { effort: "medium", format: zodOutputFormat(Outfits) },
      messages: [
        {
          role: "user",
          content: `Suggest 3 outfits for the occasion "${input.occasion}".
Shopper profile: body shape ${input.bodyShape}, preferred fit ${input.fitPref}, style tags ${input.styleTags.join(", ") || "none"}, usual size ${input.recommendedSize ?? "unknown"}.
Build each outfit mainly from this catalogue (name, type, colours): ${input.catalogue.map((p) => `${p.name} (${p.type}; ${p.colors.join("/")})`).join("; ")}. You may add one generic accessory or shoe per outfit.
For each outfit give a short title, the occasion, 2 to 4 pieces, one sentence on why it flatters this body shape, and a style-match percentage between 70 and 98.`,
        },
      ],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    return res.parsed_output.outfits.map((o) => ({ ...o, match: Math.round(Math.min(98, Math.max(70, o.match))) }));
  } catch (err) {
    console.error("[claude] stylist failed", err);
    return null;
  }
}
