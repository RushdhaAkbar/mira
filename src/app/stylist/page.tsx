"use client";

import { useState } from "react";
import { SparkIcon } from "@/components/Icons";
import { ChipRow, PageHeader, Section, useVariantGuard } from "@/components/ui";
import { bodyShape } from "@/lib/sizing";
import { useStore } from "@/lib/store";
import type { StylistOutfit } from "@/lib/types";

const OCCASIONS = ["Work", "Brunch", "Date night", "Wedding guest", "Weekend", "Evening"];

/** AI stylist (AI version only). */
export default function StylistPage() {
  useVariantGuard(["ai"], "/standard");
  const { state, set } = useStore();
  const [occasion, setOccasion] = useState("Brunch");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const shape = bodyShape(state.measurements);

  const ask = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          occasion,
          measurements: state.measurements,
          styleTags: state.styleTags,
          fitPref: state.fitPref,
          recommendedSize: state.recommendation?.size ?? null,
        }),
      });
      const data = (await res.json()) as { outfits: StylistOutfit[]; source: string };
      set({ outfits: data.outfits });
      setSource(data.source);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Extra" title="AI Stylist" subtitle="Outfits matched to your body shape, style tags and the occasion." />

      <Section>
        <div className="card flex items-center gap-3 p-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-accent-ink">
            <SparkIcon />
          </span>
          <div className="text-[0.78rem] text-ink-soft">
            Your profile: <b className="text-ink">{shape}</b> shape, <b className="text-ink">{state.fitPref}</b> fit
            {state.styleTags.length > 0 && (
              <>
                , style <b className="text-ink">{state.styleTags.join(", ")}</b>
              </>
            )}
            .
          </div>
        </div>
      </Section>

      <Section title="Occasion">
        <ChipRow options={OCCASIONS.map((o) => ({ value: o, label: o }))} value={occasion} onChange={setOccasion} />
      </Section>

      <Section>
        <button type="button" className="btn btn-primary md:max-w-xs" onClick={ask} disabled={busy}>
          {busy ? "Styling…" : "Suggest outfits"}
        </button>
      </Section>

      {busy && (
        <Section>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl shimmer" />
            ))}
          </div>
        </Section>
      )}

      {!busy && state.outfits.length > 0 && (
        <Section title={source === "claude" ? "Styled by Mira AI" : "Suggested looks"}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">
            {state.outfits.map((o, i) => (
              <article key={`${o.title}-${i}`} className="card p-4 fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <b className="display block text-[1.15rem] text-ink">{o.title}</b>
                    <span className="text-[0.7rem] uppercase tracking-wider text-ink-soft">{o.occasion}</span>
                  </div>
                  <span className="pill good">{o.match}% match</span>
                </div>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {o.pieces.map((p) => (
                    <li key={p} className="rounded-full bg-chip px-2.5 py-1 text-[0.7rem] font-semibold text-ink">
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[0.76rem] text-ink-soft">{o.why}</p>
              </article>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
