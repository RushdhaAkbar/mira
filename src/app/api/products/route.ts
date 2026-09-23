import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * Catalogue. The static list in src/lib/products.ts is the source of truth
 * for the MVP; when Mongo is configured it is seeded there so the admin can
 * edit products later without a redeploy.
 */
export async function GET() {
  const db = await getDb();
  if (!db) return NextResponse.json({ products: PRODUCTS, source: "static" });

  const col = db.collection("products");
  const count = await col.countDocuments();
  if (count === 0) {
    await col.insertMany(PRODUCTS.map((p) => ({ ...p, _id: p.id as never })));
  }
  const docs = await col.find({}, { projection: { _id: 0 } }).toArray();
  return NextResponse.json({ products: docs.length ? docs : PRODUCTS, source: "mongo" });
}
