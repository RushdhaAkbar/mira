"use client";

import Link from "next/link";
import { useState } from "react";
import { FeedbackSheet } from "@/components/FeedbackSheet";
import { CheckIcon } from "@/components/Icons";
import { ChipRow, homeFor, PageHeader, Section, StickyCta } from "@/components/ui";
import { DELIVERY_LKR, formatLKR } from "@/lib/products";
import { useStore } from "@/lib/store";

/**
 * Demo checkout for the testing phase. It looks and flows like a real checkout,
 * but nothing is charged or delivered, and name / phone / address never leave
 * the device. Only the basket is recorded, as a purchase-intent signal.
 */
export default function CheckoutPage() {
  const { state, set } = useStore();
  const [form, setForm] = useState({ name: "", phone: "", address: "", payment: "cod", card: "", expiry: "", cvc: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ orderNo: string; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const items = state.cart;
  const subtotal = items.reduce((a, it) => a + it.priceLKR, 0);
  const total = subtotal + DELIVERY_LKR;
  const feedbackDone = state.feedbackGiven.includes(state.variant);

  const place = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items, variant: state.variant, payment: form.payment }),
      });
      const data = (await res.json()) as { orderNo?: string; total?: number; error?: string };
      if (!res.ok || !data.orderNo) throw new Error(data.error || "Could not place order");
      setDone({ orderNo: data.orderNo, total: data.total ?? total });
      set({ cart: [] });
      if (!feedbackDone) window.setTimeout(() => setFeedbackOpen(true), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="fade-up">
        <PageHeader eyebrow="Demo order placed" title="Thank you" />
        <Section>
          <div className="card p-6 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-good text-white">
              <CheckIcon />
            </span>
            <div className="display mt-3 text-[1.4rem] text-ink">#{done.orderNo}</div>
            <p className="mt-1 text-[0.78rem] text-ink-soft">
              This was a demo checkout for the testing phase. Nothing was charged and nothing will be delivered.
            </p>
            {!feedbackDone && (
              <button type="button" className="btn btn-accent mt-5" onClick={() => setFeedbackOpen(true)}>
                Give quick feedback
              </button>
            )}
            <Link href={homeFor(state.variant)} className="btn btn-ghost mt-2">
              Back to home
            </Link>
          </div>
        </Section>
        <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
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
      <div className="md:grid md:grid-cols-[1fr_380px] md:items-start md:gap-10">
        <div>
          <Section>
            <div className="rounded-xl border border-warn/50 bg-warn/10 px-4 py-3 text-[0.74rem] text-ink">
              <b>Demo checkout.</b> This is the testing phase: no payment is taken, nothing is delivered, and the details you type here are
              not saved. Fill in anything you like.
            </div>
          </Section>

          <Section title="Contact">
            <div className="flex flex-col gap-3">
              <label className="field">
                <span className="text-[0.72rem] font-semibold text-ink-soft">Full name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="off"
                  placeholder="e.g. Amani Perera"
                />
              </label>
              <label className="field">
                <span className="text-[0.72rem] font-semibold text-ink-soft">Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="07X XXX XXXX"
                />
              </label>
              <label className="field">
                <span className="text-[0.72rem] font-semibold text-ink-soft">Delivery address</span>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  autoComplete="off"
                  placeholder="Street, city"
                />
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
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="field col-span-2">
                  <span className="text-[0.72rem] font-semibold text-ink-soft">Card number (demo, do not use a real card)</span>
                  <input
                    value={form.card}
                    onChange={(e) => setForm({ ...form, card: e.target.value })}
                    placeholder="4242 4242 4242 4242"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                </label>
                <label className="field">
                  <span className="text-[0.72rem] font-semibold text-ink-soft">Expiry</span>
                  <input
                    value={form.expiry}
                    onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                    placeholder="MM/YY"
                    autoComplete="off"
                  />
                </label>
                <label className="field">
                  <span className="text-[0.72rem] font-semibold text-ink-soft">CVC</span>
                  <input
                    value={form.cvc}
                    onChange={(e) => setForm({ ...form, cvc: e.target.value })}
                    placeholder="123"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                </label>
              </div>
            )}
            {form.payment === "bank" && (
              <p className="mt-2 text-[0.72rem] text-ink-soft">Bank details would be shown here after the order at full launch.</p>
            )}
          </Section>
        </div>
        <div className="md:sticky md:top-24">
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
            <button type="button" className="btn btn-accent" disabled={busy} onClick={place}>
              {busy ? "Placing order…" : `Place demo order · ${formatLKR(total)}`}
            </button>
          </StickyCta>
        </div>
      </div>
    </div>
  );
}
