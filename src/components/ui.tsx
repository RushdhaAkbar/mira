"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BackIcon } from "./Icons";

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
    <div className="px-5 pt-2 pb-4 fade-up">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1 text-[0.72rem] font-semibold text-ink-soft"
        >
          <BackIcon width={14} height={14} /> Back
        </button>
      )}
      {eyebrow && <div className="label mb-1">{eyebrow}</div>}
      <h1 className="display text-[1.7rem] leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-[0.85rem] text-ink-soft">{subtitle}</p>}
    </div>
  );
}

export function Section({ title, children, aside }: { title?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="px-5 pb-5">
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
    <div className="hide-scroll flex gap-2 overflow-x-auto" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="chip"
          aria-pressed={isSel(o.value)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StickyCta({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-[5] bg-gradient-to-t from-panel via-panel to-transparent px-5 pt-6 pb-3">
      {children}
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

export function ProgressSteps({ step }: { step: 1 | 2 | 3 | 4 }) {
  const steps = ["Size", "Photo", "Try on", "Fit"];
  return (
    <ol className="flex items-center gap-1.5 px-5 pb-3" aria-label="Try-on progress">
      {steps.map((s, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4;
        const done = n < step;
        const here = n === step;
        return (
          <li key={s} className="flex flex-1 items-center gap-1.5">
            <span
              className={`h-1 flex-1 rounded-full ${done || here ? "bg-accent" : "bg-line"}`}
              aria-current={here ? "step" : undefined}
            />
            <span className={`text-[0.6rem] font-semibold ${here ? "text-ink" : "text-ink-soft"}`}>{s}</span>
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
