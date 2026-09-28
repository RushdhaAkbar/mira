export type GarmentType = "dress" | "top" | "bottom" | "outerwear";
export type Size = "S" | "M" | "L";
export type FitPref = "slim" | "regular" | "oversized";

/** Which study arm the tester is in: with AI, or the standard (no-AI) experience. */
export type Variant = "ai" | "standard";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  type: GarmentType;
  category: string;
  gender: "Women" | "Men" | "Unisex";
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

export interface AiQuota {
  used: number;
  limit: number;
  remaining: number;
}

/** One tester's feedback, as stored in MongoDB and shown in the admin portal. */
export interface FeedbackInput {
  variant: Variant;
  overall: number; // 1-5
  realism: number; // 1-5
  fitConfidence: number; // 1-5
  easeOfUse: number; // 1-5
  purchaseIntent: number; // 1-5
  photoComfort: number | null; // 1-5, AI version only (the standard version has no photo)
  recommend: number; // 0-10 (NPS)
  liked: string;
  improve: string;
  ageRange: string;
  gender: string;
  shopsOnline: string;
  email: string;
  context: {
    productId: string;
    productName: string;
    colorName: string;
    triedSize: Size;
    recommendedSize: Size | null;
    aiRendered: boolean;
  };
}
