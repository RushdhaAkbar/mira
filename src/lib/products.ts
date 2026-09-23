import type { Product } from "./types";

const u = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const PRODUCTS: Product[] = [
  {
    id: "linen-wrap-dress",
    name: "Linen wrap dress",
    type: "dress",
    category: "Dresses",
    priceLKR: 6900,
    image: u("photo-1595777457583-95e059d581b8"),
    colors: [
      { name: "Caramel", hex: "#8A6A47" },
      { name: "Ivory", hex: "#E7DFCF" },
      { name: "Moss", hex: "#4A5A48" },
    ],
    fabric: "100% washed linen",
    description: "A soft wrap silhouette with a tie waist that adjusts to you.",
    trending: true,
  },
  {
    id: "moss-silk-blouse",
    name: "Moss silk blouse",
    type: "top",
    category: "Tops",
    priceLKR: 4200,
    image: u("photo-1434389677669-e08b4cac3105"),
    colors: [
      { name: "Moss", hex: "#4A5A48" },
      { name: "Champagne", hex: "#D9C3A0" },
      { name: "Ink", hex: "#2B2A30" },
    ],
    fabric: "Silk crepe",
    description: "Relaxed drape with a soft collar, sits just below the hip.",
    trending: true,
  },
  {
    id: "evening-column",
    name: "Evening column",
    type: "dress",
    category: "Dresses",
    priceLKR: 9800,
    image: u("photo-1496747611176-843222e1e57c"),
    colors: [
      { name: "Charcoal", hex: "#3A352C" },
      { name: "Bordeaux", hex: "#5E2A32" },
    ],
    fabric: "Stretch satin",
    description: "A floor-length column with a gentle bias cut through the hip.",
  },
  {
    id: "clay-knit-top",
    name: "Clay knit top",
    type: "top",
    category: "Tops",
    priceLKR: 3600,
    image: u("photo-1521572163474-6864f9cf17ab"),
    colors: [
      { name: "Clay", hex: "#AA5A41" },
      { name: "Oat", hex: "#D8CBB4" },
    ],
    fabric: "Cotton rib knit",
    description: "Fitted rib knit with a slight stretch, true to size.",
    trending: true,
  },
  {
    id: "wide-leg-trouser",
    name: "Wide-leg trouser",
    type: "bottom",
    category: "Bottoms",
    priceLKR: 5400,
    image: u("photo-1509631179647-0177331693ae"),
    colors: [
      { name: "Sand", hex: "#C9B48E" },
      { name: "Black", hex: "#1F1E1C" },
    ],
    fabric: "Tencel twill",
    description: "High-rise waist with a fluid wide leg that skims the floor.",
  },
  {
    id: "tailored-blazer",
    name: "Tailored blazer",
    type: "outerwear",
    category: "Outerwear",
    priceLKR: 8200,
    image: u("photo-1487222477894-8943e31ef7b2"),
    colors: [
      { name: "Camel", hex: "#B08A5A" },
      { name: "Slate", hex: "#5B6068" },
    ],
    fabric: "Wool blend",
    description: "Single-breasted with a soft shoulder, layers over everything.",
  },
  {
    id: "slip-midi",
    name: "Slip midi dress",
    type: "dress",
    category: "Dresses",
    priceLKR: 7200,
    image: u("photo-1515886657613-9f3515b0c78f"),
    colors: [
      { name: "Sage", hex: "#8C9C86" },
      { name: "Rose", hex: "#C99A94" },
    ],
    fabric: "Satin viscose",
    description: "Bias-cut slip that follows the body without clinging.",
  },
  {
    id: "cropped-cardigan",
    name: "Cropped cardigan",
    type: "top",
    category: "Tops",
    priceLKR: 4800,
    image: u("photo-1483985988355-763728e1935b"),
    colors: [
      { name: "Cream", hex: "#EFE6D6" },
      { name: "Plum", hex: "#6A3D55" },
    ],
    fabric: "Merino wool",
    description: "Cropped to the natural waist, pairs with high-rise bottoms.",
  },
];

export const CATEGORIES = ["All", "Dresses", "Tops", "Bottoms", "Outerwear"] as const;

export const ACCESSORIES = [
  { key: "necklace", label: "Gold necklace", priceLKR: 1900 },
  { key: "bag", label: "Leather handbag", priceLKR: 5200 },
  { key: "sunglasses", label: "Sunglasses", priceLKR: 2400 },
] as const;

export function findProduct(id: string | undefined | null): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export const DELIVERY_LKR = 350;

export function formatLKR(n: number): string {
  return "LKR " + n.toLocaleString("en-US");
}
