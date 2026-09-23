import { NextResponse } from "next/server";
import { fetchImageAsBase64, imageGenEnabled, renderTryOn } from "@/lib/ai/nanobanana";
import { getDb, memory, PHOTO_TTL_MS } from "@/lib/mongodb";
import { loadPhoto } from "@/lib/photos";
import { ACCESSORIES, findProduct } from "@/lib/products";
import type { AccessoryKey, Size } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Body {
  photoId?: string;
  productId?: string;
  colorHex?: string;
  size?: Size;
  accessories?: AccessoryKey[];
}

/**
 * Render the try-on. Returns { mode: "ai", image } when the image model is
 * configured, or { mode: "overlay" } so the client draws the 2D preview.
 * Results are cached per (photo, garment, colour, size) for 24 h.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const product = findProduct(body.productId);
  const size = body.size ?? "M";
  if (!body.photoId || !product) {
    return NextResponse.json({ error: "photoId and productId are required" }, { status: 400 });
  }
  if (!imageGenEnabled()) {
    return NextResponse.json({ mode: "overlay", reason: "GEMINI_API_KEY not set" });
  }

  const color = product.colors.find((c) => c.hex === body.colorHex) ?? product.colors[0];
  const accessories: string[] = [];
  for (const k of body.accessories ?? []) {
    const label = ACCESSORIES.find((a) => a.key === k)?.label;
    if (label) accessories.push(label);
  }
  const cacheKey = { photoId: body.photoId, productId: product.id, colorHex: color.hex, size, acc: accessories.join("|") };

  const db = await getDb();
  if (db) {
    const hit = await db.collection("tryons").findOne(cacheKey);
    if (hit) return NextResponse.json({ mode: "ai", image: `data:${hit.mime};base64,${hit.data}`, cached: true });
  } else {
    const hit = memory().tryons.get(JSON.stringify(cacheKey));
    if (hit) return NextResponse.json({ mode: "ai", image: hit, cached: true });
  }

  const [photo, garment] = await Promise.all([loadPhoto(body.photoId), fetchImageAsBase64(product.image)]);
  if (!photo) return NextResponse.json({ error: "Photo not found or expired" }, { status: 404 });
  if (!garment) return NextResponse.json({ mode: "overlay", reason: "garment image unavailable" });

  const rendered = await renderTryOn({
    person: { base64: photo.data, mime: photo.mime },
    garment,
    garmentName: product.name,
    garmentType: product.type,
    colorName: color.name,
    size,
    accessories,
  });
  if (!rendered) return NextResponse.json({ mode: "overlay", reason: "image model failed" });

  const image = `data:${rendered.mime};base64,${rendered.base64}`;
  if (db) {
    await db.collection("tryons").insertOne({
      ...cacheKey,
      mime: rendered.mime,
      data: rendered.base64,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + PHOTO_TTL_MS),
    });
  } else {
    memory().tryons.set(JSON.stringify(cacheKey), image);
  }
  return NextResponse.json({ mode: "ai", image, cached: false });
}
