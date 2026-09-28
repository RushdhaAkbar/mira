"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ComingSoon } from "@/components/ComingSoon";
import { FeedbackSheet } from "@/components/FeedbackSheet";
import { ArrowIcon, SparkIcon } from "@/components/Icons";
import { ChipRow, PageHeader, ProgressSteps, Section, Split, StickyCta, Swatch, useVariantGuard } from "@/components/ui";
import { formatLKR } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { AiQuota, Size } from "@/lib/types";

const OVERLAY_WIDTH: Record<Size, number> = { S: 36, M: 42, L: 49 };

interface TryOnResponse {
  mode?: "ai" | "overlay";
  image?: string;
  message?: string;
  cached?: boolean;
  quota?: AiQuota;
}

async function requestTryOn(payload: { photoId: string; productId: string; colorHex: string; size: Size }): Promise<TryOnResponse> {
  try {
    const res = await fetch("/api/tryon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = (await res.json()) as TryOnResponse & { error?: string };
    if (!res.ok) return { mode: "overlay", message: data.error || "Try-on failed" };
    return data;
  } catch {
    return { mode: "overlay", message: "Network problem. Please check your connection and try again." };
  }
}

/** AI virtual try-on (AI version only). */
export default function TryOnPage() {
  const router = useRouter();
  useVariantGuard(["ai"], "/profile");
  const { state, set, toast, hydrated, product, quota, setQuota, aiAvailable } = useStore();
  const [busy, setBusy] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const promptedRef = useRef(false);

  const color = product.colors.find((c) => c.hex === state.colorHex) ?? product.colors[0];
  const look = state.photoId ? { photoId: state.photoId, productId: product.id, colorHex: color.hex, size: state.trySize } : null;
  const onAiLook =
    Boolean(look && state.aiLook) &&
    state.aiLook!.photoId === look!.photoId &&
    state.aiLook!.productId === look!.productId &&
    state.aiLook!.colorHex === look!.colorHex &&
    state.aiLook!.size === look!.size;
  const showAi = onAiLook && state.tryOnMode === "ai" && Boolean(state.tryOnImage);
  const hasAllowance = quota ? quota.remaining > 0 : true;
  const canGenerate = aiAvailable && Boolean(look) && !onAiLook && hasAllowance;
  const feedbackDone = state.feedbackGiven.includes("ai");

  // Without an uploaded photo there is nothing to try on.
  useEffect(() => {
    if (hydrated && state.variant === "ai" && !state.photoId) router.replace("/upload");
  }, [hydrated, state.variant, state.photoId, router]);

  // Returning to the look already rendered: fetch it from the server cache (free, no allowance used).
  const needsRefetch = hydrated && onAiLook && !state.tryOnImage;
  useEffect(() => {
    if (!needsRefetch || !state.aiLook) return;
    let cancelled = false;
    requestTryOn(state.aiLook).then((r) => {
      if (!cancelled && r.mode === "ai" && r.image) set({ tryOnImage: r.image, tryOnMode: "ai" });
    });
    return () => {
      cancelled = true;
    };
  }, [needsRefetch, state.aiLook, set]);

  const generate = async () => {
    if (!look) return;
    setBusy(true);
    set({ tryOnNote: null });
    const r = await requestTryOn(look);
    if (r.quota) setQuota(r.quota);
    if (r.mode === "ai" && r.image) {
      set({ tryOnImage: r.image, tryOnMode: "ai", aiLook: look, tryOnNote: null });
      // Ask for feedback straight after the try-on appears.
      if (!feedbackDone && !promptedRef.current) {
        promptedRef.current = true;
        window.setTimeout(() => setFeedbackOpen(true), 2500);
      }
    } else {
      set({ tryOnMode: "overlay", tryOnNote: r.message ?? "The AI try-on is unavailable right now." });
    }
    setBusy(false);
  };

  const backToAiLook = () => {
    if (!state.aiLook) return;
    set({ productId: state.aiLook.productId, colorHex: state.aiLook.colorHex, trySize: state.aiLook.size, fit: null });
  };

  const addToBag = () => {
    set((s) => ({
      cart: [...s.cart, { productId: product.id, name: product.name, size: s.trySize, colorHex: color.hex, image: product.image, priceLKR: product.priceLKR }],
    }));
    toast(`Added to bag: ${product.name} · size ${state.trySize}`);
  };

  const stage = (
    <Section>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-line bg-chip">
        {showAi ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.tryOnImage!} alt={`You wearing the ${product.name}`} className="h-full w-full object-cover fade-up" />
        ) : state.photoPreview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.photoPreview} alt="Your photo" className="h-full w-full object-cover" />
            {/* Live preview: a simple garment shape, shown until (or instead of) the AI render. */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-[40%_40%_18%_18%/30%_30%_10%_10%] opacity-80 shadow-lg transition-all duration-500"
              style={{
                width: `${OVERLAY_WIDTH[state.trySize]}%`,
                height: product.type === "dress" ? "52%" : "30%",
                top: "27%",
                background: `linear-gradient(160deg, ${color.hex}, color-mix(in srgb, ${color.hex} 70%, black))`,
              }}
              aria-hidden
            />
          </>
        ) : null}

        {(busy || needsRefetch) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-panel/80 backdrop-blur-sm">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
            <span className="text-[0.74rem] font-semibold text-ink">{busy ? "AI is dressing you…" : "Loading your AI try-on…"}</span>
            {busy && <span className="text-[0.66rem] text-ink-soft">Usually 10 to 30 seconds</span>}
          </div>
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${
            showAi ? "bg-accent text-white" : "bg-panel/90 text-ink-soft"
          }`}
        >
          {showAi ? "AI render" : "Live preview"}
        </span>
      </div>
      {state.tryOnNote && <p className="mx-auto mt-2 max-w-md text-[0.72rem] text-ink-soft">{state.tryOnNote}</p>}
    </Section>
  );

  const controls = (
    <>
      <Section>
        {canGenerate ? (
          <div className="card border-accent/50 p-4">
            <div className="flex items-center gap-2">
              <SparkIcon width={18} height={18} className="text-accent" />
              <b className="text-[0.86rem] text-ink">You have 1 AI try-on</b>
            </div>
            <p className="mt-1 text-[0.74rem] text-ink-soft">Choose your colour and size below first. During testing each person gets one AI render.</p>
            <button type="button" className="btn btn-accent mt-3" onClick={generate} disabled={busy}>
              {busy ? "Generating…" : `Generate my AI try-on · ${color.name}, ${state.trySize}`}
            </button>
          </div>
        ) : !onAiLook && !hasAllowance ? (
          <div className="card p-4">
            <b className="block text-[0.84rem] text-ink">AI try-on used</b>
            <p className="mt-1 text-[0.74rem] text-ink-soft">You&apos;ve used your AI try-on for this testing phase, so other looks show the live preview.</p>
            {state.aiLook && state.aiLook.photoId === state.photoId && (
              <button type="button" className="btn btn-ghost mt-3" onClick={backToAiLook}>
                Show my AI try-on again
              </button>
            )}
          </div>
        ) : !aiAvailable ? (
          <p className="text-[0.72rem] text-ink-soft">AI try-on is not available right now. You can still use the live preview.</p>
        ) : null}
      </Section>

      <Section title="Colour">
        <div className="flex items-center gap-2">
          {product.colors.map((c) => (
            <Swatch key={c.hex} hex={c.hex} name={c.name} selected={c.hex === color.hex} onClick={() => set({ colorHex: c.hex, fit: null, tryOnNote: null })} />
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
          onChange={(v) => set({ trySize: v as Size, fit: null, tryOnNote: null })}
        />
      </Section>

      <Section>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setFeedbackOpen(true)}>
            {feedbackDone ? "Feedback sent ✓" : "Rate this try-on"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={addToBag}>
            Add to bag
          </button>
        </div>
      </Section>

      <StickyCta>
        <button type="button" className="btn btn-primary" onClick={() => router.push("/results")} disabled={busy}>
          See my fit results <ArrowIcon width={16} height={16} />
        </button>
      </StickyCta>

      <Section>
        <ComingSoon compact />
      </Section>
    </>
  );

  return (
    <div>
      <ProgressSteps step={3} />
      <PageHeader eyebrow="Step 3 of 4" title="Virtual try-on" subtitle={`${product.name} · size ${state.trySize} · ${formatLKR(product.priceLKR)}`} />
      <Split left={stage} right={controls} />
      <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
