"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon } from "@/components/Icons";
import { ChipRow, PageHeader, Section, StickyCta } from "@/components/ui";
import { DELIVERY_LKR, formatLKR } from "@/lib/products";
import { useStore } from "@/lib/store";

export default function CheckoutPage() {
  const { state, set } = useStore();
  const [form, setForm] = useState({ name: "", phone: "", address: "", payment: "cod" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ orderNo: string; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = state.cart;
  const subtotal = items.reduce((a, it) => a + it.priceLKR, 0);
  const total = subtotal + DELIVERY_LKR;
  const valid = form.name.trim() && form.phone.trim() && form.address.trim();

  const place = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items, customer: form }),
      });
      const data = (await res.json()) as { orderNo?: string; total?: number; error?: string };
      if (!res.ok || !data.orderNo) throw new Error(data.error || "Could not place order");
      setDone({ orderNo: data.orderNo, total: data.total ?? total });
      set({ cart: [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="fade-up">
        <PageHeader eyebrow="Order placed" title="Thank you" />
        <Section>
          <div className="card p-6 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-good text-white">
              <CheckIcon />
            </span>
            <div className="display mt-3 text-[1.4rem] text-ink">#{done.orderNo}</div>
            <p className="mt-1 text-[0.78rem] text-ink-soft">
              We will confirm by SMS. Total {formatLKR(done.total)}, delivery in 2 to 4 days.
            </p>
            <Link href="/" className="btn btn-primary mt-5">
              Back to home
            </Link>
          </div>
        </Section>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHeader back eyebrow="Checkout" title="Nothing to check out" />
        <Section>
          <Link href="/shop" className="btn btn-ghost">
            Browse the shop
          </Link>
        </Section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader back eyebrow="Checkout" title="Delivery details" />

      <Section title="Contact">
        <div className="flex flex-col gap-3">
          <label className="field">
            <span className="text-[0.72rem] font-semibold text-ink-soft">Full name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </label>
          <label className="field">
            <span className="text-[0.72rem] font-semibold text-ink-soft">Phone</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" autoComplete="tel" />
          </label>
          <label className="field">
            <span className="text-[0.72rem] font-semibold text-ink-soft">Delivery address</span>
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} autoComplete="street-address" />
          </label>
        </div>
      </Section>

      <Section title="Payment">
        <ChipRow
          options={[
            { value: "cod", label: "Cash on delivery" },
            { value: "card", label: "Card" },
            { value: "bank", label: "Bank transfer" },
          ]}
          value={form.payment}
          onChange={(v) => setForm({ ...form, payment: v })}
        />
        {form.payment === "card" && (
          <p className="mt-2 text-[0.7rem] text-ink-soft">Card payments are simulated in this MVP. No card details are collected.</p>
        )}
      </Section>

      <Section title="Order summary">
        <div className="card divide-y divide-line text-[0.78rem]">
          {items.map((it, i) => (
            <div key={i} className="flex justify-between px-4 py-2.5 text-ink-soft">
              <span>
                {it.name} · {it.size}
              </span>
              <span>{formatLKR(it.priceLKR)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-2.5 text-ink-soft">
            <span>Delivery</span>
            <span>{formatLKR(DELIVERY_LKR)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 font-semibold text-ink">
            <span>Total</span>
            <span>{formatLKR(total)}</span>
          </div>
        </div>
        {error && <p className="mt-2 text-[0.74rem] text-poor">{error}</p>}
      </Section>

      <StickyCta>
        <button type="button" className="btn btn-accent" disabled={!valid || busy} onClick={place}>
          {busy ? "Placing order…" : `Place order · ${formatLKR(total)}`}
        </button>
      </StickyCta>
    </div>
  );
}
