"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { Variant } from "@/lib/types";
import { BackIcon } from "./Icons";

/**
 * Keep a tester inside their study arm. Pages that belong to only one version
 * (photo upload and try-on are AI-only) send the other version elsewhere.
 */
export function useVariantGuard(allowed: Variant[], redirectTo: string) {
  const router = useRouter();
  const { state, hydrated } = useStore();
  const ok = allowed.includes(state.variant);
  useEffect(() => {
    if (hydrated && !ok) router.replace(redirectTo);
  }, [hydrated, ok, redirectTo, router]);
  return state.variant;
}

/** Home link for the tester's version: "/" for AI, "/standard" for the version without AI. */
export const homeFor = (v: Variant) => (v === "standard" ? "/standard" : "/");

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  back,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <div className="px-5 pt-2 pb-4 fade-up md:px-0 md:pt-8 md:pb-6">
      {back && (
        <button type="button" onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-[0.72rem] font-semibold text-ink-soft">
          <BackIcon width={14} height={14} /> Back
        </button>
      )}
      {eyebrow && <div className="label mb-1">{eyebrow}</div>}
      <h1 className="display text-[1.7rem] leading-tight text-ink md:text-[2.4rem]">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-[0.85rem] text-ink-soft md:text-[0.95rem]">{subtitle}</p>}
    </div>
  );
}

export function Section({ title, children, aside }: { title?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="px-5 pb-5 md:px-0 md:pb-7">
      {(title || aside) && (
        <div className="mb-2.5 flex items-baseline justify-between">
          {title && <div className="label">{title}</div>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** Two columns on desktop (visual left, controls right); a single column on phones. */
export function Split({ left, right, stickyLeft = true }: { left: ReactNode; right: ReactNode; stickyLeft?: boolean }) {
  return (
    <div className="md:grid md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">
      <div className={stickyLeft ? "md:sticky md:top-24" : ""}>{left}</div>
      <div>{right}</div>
    </div>
  );
}

export function ChipRow({
  options,
  value,
  onChange,
  multi,
}: {
  options: { value: string; label: string }[];
  value: string | string[];
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  const isSel = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div className="hide-scroll flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={isSel(o.value)} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Sticky bottom action bar on phones; a normal inline button row on desktop. */
export function StickyCta({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[68px] z-[5] bg-gradient-to-t from-panel via-panel to-transparent px-5 pt-6 pb-3 md:static md:bg-none md:px-0 md:pt-2 md:pb-8">
      <div className="md:max-w-md">{children}</div>
    </div>
  );
}

export function CtaLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "accent" | "ghost" }) {
  return (
    <Link href={href} className={`btn btn-${variant}`}>
      {children}
    </Link>
  );
}

export function Swatch({ hex, name, selected, onClick }: { hex: string; name: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      aria-pressed={selected}
      title={name}
      className={`h-8 w-8 rounded-full border-2 transition-transform ${selected ? "scale-110 border-ink" : "border-line"}`}
      style={{ background: hex }}
    />
  );
}

const STEPS: Record<Variant, string[]> = {
  ai: ["Size", "Photo", "Try on", "Fit"],
  standard: ["Size", "Your fit"],
};

export function ProgressSteps({ step }: { step: number }) {
  const { state } = useStore();
  const steps = STEPS[state.variant];
  return (
    <ol className="flex items-center gap-1.5 px-5 pb-3 md:max-w-xl md:px-0 md:pt-6 md:pb-0" aria-label="Progress">
      {steps.map((s, i) => {
        const n = i + 1;
        const here = n === step;
        return (
          <li key={s} className="flex flex-1 items-center gap-1.5">
            <span className={`h-1 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-line"}`} aria-current={here ? "step" : undefined} />
            <span className={`text-[0.6rem] font-semibold md:text-[0.7rem] ${here ? "text-ink" : "text-ink-soft"}`}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Gauge({ score, color }: { score: number; color: string }) {
  const r = 52;
  const c = Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <svg viewBox="0 0 130 72" className="mx-auto w-[210px]" role="img" aria-label={`Fit score ${score} out of 100`}>
      <path d="M13 65 A52 52 0 0 1 117 65" fill="none" stroke="var(--line)" strokeWidth="10" strokeLinecap="round" />
      <path
        d="M13 65 A52 52 0 0 1 117 65"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        style={{ transition: "stroke-dasharray .9s ease" }}
      />
      <text x="65" y="60" textAnchor="middle" fontSize="28" fontFamily="var(--font-display)" fill="var(--ink)">
        {score}
      </text>
    </svg>
  );
}

/** A conventional size chart, as most online stores show (used in the standard version). */
export function SizeChart({ highlight }: { highlight?: string | null }) {
  const rows = [
    { size: "S", bust: "80–86", waist: "62–68", hips: "86–92" },
    { size: "M", bust: "87–93", waist: "69–75", hips: "93–99" },
    { size: "L", bust: "94–101", waist: "76–83", hips: "100–107" },
  ];
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-[0.78rem]">
        <thead>
          <tr className="border-b border-line text-ink-soft">
            {["Size", "Bust (cm)", "Waist (cm)", "Hips (cm)"].map((h) => (
              <th key={h} className="px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.size} className={`border-b border-line last:border-0 ${highlight === r.size ? "bg-accent/10 font-semibold text-ink" : "text-ink-soft"}`}>
              <td className="px-4 py-2.5">{r.size}</td>
              <td className="px-4 py-2.5">{r.bust}</td>
              <td className="px-4 py-2.5">{r.waist}</td>
              <td className="px-4 py-2.5">{r.hips}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
