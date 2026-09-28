"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { FeedbackInput, Variant } from "@/lib/types";

type RatingKey = "overall" | "realism" | "fitConfidence" | "easeOfUse" | "purchaseIntent" | "photoComfort";

const QUESTIONS: Record<Variant, { key: RatingKey; q: string }[]> = {
  ai: [
    { key: "overall", q: "Overall, how much did you like your try-on?" },
    { key: "realism", q: "How realistic did the garment look on you?" },
    { key: "fitConfidence", q: "How confident are you the recommended size would fit?" },
    { key: "easeOfUse", q: "How easy was Mira to use?" },
    { key: "purchaseIntent", q: "Would this make you more likely to buy clothes online?" },
    { key: "photoComfort", q: "How comfortable were you uploading your photo?" },
  ],
  // No photo is involved in the standard version, so there is no photo-comfort question.
  standard: [
    { key: "overall", q: "Overall, how much did you like the shopping experience?" },
    { key: "realism", q: "How well could you picture how the garment would look on you?" },
    { key: "fitConfidence", q: "How confident are you the recommended size would fit?" },
    { key: "easeOfUse", q: "How easy was Mira to use?" },
    { key: "purchaseIntent", q: "Would this make you more likely to buy clothes online?" },
  ],
};

const SCALE = ["Not at all", "", "", "", "Very much"];

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} of 5${SCALE[n - 1] ? `, ${SCALE[n - 1]}` : ""}`}
          onClick={() => onChange(n)}
          className={`h-9 flex-1 rounded-lg border text-[0.8rem] font-bold transition-colors ${
            value >= n ? "border-accent bg-accent text-white" : "border-line bg-panel text-ink-soft"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

const SELECTS = {
  ageRange: ["Under 18", "18-24", "25-34", "35-44", "45+", "Prefer not to say"],
  gender: ["Woman", "Man", "Non-binary", "Prefer not to say"],
  shopsOnline: ["Weekly", "Monthly", "A few times a year", "Rarely or never"],
} as const;

export function FeedbackSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone?: () => void }) {
  const { state, set, toast, product } = useStore();
  const variant: Variant = state.variant;
  const [ratings, setRatings] = useState<Partial<Record<RatingKey, number>>>({});
  const [recommend, setRecommend] = useState<number | null>(null);
  const [liked, setLiked] = useState("");
  const [improve, setImprove] = useState("");
  const [about, setAbout] = useState({ ageRange: "", gender: "", shopsOnline: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const questions = QUESTIONS[variant];
  const complete = questions.every((q) => ratings[q.key]) && recommend !== null;
  const color = product.colors.find((c) => c.hex === state.colorHex) ?? product.colors[0];

  const submit = async () => {
    if (!complete) {
      setError("Please answer every rating question.");
      return;
    }
    setBusy(true);
    setError(null);
    const body: FeedbackInput = {
      variant,
      overall: ratings.overall!,
      realism: ratings.realism!,
      fitConfidence: ratings.fitConfidence!,
      easeOfUse: ratings.easeOfUse!,
      purchaseIntent: ratings.purchaseIntent!,
      photoComfort: ratings.photoComfort ?? null,
      recommend: recommend!,
      liked,
      improve,
      ...about,
      context: {
        productId: product.id,
        productName: product.name,
        colorName: color.name,
        triedSize: state.trySize,
        recommendedSize: state.recommendation?.size ?? null,
        aiRendered: state.tryOnMode === "ai",
      },
    };
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not send feedback");
      set((s) => ({ feedbackGiven: s.feedbackGiven.includes(variant) ? s.feedbackGiven : [...s.feedbackGiven, variant] }));
      toast("Thank you! Your feedback was saved.");
      onClose();
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send feedback");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 fade-up md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fb-title"
    >
      <div className="max-h-[90dvh] w-full max-w-[560px] overflow-y-auto rounded-t-3xl bg-panel px-5 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] shadow-phone md:rounded-3xl md:px-8 md:pt-7 md:pb-8">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line md:hidden" />
        <div className="label mb-1">Quick feedback · 1 minute</div>
        <h2 id="fb-title" className="display text-[1.4rem] leading-tight text-ink">
          {variant === "ai" ? "How was your try-on?" : "How was your experience?"}
        </h2>
        <p className="mt-1 text-[0.76rem] text-ink-soft">
          Your answers are anonymous and used only for a university research study. 1 is lowest, 5 is highest.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          {questions.map(({ key, q }) => (
            <div key={key}>
              <div className="mb-1.5 text-[0.8rem] font-semibold text-ink">{q}</div>
              <Stars label={q} value={ratings[key] ?? 0} onChange={(v) => setRatings((r) => ({ ...r, [key]: v }))} />
            </div>
          ))}

          <div>
            <div className="mb-1.5 text-[0.8rem] font-semibold text-ink">How likely are you to recommend Mira to a friend?</div>
            <div className="grid grid-cols-11 gap-1" role="radiogroup" aria-label="Likelihood to recommend, 0 to 10">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={recommend === n}
                  onClick={() => setRecommend(n)}
                  className={`h-8 rounded-md border text-[0.7rem] font-bold ${
                    recommend === n ? "border-ink bg-ink text-ground" : "border-line bg-panel text-ink-soft"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[0.62rem] text-ink-soft">
              <span>Not likely</span>
              <span>Extremely likely</span>
            </div>
          </div>

          <label className="field">
            <span className="text-[0.8rem] font-semibold text-ink">What did you like most?</span>
            <textarea rows={2} value={liked} onChange={(e) => setLiked(e.target.value)} placeholder="Optional" />
          </label>
          <label className="field">
            <span className="text-[0.8rem] font-semibold text-ink">What could be improved?</span>
            <textarea rows={2} value={improve} onChange={(e) => setImprove(e.target.value)} placeholder="Optional" />
          </label>

          <details className="card px-4 py-3">
            <summary className="cursor-pointer text-[0.78rem] font-semibold text-ink">About you (optional)</summary>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {(Object.keys(SELECTS) as (keyof typeof SELECTS)[]).map((k) => (
                <label key={k} className="field">
                  <span className="text-[0.72rem] font-semibold text-ink-soft">
                    {k === "ageRange" ? "Age range" : k === "gender" ? "Gender" : "How often do you shop for clothes online?"}
                  </span>
                  <select value={about[k]} onChange={(e) => setAbout({ ...about, [k]: e.target.value })}>
                    <option value="">Select</option>
                    {SELECTS[k].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="field">
                <span className="text-[0.72rem] font-semibold text-ink-soft">
                  Email, if you&apos;re happy to be contacted about the study
                </span>
                <input
                  type="email"
                  value={about.email}
                  onChange={(e) => setAbout({ ...about, email: e.target.value })}
                  autoComplete="email"
                />
              </label>
            </div>
          </details>

          {error && <p className="text-[0.74rem] text-poor">{error}</p>}

          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy} style={{ width: "40%" }}>
              Later
            </button>
            <button type="button" className="btn btn-accent" onClick={submit} disabled={busy}>
              {busy ? "Sending…" : "Send feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
