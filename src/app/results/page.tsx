"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeartIcon, ShareIcon } from "@/components/Icons";
import { Gauge, PageHeader, ProgressSteps, Section, StickyCta } from "@/components/ui";
import { PRODUCTS, findProduct, formatLKR } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { FitResult, Size } from "@/lib/types";

const COLOR: Record<FitResult["verdict"], string> = {
  "Highly fit": "var(--good)",
  "Moderate fit": "var(--warn)",
  "Poor fit": "var(--poor)",
};

export default function ResultsPage() {
  const router = useRouter();
  const { state, set, toast, hydrated } = useStore();
  const [error, setError] = useState<string | null>(null);
  const product = findProduct(state.productId) ?? PRODUCTS[0];
  const color = product.colors.find((c) => c.hex === state.colorHex) ?? product.colors[0];

  useEffect(() => {
    if (!hydrated || state.fit) return;
    let cancelled = false;
    fetch("/api/fit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: product.id, measurements: state.measurements, fitPref: state.fitPref, trySize: state.trySize }),
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
  }, [hydrated, state.fit, state.measurements, state.fitPref, state.trySize, product.id, set]);

  const fit = state.fit;
  const busy = hydrated && !fit && !error;

  const buy = (size: Size) => {
    set((s) => ({
      cart: [...s.cart, { productId: product.id, name: product.name, size, colorHex: color.hex, image: product.image, priceLKR: product.priceLKR }],
    }));
    router.push("/checkout");
  };

  const share = async () => {
    const text = `I tried the ${product.name} on Mira. Fit score ${fit?.score}/100, size ${fit?.recommended}.`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (navigator.share) await navigator.share({ title: "My Mira look", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast("Copied share text to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div>
      <ProgressSteps step={4} />
      <PageHeader eyebrow="Step 4 of 4" title="Your fit results" subtitle={`${product.name} · tried size ${state.trySize}`} />

      <Section>
        <div className="card p-4 text-center">
          {fit ? (
            <div className="fade-up">
              <Gauge score={fit.score} color={COLOR[fit.verdict]} />
              <div className="display text-[1.5rem]" style={{ color: COLOR[fit.verdict] }}>
                {fit.verdict}
              </div>
              <div className="text-[0.7rem] text-ink-soft">Fit score out of 100</div>
            </div>
          ) : (
            <div className="py-6">
              <div className="mx-auto h-24 w-48 rounded-t-full shimmer" />
              <div className="mt-3 text-[0.74rem] text-ink-soft">{busy ? "Analyzing your fit…" : error ?? "No result yet"}</div>
            </div>
          )}
        </div>
      </Section>

      {fit && (
        <>
          <Section title="Per-zone fit">
            <div className="flex flex-col gap-2">
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
              <p className="mt-2 text-[0.82rem] leading-relaxed text-ink">{fit.explanation}</p>
              <div className="mt-2 text-[0.64rem] uppercase tracking-wider text-ink-soft">
                {fit.source === "claude" ? "Explained by Mira AI" : "Rule-based explanation"}
              </div>
            </div>
          </Section>

          <Section>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => toast("Saved to your wardrobe")}>
                <HeartIcon width={16} height={16} /> Save look
              </button>
              <button type="button" className="btn btn-ghost" onClick={share}>
                <ShareIcon width={16} height={16} /> Share
              </button>
            </div>
            <Link href="/try-on" className="mt-2 block text-center text-[0.72rem] font-semibold text-ink-soft underline-offset-2 hover:underline">
              Try another size or colour
            </Link>
          </Section>
        </>
      )}

      <StickyCta>
        <button type="button" className="btn btn-accent" disabled={!fit} onClick={() => fit && buy(fit.recommended)}>
          Buy size {fit?.recommended ?? state.trySize} · {formatLKR(product.priceLKR)}
        </button>
      </StickyCta>
    </div>
  );
}
