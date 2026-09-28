import catalog from "@/data/catalog.json";
import type { Product } from "./types";

type CatalogEntry = Omit<Product, "image"> & { imagePrompt: string };

/**
 * Public URL of a product photo. Served as a static file so the CDN and
 * next/image can cache it; MongoDB keeps the same photo as the record
 * (also available at /api/products/<id>/image).
 */
export const productImageUrl = (id: string) => `/products/${id}.jpg`;

/** Seed catalogue, also used as instant initial data before /api/products responds. */
export const SEED_PRODUCTS: Product[] = (catalog.products as CatalogEntry[]).map(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ imagePrompt, ...p }) => ({ ...p, image: productImageUrl(p.id) }),
);

export const CATEGORIES = ["All", "Tops", "Outerwear", "Dresses"] as const;

export const DELIVERY_LKR = 350;

export function formatLKR(n: number): string {
  return "LKR " + n.toLocaleString("en-US");
}

/** Features promised for full launch, shown as "coming soon" during testing. */
export const COMING_SOON = [
  {
    title: "Jewellery & accessories try-on",
    body: "Layer necklaces, earrings, handbags and sunglasses onto your look.",
  },
  {
    title: "Mira browser extension",
    body: "Try on clothes from any online store, straight from the product page.",
  },
  {
    title: "Full outfits",
    body: "Combine tops, bottoms and outerwear in a single try-on.",
  },
] as const;
