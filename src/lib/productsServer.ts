import { Binary } from "mongodb";
import { getDb } from "./mongodb";
import { SEED_PRODUCTS, productImageUrl } from "./products";
import type { Product } from "./types";

/** Products from MongoDB (seeded with `npm run seed`), falling back to the bundled catalogue. */
export async function getProducts(): Promise<Product[]> {
  try {
    const db = await getDb();
    if (!db) return SEED_PRODUCTS;
    const docs = await db
      .collection("products")
      .find({ active: { $ne: false } }, { projection: { _id: 0, imageData: 0, imageMime: 0, imagePrompt: 0 } })
      .sort({ order: 1 })
      .toArray();
    if (!docs.length) return SEED_PRODUCTS;
    return docs.map((d) => ({ ...(d as unknown as Product), image: productImageUrl(d.id) }));
  } catch (err) {
    console.error("[products] falling back to seed catalogue", err);
    return SEED_PRODUCTS;
  }
}

export async function getProduct(id: string | undefined | null): Promise<Product | undefined> {
  if (!id) return undefined;
  const all = await getProducts();
  return all.find((p) => p.id === id);
}

/** Product photo bytes from MongoDB, or null when not stored there. */
export async function getProductImage(id: string): Promise<{ mime: string; data: Buffer } | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const doc = await db.collection("products").findOne({ id }, { projection: { imageData: 1, imageMime: 1 } });
    if (!doc?.imageData) return null;
    const raw = doc.imageData as Binary | Buffer;
    const data = raw instanceof Binary ? Buffer.from(raw.buffer) : Buffer.from(raw);
    return { mime: (doc.imageMime as string) || "image/jpeg", data };
  } catch (err) {
    console.error("[products] image lookup failed", err);
    return null;
  }
}
