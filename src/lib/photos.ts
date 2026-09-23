import { randomUUID } from "crypto";
import { getDb, memory, PHOTO_TTL_MS } from "./mongodb";

export interface StoredPhoto {
  id: string;
  mime: string;
  data: string; // base64
}

/** Parse a data: URL into mime + base64. */
export function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], base64: m[2] };
}

export async function savePhoto(mime: string, base64: string): Promise<string> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + PHOTO_TTL_MS);
  const db = await getDb();
  if (db) {
    await db.collection("photos").insertOne({ _id: id as never, mime, data: base64, createdAt: new Date(), expiresAt });
  } else {
    memory().photos.set(id, { id, mime, data: base64, expiresAt: expiresAt.getTime() });
  }
  return id;
}

export async function loadPhoto(id: string): Promise<StoredPhoto | null> {
  const db = await getDb();
  if (db) {
    const doc = await db.collection("photos").findOne({ _id: id as never });
    if (!doc) return null;
    return { id, mime: doc.mime, data: doc.data };
  }
  const p = memory().photos.get(id);
  return p ? { id, mime: p.mime, data: p.data } : null;
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.collection("photos").deleteOne({ _id: id as never });
    await db.collection("tryons").deleteMany({ photoId: id });
  } else {
    memory().photos.delete(id);
  }
}
