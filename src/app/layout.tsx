import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

// Self-hosted (src/app/fonts) so builds and dev never depend on reaching Google Fonts.
const playfair = localFont({
  src: [
    { path: "./fonts/PlayfairDisplay-Variable.woff2", weight: "400 900", style: "normal" },
    { path: "./fonts/PlayfairDisplay-Italic-Variable.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
  fallback: ["Didot", "Bodoni MT", "Georgia", "serif"],
});

const manrope = localFont({
  src: [{ path: "./fonts/Manrope-Variable.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-manrope",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "Mira", template: "%s · Mira" },
  description: "See it on you, before you buy it. Virtual try-on and honest size recommendations.",
  applicationName: "Mira",
  openGraph: { title: "Mira", description: "Virtual try-on and smart sizing", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#171410" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${manrope.variable}`}>
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
