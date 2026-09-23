"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ArrowIcon } from "@/components/Icons";
import { ChipRow, CtaLink, PageHeader, Section, StickyCta, Swatch } from "@/components/ui";
import { ACCESSORIES, CATEGORIES, PRODUCTS, findProduct, formatLKR } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { AccessoryKey } from "@/lib/types";

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
  const { state, set, toast } = useStore();

  const list = cat === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);
  const product = findProduct(state.productId) ?? PRODUCTS[0];
  const color = product.colors.find((c) => c.hex === state.colorHex) ?? product.colors[0];

  const toggleAcc = (k: AccessoryKey) => set((s) => ({ accessories: { ...s.accessories, [k]: !s.accessories[k] } }));

  const addToBag = () => {
    set((s) => ({
      cart: [
        ...s.cart,
        { productId: product.id, name: product.name, size: s.trySize, colorHex: color.hex, image: product.image, priceLKR: product.priceLKR },
      ],
    }));
    toast(`Added to bag: ${product.name} · size ${state.trySize}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Catalogue" title="Choose a look" subtitle="Pick one garment, then layer accessories that carry into your try-on." />

      <Section>
        <ChipRow options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={cat} onChange={setCat} />
      </Section>

      <Section>
        <div className="grid grid-cols-2 gap-3">
          {list.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              selected={state.productId === p.id}
              onSelect={() => set({ productId: p.id, colorHex: p.colors[0].hex, tryOnImage: null, tryOnMode: null, fit: null })}
            />
          ))}
        </div>
      </Section>

      <Section title="Selected">
        <div className="card p-4">
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
              <Swatch key={c.hex} hex={c.hex} name={c.name} selected={c.hex === color.hex} onClick={() => set({ colorHex: c.hex, tryOnImage: null })} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Accessories">
        <div className="flex flex-col gap-2">
          {ACCESSORIES.map((a) => {
            const on = state.accessories[a.key];
            return (
              <button
                key={a.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggleAcc(a.key)}
                className={`card flex items-center justify-between px-4 py-3 text-left transition-colors ${on ? "border-ink" : ""}`}
              >
                <span className="text-[0.82rem] font-semibold text-ink">{a.label}</span>
                <span className="flex items-center gap-3 text-[0.72rem] text-ink-soft">
                  {formatLKR(a.priceLKR)}
                  <span className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${on ? "bg-ink" : "bg-line"}`}>
                    <span className={`h-4 w-4 rounded-full bg-panel transition-transform ${on ? "translate-x-4" : ""}`} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <StickyCta>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={addToBag}>
            Add to bag
          </button>
          <CtaLink href="/profile">
            Try it on <ArrowIcon width={16} height={16} />
          </CtaLink>
        </div>
      </StickyCta>
    </div>
  );
}
