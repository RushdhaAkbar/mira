import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";

/**
 * Some home and mobile routers refuse the DNS SRV lookup that
 * mongodb+srv:// addresses need (querySrv ECONNREFUSED). Outside Vercel,
 * route those lookups through public DNS first. This only affects
 * dns.resolve* (used by the Mongo driver), not normal hostname lookups.
 */
let dnsPatched = false;
function preferPublicDnsForSrv(uri: string) {
  if (dnsPatched || process.env.VERCEL || !uri.startsWith("mongodb+srv://")) return;
  dnsPatched = true;
  const publicDns = ["8.8.8.8", "1.1.1.1"];
  const current = dns.getServers().filter((s) => !publicDns.includes(s));
  // The driver uses dns.promises, which can hold its own server list, so set both.
  dns.setServers([...publicDns, ...current]);
  dns.promises.setServers([...publicDns, ...current]);
}

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
    preferPublicDnsForSrv(uri);
    const client = new MongoClient(uri);
    global.__miraMongo = { client, promise: client.connect(), indexed: false };
  }
  const cached = global.__miraMongo;
  let client: MongoClient;
  try {
    client = await cached.promise;
  } catch (err) {
    // Forget the failed attempt so the next request retries instead of failing forever.
    global.__miraMongo = undefined;
    throw err;
  }
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
      db.collection("feedback").createIndex({ createdAt: -1 }),
      db.collection("feedback").createIndex({ variant: 1 }),
      db.collection("ai_generations").createIndex({ createdAt: -1 }),
    ]);
  }
  return db;
}

export const PHOTO_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Plain-English cause of a MongoDB failure, safe to show on screen (never
 * includes the connection string). Helps fix deployment settings quickly.
 */
export function describeDbError(err: unknown): string {
  const e = err as { name?: string; message?: string; code?: number | string; codeName?: string };
  const msg = `${e?.name ?? ""} ${e?.codeName ?? ""} ${e?.message ?? ""}`.toLowerCase();
  if (msg.includes("bad auth") || msg.includes("authentication failed") || e?.code === 8000 || e?.code === 18)
    return "Database login failed. Check the username and password in MONGODB_URI.";
  if (msg.includes("invalid scheme") || msg.includes("mongoparseerror") || msg.includes("uri must"))
    return "MONGODB_URI is not a valid address. On Vercel, paste it without quotes.";
  if (msg.includes("querysrv") || msg.includes("enotfound"))
    return "Database address not found. Check the cluster name in MONGODB_URI.";
  if (msg.includes("serverselection") || msg.includes("timed out") || msg.includes("econnrefused") || msg.includes("whitelist"))
    return "Can't reach the database. In MongoDB Atlas > Network Access, allow 0.0.0.0/0.";
  return "Database error. See the server logs for details.";
}

/* ---------- in-memory fallback for local dev without Mongo ---------- */

interface MemoryPhoto {
  id: string;
  mime: string;
  data: string;
  expiresAt: number;
}

interface MemoryStore {
  photos: Map<string, MemoryPhoto>;
  tryons: Map<string, string>;
  testers: Map<string, number>; // testerId -> AI generations used
  generations: number;
  feedback: Record<string, unknown>[];
}

declare global {
  var __miraMemory: MemoryStore | undefined;
}

export function memory(): MemoryStore {
  if (!global.__miraMemory) {
    global.__miraMemory = { photos: new Map(), tryons: new Map(), testers: new Map(), generations: 0, feedback: [] };
  }
  const m = global.__miraMemory;
  const now = Date.now();
  for (const [id, p] of m.photos) if (p.expiresAt < now) m.photos.delete(id);
  return m;
}
