import { NextResponse } from "next/server";
import { deletePhoto, loadPhoto } from "@/lib/photos";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const photo = await loadPhoto(id);
  if (!photo) return NextResponse.json({ error: "Photo not found or expired" }, { status: 404 });
  return new NextResponse(Buffer.from(photo.data, "base64"), {
    headers: { "content-type": photo.mime, "cache-control": "private, max-age=3600" },
  });
}

/** Shopper-initiated deletion (the privacy promise, ahead of the 24 h TTL). */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await deletePhoto(id);
  return NextResponse.json({ deleted: true });
}
