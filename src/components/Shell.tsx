"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { Variant } from "@/lib/types";
import { BagIcon, CameraIcon, CheckIcon, HomeIcon, RulerIcon, ShopIcon, SparkIcon } from "./Icons";

type NavItem = { href: string; label: string; Icon: typeof HomeIcon; match: string[] };

const NAV: Record<Variant, NavItem[]> = {
  ai: [
    { href: "/", label: "Home", Icon: HomeIcon, match: ["/"] },
    { href: "/shop", label: "Shop", Icon: ShopIcon, match: ["/shop"] },
    { href: "/profile", label: "Size", Icon: RulerIcon, match: ["/profile"] },
    { href: "/upload", label: "Try on", Icon: CameraIcon, match: ["/upload", "/try-on", "/results"] },
    { href: "/stylist", label: "Stylist", Icon: SparkIcon, match: ["/stylist"] },
  ],
  standard: [
    { href: "/standard", label: "Home", Icon: HomeIcon, match: ["/standard"] },
    { href: "/shop", label: "Shop", Icon: ShopIcon, match: ["/shop"] },
    { href: "/profile", label: "Size", Icon: RulerIcon, match: ["/profile"] },
    { href: "/results", label: "Your fit", Icon: CheckIcon, match: ["/results"] },
    { href: "/bag", label: "Bag", Icon: BagIcon, match: ["/bag", "/checkout"] },
  ],
};

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, toastMsg, hydrated } = useStore();

  // The admin portal has its own layout.
  if (path.startsWith("/admin")) return <>{children}</>;

  // Landing pages decide the version themselves, so trust the URL there during first render.
  const variant: Variant = path === "/standard" ? "standard" : path === "/" ? "ai" : state.variant;
  const nav = NAV[variant];
  const count = hydrated ? state.cart.length : 0;
  const isActive = (item: NavItem) => item.match.some((m) => (m === "/" || m === "/standard" ? path === m : path.startsWith(m)));

  return (
    <div className="min-h-dvh bg-panel">
      <div className="bg-ink px-4 py-1.5 text-center text-[0.64rem] font-semibold tracking-wide text-ground md:text-[0.72rem]">
        Testing phase · your feedback shapes Mira
      </div>

      <header className="sticky top-0 z-20 border-b border-line bg-panel/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 md:h-16 md:px-8">
          <Link href={nav[0].href} className="brand text-[0.9rem] text-ink md:text-[1rem]" aria-label="Mira home">
            Mira
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {nav
              .filter((n) => n.href !== "/bag")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-[0.84rem] font-semibold transition-colors ${
                    isActive(item) ? "bg-chip text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          </nav>

          <Link href="/bag" className="relative inline-flex items-center gap-1.5 text-ink" aria-label={`Bag, ${count} items`}>
            <BagIcon width={20} height={20} />
            <span className="hidden text-[0.84rem] font-semibold md:inline">Bag</span>
            {count > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.62rem] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl pb-28 md:px-8 md:pb-16">{children}</main>

      {toastMsg && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-24 left-1/2 z-40 max-w-[88%] -translate-x-1/2 truncate rounded-full bg-ink px-4 py-2 text-[0.74rem] text-ground fade-up md:bottom-8"
        >
          {toastMsg}
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-panel/95 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur md:hidden"
        aria-label="Primary"
      >
        {nav.map((item) => {
          const active = isActive(item);
          const { Icon } = item;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.62rem] font-semibold tracking-wide transition-colors ${
                active ? "text-ink" : "text-ink-soft"
              }`}
            >
              <Icon width={20} height={20} strokeWidth={active ? 2.1 : 1.6} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
