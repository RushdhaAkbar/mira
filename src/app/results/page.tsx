"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FeedbackSheet } from "@/components/FeedbackSheet";
import { HeartIcon, ShareIcon } from "@/components/Icons";
import { ChipRow, Gauge, PageHeader, ProgressSteps, Section, SizeChart, Split, StickyCta, Swatch } from "@/components/ui";
import { formatLKR } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { FitResult, Size } from "@/lib/types";

const COLOR: Record<FitResult["verdict"], string> = {
  "Highly fit": "var(--good)",
  "Moderate fit": "var(--warn)",
  "Poor fit": "var(--poor)",
};

export default function ResultsPage() {
  const router = useRouter();
  const { state, set, toast, hydrated, product } = useStore();
  const variant = state.variant;
  const isAi = variant === "ai";
  const [error, setError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const promptedRef = useRef(false);
  const feedbackDone = state.feedbackGiven.includes(variant);
  const color = product.colors.find((c) => c.hex === state.colorHex) ?? product.colors[0];

  useEffect(() => {
    if (!hydrated || state.fit) return;
    let cancelled = false;
    fetch("/api/fit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: product.id, measurements: state.measurements, fitPref: state.fitPref, trySize: state.trySize, variant }),
    })
      .then((r) => r.json())
      .then((fit: FitResult) => {
        if (cancelled) return;
        if (fit.score !== undefined) set({ fit });
        else setError("Could not analyze the fit. Please try again.");
      })
      .catch(() => !cancelled && setError("Could not analyze the fit. Please try again."));
    return () => {
      cancelled = true;
    };
  }, [hydrated, state.fit, state.measurements, state.fitPref, state.trySize, product.id, set, variant]);

  const fit = state.fit;
  const busy = hydrated && !fit && !error;

  // Standard version: this is the end of the journey, so ask for feedback once the result is shown.
  useEffect(() => {
    if (isAi || !fit || feedbackDone || promptedRef.current) return;
    const t = window.setTimeout(() => {
      promptedRef.current = true;
      setFeedbackOpen(true);
    }, 3500);
    return () => window.clearTimeout(t);
  }, [isAi, fit, feedbackDone]);

  const buy = (size: Size) => {
    set((s) => ({
      cart: [...s.cart, { productId: product.id, name: product.name, size, colorHex: color.hex, image: product.image, priceLKR: product.priceLKR }],
    }));
    router.push("/checkout");
  };

  const share = async () => {
    const text = `I checked my fit for the ${product.name} on Mira. Fit score ${fit?.score}/100, size ${fit?.recommended}.`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) await navigator.share({ title: "My Mira fit", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast("Copied share text to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  const showAiImage = isAi && state.tryOnMode === "ai" && state.tryOnImage;

  const visual = (
    <Section>
      <div className={`relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-line ${isAi ? "bg-chip" : "bg-white"}`}>
        {showAiImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.tryOnImage!} alt={`You wearing the ${product.name}`} className="h-full w-full object-cover" />
        ) : isAi && state.photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.photoPreview} alt="Your photo" className="h-full w-full object-cover" />
        ) : (
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 90vw, 450px" loading="eager" className="object-contain p-4" />
        )}
      </div>
      {!isAi && (
        <div className="mx-auto mt-3 flex max-w-md items-center gap-2">
          {product.colors.map((c) => (
            <Swatch key={c.hex} hex={c.hex} name={c.name} selected={c.hex === color.hex} onClick={() => set({ colorHex: c.hex })} />
          ))}
          <span className="ml-2 text-[0.74rem] text-ink-soft">
            {color.name} · {formatLKR(product.priceLKR)}
          </span>
        </div>
      )}
    </Section>
  );

  const details = (
    <>
      {!isAi && (
        <Section
          title="Size"
          aside={state.recommendation && <span className="text-[0.7rem] font-semibold text-accent-ink">Recommended: {state.recommendation.size}</span>}
        >
          <ChipRow
            options={(["S", "M", "L"] as Size[]).map((s) => ({ value: s, label: s }))}
            value={state.trySize}
            onChange={(v) => set({ trySize: v as Size, fit: null })}
          />
        </Section>
      )}

      <Section>
        <div className="card p-4 text-center">
          {fit ? (
            <div className="fade-up">
              <Gauge score={fit.score} color={COLOR[fit.verdict]} />
              <div className="display text-[1.5rem]" style={{ color: COLOR[fit.verdict] }}>
                {fit.verdict}
              </div>
              <div className="text-[0.7rem] text-ink-soft">Fit score out of 100 for size {fit.tried}</div>
            </div>
          ) : (
            <div className="py-6">
              <div className="mx-auto h-24 w-48 rounded-t-full shimmer" />
              <div className="mt-3 text-[0.74rem] text-ink-soft">{busy ? "Analyzing your fit…" : (error ?? "No result yet")}</div>
            </div>
          )}
        </div>
      </Section>

      {!feedbackDone && (
        <Section>
          <button type="button" onClick={() => setFeedbackOpen(true)} className="card flex w-full items-center gap-3 border-accent/60 p-4 text-left">
            <span className="display text-[1.6rem] text-accent">★</span>
            <span className="flex-1">
              <b className="block text-[0.86rem] text-ink">Tell us what you think</b>
              <span className="text-[0.74rem] text-ink-soft">One minute of feedback helps our research.</span>
            </span>
          </button>
        </Section>
      )}

      {fit && (
        <>
          <Section title="Per-zone fit">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {fit.zones.map((z) => (
                <div key={z.zone} className="card flex items-center justify-between px-4 py-3">
                  <span className="text-[0.82rem] font-semibold text-ink">{z.zone}</span>
                  <span className={`pill ${z.status === "good" ? "good" : z.status === "tight" ? "poor" : "warn"}`}>
                    {z.status === "good" ? "Good fit" : z.status === "tight" ? "Too tight" : "Loose"}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Final recommendation">
            <div className="card border-accent/60 p-4 fade-up">
              <div className="flex items-center justify-between">
                <span className="display text-[2.4rem] text-accent">{fit.recommended}</span>
                <span className="pill good">{fit.confidence}% confidence</span>
              </div>
              <p className="mt-2 text-[0.84rem] leading-relaxed text-ink">{fit.explanation}</p>
              {isAi && (
                <div className="mt-2 text-[0.64rem] uppercase tracking-wider text-ink-soft">
                  {fit.source === "claude" ? "Explained by Mira AI" : "Rule-based explanation"}
                </div>
              )}
            </div>
          </Section>

          {!isAi && (
            <Section title="Size chart">
              <SizeChart highlight={fit.recommended} />
            </Section>
          )}

          <Section>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => toast("Saved to your wardrobe")}>
                <HeartIcon width={16} height={16} /> Save
              </button>
              <button type="button" className="btn btn-ghost" onClick={share}>
                <ShareIcon width={16} height={16} /> Share
              </button>
            </div>
            <Link
              href={isAi ? "/try-on" : "/shop"}
              className="mt-2 block text-center text-[0.72rem] font-semibold text-ink-soft underline-offset-2 hover:underline"
            >
              {isAi ? "Try another size or colour" : "Choose another garment"}
            </Link>
          </Section>
        </>
      )}

      <StickyCta>
        <button type="button" className="btn btn-accent" disabled={!fit} onClick={() => fit && buy(fit.recommended)}>
          Buy size {fit?.recommended ?? state.trySize} · {formatLKR(product.priceLKR)}
        </button>
      </StickyCta>
    </>
  );

  return (
    <div>
      <ProgressSteps step={isAi ? 4 : 2} />
      <PageHeader
        eyebrow={isAi ? "Step 4 of 4" : "Step 2 of 2"}
        title="Your fit results"
        subtitle={isAi ? `${product.name} · tried size ${state.trySize}` : `${product.name} · size ${state.trySize}`}
      />
      <Split left={visual} right={details} />
      <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
