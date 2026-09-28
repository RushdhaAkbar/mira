"use client";

import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { Section } from "./ui";
import { TRYON_RESET, useStore } from "@/lib/store";

/** Trending products: a swipe row on phones, a grid on desktop. */
export function Trending({ ctaHref }: { ctaHref: string }) {
  const { state, set, products } = useStore();
  const trending = products.filter((p) => p.trending);
  return (
    <Section
      title="Trending looks"
      aside={
        <Link href={ctaHref} className="text-[0.74rem] font-semibold text-accent-ink">
          See all
        </Link>
      }
    >
      <div className="hide-scroll flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible">
        {trending.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            compact
            priority={i < 5}
            selected={state.productId === p.id}
            onSelect={() => set({ productId: p.id, colorHex: p.colors[0].hex, ...TRYON_RESET })}
          />
        ))}
      </div>
    </Section>
  );
}

export function HowItWorks({ steps }: { steps: string[] }) {
  return (
    <Section title="How it works">
      <ol className="grid gap-2 md:gap-4" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <li key={s} className="card px-2 py-3 text-center md:px-4 md:py-5">
            <div className="display text-[1.1rem] text-accent md:text-[1.6rem]">{i + 1}</div>
            <div className="mt-1 text-[0.66rem] font-semibold text-ink-soft md:text-[0.82rem]">{s}</div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
