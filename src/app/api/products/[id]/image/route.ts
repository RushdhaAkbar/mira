import { NextResponse } from "next/server";
import { getProductImage } from "@/lib/productsServer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Product photo stored in MongoDB; falls back to the static copy in /public/products. */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  if (!/^[a-z0-9-]+$/.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const img = await getProductImage(id);
  if (!img) return NextResponse.redirect(new URL(`/products/${id}.jpg`, req.url));

  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      "content-type": img.mime,
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
