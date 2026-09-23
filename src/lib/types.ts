export type GarmentType = "dress" | "top" | "bottom" | "outerwear";
export type Size = "S" | "M" | "L";
export type FitPref = "slim" | "regular" | "oversized";
export type AccessoryKey = "necklace" | "bag" | "sunglasses";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  type: GarmentType;
  category: string;
  priceLKR: number;
  image: string;
  colors: ColorOption[];
  fabric: string;
  description: string;
  trending?: boolean;
}

export interface Measurements {
  height: number;
  weight: number;
  bust: number;
  waist: number;
  hips: number;
}

export interface SizeRecommendation {
  size: Size;
  confidence: number;
  score: number;
  reason: string;
}

export interface FitZone {
  zone: string;
  status: "good" | "tight" | "loose";
}

export interface FitResult {
  score: number;
  verdict: "Highly fit" | "Moderate fit" | "Poor fit";
  zones: FitZone[];
  recommended: Size;
  tried: Size;
  confidence: number;
  explanation: string;
  source: "claude" | "rules";
}

export interface CartItem {
  productId: string;
  name: string;
  size: Size;
  colorHex: string;
  image: string;
  priceLKR: number;
}

export interface StylistOutfit {
  title: string;
  occasion: string;
  pieces: string[];
  why: string;
  match: number;
}
