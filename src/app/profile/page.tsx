"use client";

import { useEffect, useState } from "react";
import { ArrowIcon } from "@/components/Icons";
import { ChipRow, CtaLink, PageHeader, ProgressSteps, Section, StickyCta } from "@/components/ui";
import { recommendSize } from "@/lib/sizing";
import { useStore } from "@/lib/store";
import type { FitPref, Measurements, Size } from "@/lib/types";

const FIELDS: { key: keyof Measurements; label: string; unit: string; min: number; max: number }[] = [
  { key: "height", label: "Height", unit: "cm", min: 140, max: 200 },
  { key: "weight", label: "Weight", unit: "kg", min: 35, max: 130 },
  { key: "bust", label: "Bust", unit: "cm", min: 70, max: 130 },
  { key: "waist", label: "Waist", unit: "cm", min: 55, max: 120 },
  { key: "hips", label: "Hips", unit: "cm", min: 75, max: 140 },
];

const STYLE_TAGS = ["Minimal", "Romantic", "Street", "Classic", "Bold", "Boho"];

export default function ProfilePage() {
  const { hydrated } = useStore();
  // Remount the form once persisted state has loaded so its initial values are correct.
  return <ProfileForm key={hydrated ? "ready" : "initial"} />;
}

function ProfileForm() {
  const { state, set } = useStore();
  const [m, setM] = useState<Measurements>(state.measurements);
  const [computed, setComputed] = useState(state.recommendation);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!computed) return;
    const frame = requestAnimationFrame(() => setWidth(computed.confidence));
    return () => cancelAnimationFrame(frame);
  }, [computed]);

  const compute = () => {
    const rec = recommendSize(m, state.fitPref);
    setComputed(rec);
    set({ measurements: m, recommendation: rec, trySize: rec.size as Size, fit: null });
  };

  return (
    <div>
      <ProgressSteps step={1} />
      <PageHeader eyebrow="Step 1 of 4" title="Your size profile" subtitle="Five measurements are enough for an honest S / M / L recommendation." />

      <Section title="Measurements">
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="field">
              <span className="text-[0.72rem] font-semibold text-ink-soft">
                {f.label} <span className="font-normal">({f.unit})</span>
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={f.min}
                max={f.max}
                value={m[f.key] || ""}
                onChange={(e) => setM({ ...m, [f.key]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Preferred fit">
        <ChipRow
          options={[
            { value: "slim", label: "Slim" },
            { value: "regular", label: "Regular" },
            { value: "oversized", label: "Oversized" },
          ]}
          value={state.fitPref}
          onChange={(v) => set({ fitPref: v as FitPref, recommendation: null })}
        />
      </Section>

      <Section title="Your style">
        <ChipRow
          multi
          options={STYLE_TAGS.map((t) => ({ value: t, label: t }))}
          value={state.styleTags}
          onChange={(v) =>
            set((s) => ({ styleTags: s.styleTags.includes(v) ? s.styleTags.filter((x) => x !== v) : [...s.styleTags, v] }))
          }
        />
      </Section>

      <Section>
        <button type="button" className="btn btn-ghost" onClick={compute}>
          Calculate my size
        </button>
      </Section>

      {computed && (
        <Section title="Recommended size">
          <div className="card p-4 fade-up">
            <div className="flex items-center justify-center gap-6">
              {(["S", "M", "L"] as Size[]).map((s) => (
                <span
                  key={s}
                  className={`display text-[2rem] transition-all ${
                    computed.size === s ? "scale-110 text-accent" : "text-line"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-[0.78rem] text-ink-soft">{computed.reason}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-good transition-[width] duration-700" style={{ width: `${width}%` }} />
            </div>
            <div className="mt-1 text-center text-[0.7rem] font-semibold text-ink-soft">{computed.confidence}% confidence</div>
          </div>
        </Section>
      )}

      <StickyCta>
        <CtaLink href="/upload">
          {computed ? "Continue to photo" : "Skip, use size M"} <ArrowIcon width={16} height={16} />
        </CtaLink>
      </StickyCta>
    </div>
  );
}
