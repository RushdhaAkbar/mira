"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, TrashIcon } from "@/components/Icons";
import { CtaLink, PageHeader, Section, StickyCta } from "@/components/ui";
import { DELIVERY_LKR, formatLKR } from "@/lib/products";
import { useStore } from "@/lib/store";

export default function BagPage() {
  const { state, set } = useStore();
  const items = state.cart;
  const subtotal = items.reduce((a, it) => a + it.priceLKR, 0);

  return (
    <div>
      <PageHeader back eyebrow="Bag" title={items.length === 1 ? "1 item" : `${items.length} items`} />
      <div className="md:grid md:grid-cols-[1fr_360px] md:items-start md:gap-10">
        <Section>
          {items.length === 0 ? (
            <div className="card px-4 py-10 text-center text-[0.8rem] text-ink-soft">
              Your bag is empty.
              <br />
              Pieces you add from the shop or your fit results appear here.
              <Link href="/shop" className="btn btn-ghost mt-5">
                Browse the shop
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((it, i) => (
                <div key={`${it.productId}-${i}`} className="card flex items-center gap-3 p-3">
                  <div className="relative h-16 w-13 shrink-0 overflow-hidden rounded-md bg-chip" style={{ width: 52, height: 64 }}>
                    <Image src={it.image} alt={it.name} fill sizes="52px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[0.8rem] text-ink">{it.name}</b>
                    <span className="flex items-center gap-1.5 text-[0.7rem] text-ink-soft">
                      <i className="inline-block h-2.5 w-2.5 rounded-full border border-line" style={{ background: it.colorHex }} />
                      Size {it.size}
                    </span>
                  </div>
                  <span className="text-[0.76rem] font-semibold text-ink">{formatLKR(it.priceLKR)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${it.name}`}
                    className="text-ink-soft hover:text-poor"
                    onClick={() => set((s) => ({ cart: s.cart.filter((_, j) => j !== i) }))}
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {items.length > 0 && (
          <div className="md:sticky md:top-24">
            <Section title="Summary">
              <div className="card divide-y divide-line text-[0.8rem]">
                <div className="flex justify-between px-4 py-2.5 text-ink-soft">
                  <span>Subtotal</span>
                  <span>{formatLKR(subtotal)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-ink-soft">
                  <span>Delivery</span>
                  <span>{formatLKR(DELIVERY_LKR)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 font-semibold text-ink">
                  <span>Total</span>
                  <span>{formatLKR(subtotal + DELIVERY_LKR)}</span>
                </div>
              </div>
            </Section>
            <StickyCta>
              <CtaLink href="/checkout" variant="accent">
                Checkout <ArrowIcon width={16} height={16} />
              </CtaLink>
            </StickyCta>
          </div>
        )}
      </div>
    </div>
  );
}
