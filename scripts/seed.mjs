// Loads the catalogue and its product photos into MongoDB.
// Usage: npm run seed   (reads MONGODB_URI and MONGODB_DB from .env)
// Safe to re-run: products are upserted by id, and any product no longer in
// the catalogue is marked inactive rather than deleted.
import dns from "node:dns";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Binary, MongoClient } from "mongodb";

const root = path.resolve(import.meta.dirname, "..");
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Run with: node --env-file=.env scripts/seed.mjs");
  process.exit(1);
}
// Same DNS workaround as the app, for routers that refuse SRV lookups.
if (uri.startsWith("mongodb+srv://")) {
  const servers = ["8.8.8.8", "1.1.1.1", ...dns.getServers()];
  dns.setServers(servers);
  dns.promises.setServers(servers);
}

const { products } = JSON.parse(await readFile(path.join(root, "src", "data", "catalog.json"), "utf8"));
const client = new MongoClient(uri);
await client.connect();
const col = client.db(process.env.MONGODB_DB || "mira").collection("products");
await col.createIndex({ id: 1 }, { unique: true });

// Earlier versions stored products with _id = id and no image; clear those out.
await col.deleteMany({ imageData: { $exists: false } });

let withImage = 0;
for (const [order, p] of products.entries()) {
  let imageData = null;
  try {
    imageData = new Binary(await readFile(path.join(root, "public", "products", `${p.id}.jpg`)));
    withImage++;
  } catch {
    console.warn(`no image for ${p.id} (run npm run images first)`);
  }
  await col.updateOne(
    { id: p.id },
    {
      $set: { ...p, order, active: true, imageMime: "image/jpeg", ...(imageData ? { imageData } : {}), updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  console.log(`upserted ${p.id}`);
}
const ids = products.map((p) => p.id);
const retired = await col.updateMany({ id: { $nin: ids } }, { $set: { active: false } });

console.log(`\n${products.length} products seeded, ${withImage} with images, ${retired.modifiedCount} retired.`);
await client.close();
