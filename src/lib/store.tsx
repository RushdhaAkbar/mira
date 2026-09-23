"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AccessoryKey, CartItem, FitPref, FitResult, Measurements, Size, SizeRecommendation, StylistOutfit } from "./types";
import { DEFAULT_MEASUREMENTS } from "./sizing";
import { PRODUCTS } from "./products";

export interface MiraState {
  productId: string;
  colorHex: string;
  trySize: Size;
  fitPref: FitPref;
  styleTags: string[];
  measurements: Measurements;
  recommendation: SizeRecommendation | null;
  accessories: Record<AccessoryKey, boolean>;
  photoId: string | null;
  photoPreview: string | null;
  photoCheck: { ok: boolean; message: string; issues: string[] } | null;
  tryOnImage: string | null;
  tryOnMode: "ai" | "overlay" | null;
  fit: FitResult | null;
  outfits: StylistOutfit[];
  cart: CartItem[];
}

const initial: MiraState = {
  productId: PRODUCTS[0].id,
  colorHex: PRODUCTS[0].colors[0].hex,
  trySize: "M",
  fitPref: "regular",
  styleTags: ["Minimal"],
  measurements: DEFAULT_MEASUREMENTS,
  recommendation: null,
  accessories: { necklace: false, bag: false, sunglasses: false },
  photoId: null,
  photoPreview: null,
  photoCheck: null,
  tryOnImage: null,
  tryOnMode: null,
  fit: null,
  outfits: [],
  cart: [],
};

interface Ctx {
  state: MiraState;
  set: (patch: Partial<MiraState> | ((s: MiraState) => Partial<MiraState>)) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
  hydrated: boolean;
}

const StoreContext = createContext<Ctx | null>(null);
const KEY = "mira-state-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MiraState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    // One-time sync from an external system (localStorage) after mount.
    // Reading it during render would break server/client hydration.
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage may be full or blocked */
    }
  }, [state, hydrated]);

  const set = useCallback<Ctx["set"]>((patch) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const value = useMemo(() => ({ state, set, toast, toastMsg, hydrated }), [state, set, toast, toastMsg, hydrated]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
