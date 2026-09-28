"use client";

import Image from "next/image";
import type { Product } from "@/lib/types";
import { formatLKR } from "@/lib/products";

export function ProductCard({
  product,
  selected,
  onSelect,
  compact,
  priority,
}: {
  product: Product;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
  /** Load immediately (first row / above the fold). */
  priority?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex w-full flex-col text-left transition-transform active:scale-[0.985] ${compact ? "min-w-[150px] max-w-[150px] md:min-w-0 md:max-w-none" : ""}`}
    >
      <div
        className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl border bg-white transition-colors ${
          selected ? "border-ink ring-2 ring-ink/80" : "border-line"
        }`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 280px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-2 left-2 rounded-full bg-panel/90 px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-wider text-ink-soft">
          {product.gender}
        </span>
        {product.trending && (
          <span className="absolute left-2 top-2 rounded-full bg-panel/90 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-accent-ink">
            Trending
          </span>
        )}
        {selected && (
          <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ground text-[0.7rem] font-bold">
            ✓
          </span>
        )}
      </div>
      <b className="mt-2 block text-[0.8rem] font-semibold leading-tight text-ink">{product.name}</b>
      <span className="text-[0.72rem] text-ink-soft">{formatLKR(product.priceLKR)}</span>
    </button>
  );
}
