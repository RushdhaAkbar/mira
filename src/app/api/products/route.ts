import { NextResponse } from "next/server";
import { getProducts } from "@/lib/productsServer";

export const dynamic = "force-dynamic";

/** Catalogue from MongoDB (falls back to the bundled seed list). */
export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
}
