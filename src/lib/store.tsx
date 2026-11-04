"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AiQuota, CartItem, FitPref, FitResult, Measurements, Product, Size, SizeRecommendation, StylistOutfit, TesterInfo, Variant } from "./types";
import { DEFAULT_MEASUREMENTS } from "./sizing";
import { SEED_PRODUCTS } from "./products";

export interface MiraState {
  /** Study arm, set by the entry URL: "/" is the AI version, "/standard" the version without AI. */
  variant: Variant;
  productId: string;
  colorHex: string;
  trySize: Size;
  fitPref: FitPref;
  styleTags: string[];
  measurements: Measurements;
  recommendation: SizeRecommendation | null;
  photoId: string | null;
  photoPreview: string | null;
  photoCheck: { ok: boolean; message: string; issues: string[] } | null;
  tryOnImage: string | null;
  tryOnMode: "ai" | "overlay" | null;
  tryOnNote: string | null;
  fit: FitResult | null;
  outfits: StylistOutfit[];
  cart: CartItem[];
  /** The look this tester spent their AI try-on on (image refetched from the server cache). */
  aiLook: { photoId: string; productId: string; colorHex: string; size: Size } | null;
}

const initial: MiraState = {
  variant: "ai",
  productId: SEED_PRODUCTS[0].id,
  colorHex: SEED_PRODUCTS[0].colors[0].hex,
  trySize: "M",
  fitPref: "regular",
  styleTags: ["Minimal"],
  measurements: DEFAULT_MEASUREMENTS,
  recommendation: null,
  photoId: null,
  photoPreview: null,
  photoCheck: null,
  tryOnImage: null,
  tryOnMode: null,
  tryOnNote: null,
  fit: null,
  outfits: [],
  cart: [],
  aiLook: null,
};

interface Ctx {
  state: MiraState;
  set: (patch: Partial<MiraState> | ((s: MiraState) => Partial<MiraState>)) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
  hydrated: boolean;
  products: Product[];
  product: Product;
  quota: AiQuota | null;
  setQuota: (q: AiQuota | null) => void;
  aiAvailable: boolean;
  /** Name given at the gate; null = not given yet; undefined = still loading from the server. */
  testerName: string | null | undefined;
  /** Save the tester's name on the server. Resolves with an error message, or null on success. */
  registerName: (name: string) => Promise<string | null>;
  /** Where to go after the name gate closes; a non-null value opens the gate. */
  gateNext: string | null;
  setGateNext: (next: string | null) => void;
}

const StoreContext = createContext<Ctx | null>(null);
const KEY = "mira-state-v3";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MiraState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [testerName, setTesterName] = useState<string | null | undefined>(undefined);
  const [gateNext, setGateNext] = useState<string | null>(null);

  useEffect(() => {
    // One-time sync from an external system (localStorage) after mount.
    // Reading it during render would break server/client hydration.
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState({ ...initial, ...JSON.parse(raw), tryOnImage: null, tryOnMode: null });
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // Catalogue from the database, and this tester's AI try-on allowance.
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d: { products?: Product[] }) => d.products?.length && setProducts(d.products))
      .catch(() => {});
    fetch("/api/tester")
      .then((r) => r.json())
      .then((d: TesterInfo) => {
        setQuota(d.quota);
        setAiAvailable(d.aiAvailable);
        setTesterName(d.name ?? null);
      })
      .catch(() => setTesterName(null));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      // The AI render (a large data URL) is not persisted; it is refetched from the server cache.
      localStorage.setItem(KEY, JSON.stringify({ ...state, tryOnImage: null }));
    } catch {
      /* storage may be full or blocked */
    }
  }, [state, hydrated]);

  const set = useCallback<Ctx["set"]>((patch) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const registerName = useCallback<Ctx["registerName"]>(
    async (name) => {
      try {
        const res = await fetch("/api/tester", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, variant: state.variant }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; name?: string };
        if (!res.ok) return data.error || "Could not save your name.";
        setTesterName(data.name ?? name);
        return null;
      } catch {
        return "Network problem. Please check your connection and try again.";
      }
    },
    [state.variant],
  );

  const product = products.find((p) => p.id === state.productId) ?? products[0];

  const value = useMemo(
    () => ({ state, set, toast, toastMsg, hydrated, products, product, quota, setQuota, aiAvailable, testerName, registerName, gateNext, setGateNext }),
    [state, set, toast, toastMsg, hydrated, products, product, quota, aiAvailable, testerName, registerName, gateNext],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Reset the try-on specific state when switching study arm or garment. */
export const TRYON_RESET: Partial<MiraState> = { tryOnImage: null, tryOnMode: null, tryOnNote: null, fit: null };

/** Put the tester in a study arm (called by the "/" and "/standard" landing pages). */
export function useEnterVariant(variant: Variant) {
  const { state, set, hydrated } = useStore();
  useEffect(() => {
    if (hydrated && state.variant !== variant) set({ variant, ...TRYON_RESET });
  }, [hydrated, state.variant, variant, set]);
}
