// Generates one clean e-commerce photo per catalogue item with fal.ai Nano Banana.
// Usage: npm run images   (reads FAL_KEY from .env; skips images that already exist)
// Cost: about USD 0.04 per image.
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "products");
const { products } = JSON.parse(await readFile(path.join(root, "src", "data", "catalog.json"), "utf8"));

const key = process.env.FAL_KEY;
if (!key) {
  console.error("FAL_KEY is not set. Run with: node --env-file=.env scripts/generate-product-images.mjs");
  process.exit(1);
}
await mkdir(outDir, { recursive: true });

const only = process.argv.slice(2); // optional: regenerate specific ids
const exists = (p) => access(p).then(() => true, () => false);

for (const p of products) {
  const file = path.join(outDir, `${p.id}.jpg`);
  if (only.length ? !only.includes(p.id) : await exists(file)) {
    console.log(`skip  ${p.id}`);
    continue;
  }
  const prompt =
    `Professional e-commerce catalogue photo of ${p.imagePrompt}. ` +
    `Ghost mannequin (invisible mannequin) style, front view, the whole garment visible and centred with space around it, ` +
    `pure white seamless background, soft even studio lighting, realistic fabric texture. ` +
    `No person, no model, no hanger, no text, no logo, no watermark, no props.`;

  let res;
  try {
    res = await fetch("https://fal.run/fal-ai/nano-banana", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Key ${key}` },
      body: JSON.stringify({ prompt, num_images: 1, aspect_ratio: "3:4", output_format: "jpeg" }),
    });
  } catch (err) {
    console.error(`fail  ${p.id}: ${err.cause?.code ?? err.message} (re-run to retry)`);
    continue;
  }
  if (!res.ok) {
    console.error(`fail  ${p.id}: HTTP ${res.status} ${await res.text()}`);
    continue;
  }
  const json = await res.json();
  const url = json.images?.[0]?.url;
  if (!url) {
    console.error(`fail  ${p.id}: no image returned`);
    continue;
  }
  try {
    const img = await fetch(url);
    await writeFile(file, Buffer.from(await img.arrayBuffer()));
  } catch (err) {
    console.error(`fail  ${p.id}: download failed (${err.cause?.code ?? err.message})`);
    continue;
  }
  console.log(`saved ${p.id}.jpg`);
}
