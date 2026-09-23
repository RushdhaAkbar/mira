import { MongoClient, type Db } from "mongodb";

/**
 * Cached MongoDB connection for serverless (Vercel) environments.
 * Returns null when MONGODB_URI is not configured so routes can fall back
 * to in-memory storage during local development.
 */

declare global {
  var __miraMongo: { client: MongoClient; promise: Promise<MongoClient>; indexed: boolean } | undefined;
}

export function hasMongo(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function getDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (!global.__miraMongo) {
    const client = new MongoClient(uri);
    global.__miraMongo = { client, promise: client.connect(), indexed: false };
  }
  const cached = global.__miraMongo;
  const client = await cached.promise;
  const db = client.db(process.env.MONGODB_DB || "mira");

  if (!cached.indexed) {
    cached.indexed = true;
    // Photos and try-on renders are deleted automatically 24 h after upload.
    await Promise.all([
      db.collection("photos").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("tryons").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("tryons").createIndex({ photoId: 1, productId: 1, colorHex: 1, size: 1 }),
      db.collection("orders").createIndex({ createdAt: -1 }),
      db.collection("profiles").createIndex({ createdAt: -1 }),
    ]);
  }
  return db;
}

export const PHOTO_TTL_MS = 24 * 60 * 60 * 1000;

/* ---------- in-memory fallback for local dev without Mongo ---------- */

interface MemoryPhoto {
  id: string;
  mime: string;
  data: string;
  expiresAt: number;
}

declare global {
  var __miraMemory: { photos: Map<string, MemoryPhoto>; tryons: Map<string, string> } | undefined;
}

export function memory() {
  if (!global.__miraMemory) {
    global.__miraMemory = { photos: new Map(), tryons: new Map() };
  }
  const m = global.__miraMemory;
  const now = Date.now();
  for (const [id, p] of m.photos) if (p.expiresAt < now) m.photos.delete(id);
  return m;
}
