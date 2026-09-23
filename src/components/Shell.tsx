"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { BagIcon, CameraIcon, HomeIcon, RulerIcon, ShopIcon, SparkIcon } from "./Icons";

const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/shop", label: "Shop", Icon: ShopIcon },
  { href: "/profile", label: "Size", Icon: RulerIcon },
  { href: "/upload", label: "Try on", Icon: CameraIcon },
  { href: "/stylist", label: "Stylist", Icon: SparkIcon },
];

const TRYON_ROUTES = ["/upload", "/try-on", "/results"];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, toastMsg, hydrated } = useStore();
  const count = hydrated ? state.cart.length : 0;

  return (
    <div className="min-h-dvh bg-ground px-4 py-0 sm:py-6">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-panel sm:min-h-[calc(100dvh-3rem)] sm:rounded-[32px] sm:border sm:border-line sm:shadow-phone overflow-hidden">
        <header className="flex items-center justify-between px-5 pt-4 pb-2">
          <Link href="/" className="brand text-[0.85rem] text-ink" aria-label="Mira home">
            Mira
          </Link>
          <Link
            href="/bag"
            className="relative inline-flex items-center gap-1.5 text-ink"
            aria-label={`Bag, ${count} items`}
          >
            <BagIcon width={18} height={18} />
            {count > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.62rem] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </header>

        <main className="relative flex-1 overflow-y-auto pb-24">{children}</main>

        {toastMsg && (
          <div
            role="status"
            className="pointer-events-none absolute bottom-24 left-1/2 z-20 max-w-[88%] -translate-x-1/2 truncate rounded-full bg-ink px-4 py-2 text-[0.72rem] text-ground fade-up"
          >
            {toastMsg}
          </div>
        )}

        <nav
          className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-line bg-panel/95 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur"
          aria-label="Primary"
        >
          {NAV.map(({ href, label, Icon }) => {
            const active = href === "/" ? path === "/" : href === "/upload" ? TRYON_ROUTES.includes(path) : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.62rem] font-semibold tracking-wide transition-colors ${
                  active ? "text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                <Icon width={20} height={20} strokeWidth={active ? 2.1 : 1.6} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
