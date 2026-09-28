"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ComingSoon } from "@/components/ComingSoon";
import { ArrowIcon } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { ChipRow, CtaLink, PageHeader, Section, StickyCta, Swatch } from "@/components/ui";
import { CATEGORIES, formatLKR } from "@/lib/products";
import { TRYON_RESET, useStore } from "@/lib/store";

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <Shop />
    </Suspense>
  );
}

function Shop() {
  const params = useSearchParams();
  const initialCat = params.get("cat") ?? "All";
  const [cat, setCat] = useState<string>(CATEGORIES.includes(initialCat as never) ? initialCat : "All");
  const { state, set, toast, products, product } = useStore();
  const isAi = state.variant === "ai";

  const list = cat === "All" ? products : products.filter((p) => p.category === cat);
  const color = product.colors.find((c) => c.hex === state.colorHex) ?? product.colors[0];

  const addToBag = () => {
    set((s) => ({
      cart: [...s.cart, { productId: product.id, name: product.name, size: s.trySize, colorHex: color.hex, image: product.image, priceLKR: product.priceLKR }],
    }));
    toast(`Added to bag: ${product.name} · size ${state.trySize}`);
  };

  const selectedPanel = (
    <div className="card overflow-hidden">
      <div className="relative hidden aspect-[4/3] bg-white md:block">
        <Image src={product.image} alt={product.name} fill sizes="360px" className="object-contain p-4" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <b className="block text-[0.95rem] text-ink">{product.name}</b>
            <span className="text-[0.74rem] text-ink-soft">
              {product.fabric} · {formatLKR(product.priceLKR)}
            </span>
          </div>
          <span className="pill good">{color.name}</span>
        </div>
        <p className="mt-2 text-[0.78rem] text-ink-soft">{product.description}</p>
        <div className="mt-3 flex items-center gap-2">
          {product.colors.map((c) => (
            <Swatch key={c.hex} hex={c.hex} name={c.name} selected={c.hex === color.hex} onClick={() => set({ colorHex: c.hex, ...TRYON_RESET })} />
          ))}
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="flex gap-2">
      <button type="button" className="btn btn-ghost" onClick={addToBag}>
        Add to bag
      </button>
      <CtaLink href="/profile">
        {isAi ? "Try it on" : "Find my size"} <ArrowIcon width={16} height={16} />
      </CtaLink>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Choose a look"
        subtitle={isAi ? "Pick one garment to try on. Solid colours and clear shapes give the best results." : "Pick a garment, then find the size that fits you."}
      />

      <div className="md:grid md:grid-cols-[1fr_340px] md:items-start md:gap-10">
        <div>
          <Section>
            <ChipRow options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={cat} onChange={setCat} />
          </Section>
          <Section>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
              {list.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  priority={i < 6}
                  selected={state.productId === p.id}
                  onSelect={() => set({ productId: p.id, colorHex: p.colors[0].hex, ...TRYON_RESET })}
                />
              ))}
            </div>
          </Section>
        </div>

        {/* Desktop: sticky side panel with the selection and actions. */}
        <aside className="hidden md:sticky md:top-24 md:block">
          <div className="label mb-2.5">Selected</div>
          {selectedPanel}
          <div className="mt-4">{actions}</div>
          {isAi && (
            <div className="mt-6">
              <ComingSoon compact />
            </div>
          )}
        </aside>
      </div>

      {/* Phones: selection below the grid, actions in the sticky bar. */}
      <div className="md:hidden">
        <Section title="Selected">{selectedPanel}</Section>
        {isAi && (
          <Section>
            <ComingSoon />
          </Section>
        )}
        <StickyCta>{actions}</StickyCta>
      </div>
    </div>
  );
}
