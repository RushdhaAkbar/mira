/**
 * Virtual try-on rendering with Google's Nano Banana image model
 * (gemini-2.5-flash-image) through the Gemini REST API.
 *
 * Input: the shopper's photo plus the garment photo. Output: PNG base64.
 * Returns null when GEMINI_API_KEY is missing or the call fails, in which
 * case the client shows the 2D overlay preview instead.
 */

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

export function imageGenEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface TryOnInput {
  person: { base64: string; mime: string };
  garment: { base64: string; mime: string };
  garmentName: string;
  garmentType: string;
  colorName: string;
  size: "S" | "M" | "L";
  accessories: string[];
}

const SIZE_HINT: Record<TryOnInput["size"], string> = {
  S: "The garment is one size smaller than the person usually wears, so it should look slightly snug at the bust and waist.",
  M: "The garment fits the person true to size with a natural drape.",
  L: "The garment is one size larger than the person usually wears, so it should look a little loose and relaxed at the waist.",
};

export async function renderTryOn(input: TryOnInput): Promise<{ base64: string; mime: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const prompt = [
    `Virtual try-on. The first image is a person. The second image shows a ${input.garmentType} called "${input.garmentName}" in the colour ${input.colorName}.`,
    `Dress the person from the first image in that garment. Keep the person's face, hair, skin tone, body shape, pose, hands and the background exactly as they are. Replace only the clothing the garment would cover.`,
    SIZE_HINT[input.size],
    input.accessories.length ? `Also add these accessories naturally: ${input.accessories.join(", ")}.` : "",
    `Photorealistic, natural lighting, no text or watermark, output a single image at the same framing as the first image.`,
  ]
    .filter(Boolean)
    .join(" ");

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: input.person.mime, data: input.person.base64 } },
          { inline_data: { mime_type: input.garment.mime, data: input.garment.base64 } },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      },
    );
    if (!res.ok) {
      console.error("[nanobanana] HTTP", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[];
    };
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData) {
      console.error("[nanobanana] no image in response", JSON.stringify(json).slice(0, 500));
      return null;
    }
    return { base64: part.inlineData.data, mime: part.inlineData.mimeType || "image/png" };
  } catch (err) {
    console.error("[nanobanana] request failed", err);
    return null;
  }
}

/** Fetch a public image URL and return it as base64 for the model. */
export async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return { base64: buf.toString("base64"), mime };
  } catch {
    return null;
  }
}
