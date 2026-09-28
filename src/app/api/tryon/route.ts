import { NextResponse } from "next/server";
import { fetchImageAsBase64, imageGenEnabled, renderTryOn } from "@/lib/ai/nanobanana";
import { getDb, memory, PHOTO_TTL_MS } from "@/lib/mongodb";
import { loadPhoto } from "@/lib/photos";
import { getProduct, getProductImage } from "@/lib/productsServer";
import { getQuota, getTesterId, logGeneration, refundGeneration, reserveGeneration } from "@/lib/tester";
import type { Size } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Body {
  photoId?: string;
  productId?: string;
  colorHex?: string;
  size?: Size;
}

const LIMIT_MESSAGES = {
  tester_limit: "You've used your AI try-on for this testing phase. The live preview below is still available.",
  total_limit: "All AI try-ons for this testing round have been used. The live preview below is still available.",
} as const;

/**
 * AI try-on render (AI study arm only).
 * Each tester gets a limited number of renders (default 1). Asking again for a
 * combination already rendered is served from cache and costs nothing.
 * Responds { mode: "ai", image } or { mode: "overlay", reason, message }.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const product = await getProduct(body.productId);
  const size = body.size ?? "M";
  if (!body.photoId || !product) {
    return NextResponse.json({ error: "photoId and productId are required" }, { status: 400 });
  }
  const testerId = await getTesterId();
  if (!imageGenEnabled()) {
    return NextResponse.json({ mode: "overlay", reason: "not_configured", message: "AI try-on is not configured." });
  }

  const color = product.colors.find((c) => c.hex === body.colorHex) ?? product.colors[0];
  const cacheKey = { photoId: body.photoId, productId: product.id, colorHex: color.hex, size };

  // 1. Already rendered this exact look: return it without using the allowance.
  const db = await getDb();
  if (db) {
    const hit = await db.collection("tryons").findOne(cacheKey);
    if (hit) {
      return NextResponse.json({ mode: "ai", image: `data:${hit.mime};base64,${hit.data}`, cached: true, quota: await getQuota(testerId) });
    }
  } else {
    const hit = memory().tryons.get(JSON.stringify(cacheKey));
    if (hit) return NextResponse.json({ mode: "ai", image: hit, cached: true, quota: await getQuota(testerId) });
  }

  // 2. Load inputs before reserving, so a missing photo doesn't cost an attempt.
  const photo = await loadPhoto(body.photoId);
  if (!photo) return NextResponse.json({ error: "Your photo has expired. Please upload it again." }, { status: 404 });
  const stored = await getProductImage(product.id);
  const garment = stored
    ? { base64: stored.data.toString("base64"), mime: stored.mime }
    : await fetchImageAsBase64(new URL(`/products/${product.id}.jpg`, req.url).toString());
  if (!garment) {
    return NextResponse.json({ mode: "overlay", reason: "garment_missing", message: "This garment's photo is unavailable." });
  }

  // 3. Reserve the tester's AI try-on.
  const reserved = await reserveGeneration(testerId);
  if (!reserved.ok) {
    return NextResponse.json({
      mode: "overlay",
      reason: reserved.reason,
      message: LIMIT_MESSAGES[reserved.reason],
      quota: await getQuota(testerId),
    });
  }

  // 4. Render; refund the allowance if the model fails.
  const started = Date.now();
  const rendered = await renderTryOn({
    person: { base64: photo.data, mime: photo.mime },
    garment,
    garmentName: product.name,
    garmentType: product.type,
    colorName: color.name,
    size,
  });
  await logGeneration({ testerId, productId: product.id, success: Boolean(rendered), ms: Date.now() - started });

  if (!rendered) {
    await refundGeneration(testerId);
    return NextResponse.json({
      mode: "overlay",
      reason: "model_failed",
      message: "The AI render didn't work this time. Your try-on wasn't used, so please try again.",
      quota: await getQuota(testerId),
    });
  }

  const image = `data:${rendered.mime};base64,${rendered.base64}`;
  if (db) {
    await db.collection("tryons").insertOne({
      ...cacheKey,
      testerId,
      mime: rendered.mime,
      data: rendered.base64,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + PHOTO_TTL_MS),
    });
  } else {
    memory().tryons.set(JSON.stringify(cacheKey), image);
  }
  return NextResponse.json({ mode: "ai", image, cached: false, quota: await getQuota(testerId) });
}
