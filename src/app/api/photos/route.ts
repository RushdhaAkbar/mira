import { NextResponse } from "next/server";
import { parseDataUrl, savePhoto } from "@/lib/photos";
import { hasMongo } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

/** Upload a photo (JSON body: { dataUrl }). Stored for 24 h, then auto-deleted. */
export async function POST(req: Request) {
  let body: { dataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = body.dataUrl ? parseDataUrl(body.dataUrl) : null;
  if (!parsed) return NextResponse.json({ error: "Send a JPEG, PNG or WebP data URL" }, { status: 400 });
  if (parsed.base64.length * 0.75 > MAX_BYTES) {
    return NextResponse.json({ error: "Photo is too large (max 4 MB)" }, { status: 413 });
  }

  const id = await savePhoto(parsed.mime, parsed.base64);
  return NextResponse.json({ id, persistent: hasMongo(), expiresInHours: 24 });
}
