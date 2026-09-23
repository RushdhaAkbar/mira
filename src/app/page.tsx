"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { ArrowIcon, ShieldIcon, SparkIcon } from "@/components/Icons";
import { Section } from "@/components/ui";
import { CATEGORIES, PRODUCTS } from "@/lib/products";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const { state, set } = useStore();
  const trending = PRODUCTS.filter((p) => p.trending);

  return (
    <div className="fade-up">
      <section className="px-5 pt-3 pb-6">
        <div className="label mb-2">Virtual fitting room</div>
        <h1 className="display text-[2.1rem] leading-[1.1] text-ink">
          See it on <i>you</i>,<br />
          before you buy it.
        </h1>
        <p className="mt-3 max-w-[32ch] text-[0.88rem] text-ink-soft">
          Upload one photo, add five measurements, and Mira drapes the garment on your body with an honest fit score
          and the right size.
        </p>
        <Link href="/profile" className="btn btn-primary mt-5">
          Start my try-on <ArrowIcon width={16} height={16} />
        </Link>
        <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-ink-soft">
          <ShieldIcon width={14} height={14} /> Photos are deleted automatically after 24 hours.
        </div>
      </section>

      <div className="relative mx-5 mb-6 aspect-[4/3] overflow-hidden rounded-2xl border border-line">
        <Image
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=70"
          alt="Editorial fashion photo"
          fill
          priority
          sizes="440px"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
          <div className="text-[0.62rem] uppercase tracking-[0.16em] opacity-80">This week</div>
          <div className="display text-[1.2rem]">Linen, silk and easy tailoring</div>
        </div>
      </div>

      <Section title="Browse">
        <div className="hide-scroll flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/shop?cat=${encodeURIComponent(c)}`} className="chip">
              {c}
            </Link>
          ))}
        </div>
      </Section>

      <Section
        title="Trending looks"
        aside={
          <Link href="/shop" className="text-[0.72rem] font-semibold text-accent-ink">
            See all
          </Link>
        }
      >
        <div className="hide-scroll flex gap-3 overflow-x-auto pb-1">
          {trending.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              compact
              selected={state.productId === p.id}
              onSelect={() => set({ productId: p.id, colorHex: p.colors[0].hex, tryOnImage: null, tryOnMode: null, fit: null })}
            />
          ))}
        </div>
      </Section>

      <Section>
        <Link href="/stylist" className="card flex items-center gap-3 p-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-accent-ink">
            <SparkIcon />
          </span>
          <span className="flex-1">
            <b className="block text-[0.85rem] text-ink">AI Stylist</b>
            <span className="text-[0.74rem] text-ink-soft">Outfits matched to your body shape and the occasion.</span>
          </span>
          <ArrowIcon width={16} height={16} className="text-ink-soft" />
        </Link>
      </Section>

      <Section title="How it works">
        <ol className="grid grid-cols-4 gap-2 text-center">
          {["Pick a look", "Add sizes", "Upload photo", "See the fit"].map((s, i) => (
            <li key={s} className="card px-2 py-3">
              <div className="display text-[1.1rem] text-accent">{i + 1}</div>
              <div className="mt-1 text-[0.66rem] font-semibold text-ink-soft">{s}</div>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
