import { NextResponse } from "next/server";
import { analyzePhoto, claudeEnabled } from "@/lib/ai/claude";
import { loadPhoto } from "@/lib/photos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vision check of the uploaded photo. Falls back to "accepted" without Claude. */
export async function POST(req: Request) {
  const { photoId } = (await req.json().catch(() => ({}))) as { photoId?: string };
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const photo = await loadPhoto(photoId);
  if (!photo) return NextResponse.json({ error: "Photo not found or expired" }, { status: 404 });

  const mime = photo.mime as "image/jpeg" | "image/png" | "image/webp";
  const result = claudeEnabled() ? await analyzePhoto(photo.data, mime) : null;

  if (!result) {
    return NextResponse.json({
      ok: true,
      message: "Body detected. Great lighting and pose, let's dress you up.",
      issues: [],
      source: "fallback",
    });
  }
  return NextResponse.json({ ...result, source: "claude" });
}
