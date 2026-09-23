"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowIcon } from "@/components/Icons";
import { ChipRow, PageHeader, ProgressSteps, Section, StickyCta, Swatch } from "@/components/ui";
import { ACCESSORIES, PRODUCTS, findProduct, formatLKR } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { AccessoryKey, Size } from "@/lib/types";

const OVERLAY_WIDTH: Record<Size, number> = { S: 36, M: 42, L: 49 };

interface TryOnResponse {
  mode?: "ai" | "overlay";
  image?: string;
  error?: string;
}

async function requestTryOn(payload: {
  photoId: string | null;
  productId: string;
  colorHex: string;
  size: Size;
  accessories: string[];
}): Promise<TryOnResponse> {
  try {
    const res = await fetch("/api/tryon", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as TryOnResponse;
    if (!res.ok) return { mode: "overlay", error: data.error || "Try-on failed" };
    return data;
  } catch (e) {
    return { mode: "overlay", error: e instanceof Error ? e.message : "Try-on failed" };
  }
}

export default function TryOnPage() {
  const router = useRouter();
  const { state, set, toast, hydrated } = useStore();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const product = findProduct(state.productId) ?? PRODUCTS[0];
  const color = product.colors.find((c) => c.hex === state.colorHex) ?? product.colors[0];
  const accessoryKeys = (Object.keys(state.accessories) as AccessoryKey[]).filter((k) => state.accessories[k]);
  const accessoryKey = accessoryKeys.join("|");

  const payload = useMemo(
    () => ({
      photoId: state.photoId,
      productId: product.id,
      colorHex: color.hex,
      size: state.trySize,
      accessories: accessoryKey ? accessoryKey.split("|") : [],
    }),
    [state.photoId, product.id, color.hex, state.trySize, accessoryKey],
  );

  /** Apply a try-on response to the store (called from promise callbacks only). */
  const apply = useCallback(
    (r: TryOnResponse) => {
      if (r.mode === "ai" && r.image) {
        set({ tryOnImage: r.image, tryOnMode: "ai" });
        setNote(null);
      } else {
        set({ tryOnImage: null, tryOnMode: "overlay" });
        setNote(r.error ?? "Preview mode: the photorealistic render switches on once the image API key is added.");
      }
    },
    [set],
  );

  // Automatic first render when the shopper arrives with a photo but no result yet.
  const autoRendering = hydrated && Boolean(state.photoId) && state.tryOnMode === null;
  useEffect(() => {
    if (!autoRendering || !payload.photoId) return;
    let cancelled = false;
    requestTryOn(payload).then((r) => {
      if (!cancelled) apply(r);
    });
    return () => {
      cancelled = true;
    };
  }, [autoRendering, payload, apply]);

  const render = async () => {
    if (!payload.photoId) return;
    setBusy(true);
    setNote(null);
    apply(await requestTryOn(payload));
    setBusy(false);
  };

  useEffect(() => {
    if (hydrated && !state.photoId) router.replace("/upload");
  }, [hydrated, state.photoId, router]);

  const addToBag = () => {
    set((s) => ({
      cart: [...s.cart, { productId: product.id, name: product.name, size: s.trySize, colorHex: color.hex, image: product.image, priceLKR: product.priceLKR }],
    }));
    toast(`Added to bag: ${product.name} · size ${state.trySize}`);
  };

  const showAi = state.tryOnMode === "ai" && state.tryOnImage;
  const loading = busy || autoRendering;

  return (
    <div>
      <ProgressSteps step={3} />
      <PageHeader eyebrow="Step 3 of 4" title="Virtual try-on" subtitle={`${product.name} · size ${state.trySize} · ${formatLKR(product.priceLKR)}`} />

      <Section>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-line bg-chip">
          {showAi ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.tryOnImage!} alt={`You wearing the ${product.name}`} className="h-full w-full object-cover fade-up" />
          ) : state.photoPreview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.photoPreview} alt="Your photo" className="h-full w-full object-cover" />
              {/* 2D garment overlay preview, used until the AI render is available */}
              <div
                className="absolute left-1/2 top-[27%] -translate-x-1/2 rounded-[40%_40%_18%_18%/30%_30%_10%_10%] opacity-85 shadow-lg transition-all duration-500"
                style={{
                  width: `${OVERLAY_WIDTH[state.trySize]}%`,
                  height: product.type === "dress" ? "52%" : product.type === "bottom" ? "40%" : "30%",
                  top: product.type === "bottom" ? "48%" : "27%",
                  background: `linear-gradient(160deg, ${color.hex}, color-mix(in srgb, ${color.hex} 70%, black))`,
                }}
                aria-hidden
              />
              {state.accessories.necklace && (
                <div className="absolute left-1/2 top-[25%] h-5 w-[22%] -translate-x-1/2 rounded-b-full border-2 border-t-0 border-accent" aria-hidden />
              )}
              {state.accessories.sunglasses && (
                <div className="absolute left-1/2 top-[13%] flex -translate-x-1/2 gap-1" aria-hidden>
                  <span className="h-3.5 w-6 rounded-full bg-ink/80" />
                  <span className="h-3.5 w-6 rounded-full bg-ink/80" />
                </div>
              )}
              {state.accessories.bag && (
                <div className="absolute right-[14%] top-[52%] h-[13%] w-[14%] rounded-md border border-accent-ink bg-accent" aria-hidden />
              )}
            </>
          ) : null}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-panel/80 backdrop-blur-sm">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
              <span className="text-[0.74rem] font-semibold text-ink">Draping the garment…</span>
              <span className="text-[0.66rem] text-ink-soft">Usually 10 to 20 seconds</span>
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-panel/90 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft">
            {showAi ? "AI render" : "Preview"}
          </span>
        </div>
        {note && <p className="mt-2 text-[0.7rem] text-ink-soft">{note}</p>}
      </Section>

      <Section title="Colour">
        <div className="flex items-center gap-2">
          {product.colors.map((c) => (
            <Swatch key={c.hex} hex={c.hex} name={c.name} selected={c.hex === color.hex} onClick={() => set({ colorHex: c.hex, tryOnImage: null, tryOnMode: null })} />
          ))}
          <span className="ml-2 text-[0.74rem] text-ink-soft">{color.name}</span>
        </div>
      </Section>

      <Section
        title="Size"
        aside={state.recommendation && <span className="text-[0.7rem] font-semibold text-accent-ink">Recommended: {state.recommendation.size}</span>}
      >
        <ChipRow
          options={(["S", "M", "L"] as Size[]).map((s) => ({ value: s, label: s }))}
          value={state.trySize}
          onChange={(v) => set({ trySize: v as Size, tryOnImage: null, tryOnMode: null, fit: null })}
        />
      </Section>

      <Section title="Accessories">
        <ChipRow
          multi
          options={ACCESSORIES.map((a) => ({ value: a.key, label: a.label }))}
          value={accessoryKeys}
          onChange={(v) => set((s) => ({ accessories: { ...s.accessories, [v]: !s.accessories[v as AccessoryKey] }, tryOnImage: null, tryOnMode: null }))}
        />
      </Section>

      <Section>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={render} disabled={loading || !state.photoId}>
            {showAi ? "Re-render" : "Render with AI"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={addToBag}>
            Add to bag
          </button>
        </div>
        <Link href="/shop" className="mt-2 block text-center text-[0.72rem] font-semibold text-ink-soft underline-offset-2 hover:underline">
          Change garment
        </Link>
      </Section>

      <StickyCta>
        <button type="button" className="btn btn-primary" onClick={() => router.push("/results")} disabled={loading}>
          Analyze my fit <ArrowIcon width={16} height={16} />
        </button>
      </StickyCta>
    </div>
  );
}
