"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * Blocking name prompt shown before the AI try-on. There is no close button,
 * clicking the backdrop does nothing and Escape is ignored: the only way
 * through is to type a name. Only the name is collected.
 */
export function NameGate() {
  const router = useRouter();
  const { gateNext, setGateNext, registerName } = useStore();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = gateNext !== null;

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) {
      setError("Please enter your name to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    const err = await registerName(clean);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    const next = gateNext;
    setGateNext(null);
    if (next && next !== window.location.pathname) router.push(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 fade-up" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <form onSubmit={submit} className="card w-full max-w-sm bg-panel p-6 shadow-phone">
        <div className="label mb-1">Before you start</div>
        <h2 id="gate-title" className="display text-[1.4rem] leading-tight text-ink">
          What&apos;s your name?
        </h2>
        <p className="mt-1 text-[0.76rem] text-ink-soft">
          Mira is in a testing phase. We only ask for your name so we know who has tried it. Nothing else is collected.
        </p>
        <label className="field mt-4">
          <span className="text-[0.74rem] font-semibold text-ink-soft">Your name</span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={80}
            placeholder="e.g. Amani Perera"
            required
          />
        </label>
        {error && <p className="mt-2 text-[0.76rem] text-poor">{error}</p>}
        <button type="submit" className="btn btn-primary mt-4" disabled={busy || name.trim().length < 2}>
          {busy ? "Saving…" : "Continue to my AI try-on"}
        </button>
      </form>
    </div>
  );
}
