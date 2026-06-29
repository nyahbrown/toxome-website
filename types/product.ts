import type { VerificationRung } from "@/lib/verification";

export type RiskLevel = "low" | "moderate" | "high";

export interface Product {
  id: string;
  item_name: string;
  brand: string;
  item_price: number | null;
  currency: string;
  budget: string | null;
  category: string | null;
  gender: string | null;
  region: string | null;
  item_image: string | null;
  item_url: string | null;
  affiliate_url: string | null;
  affiliate_program: string | null;
  commission_rate: number | null;
  toxome_score: number | null;
  risk_level: RiskLevel | null;
  fabric_composition: Record<string, number> | null;
  tags: string[] | null;
  brand_verified: boolean;
  added_by: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  images: string[] | null;
  description: string | null;
  materials_text: string | null;
  certifications: string[] | null;
  // Confidence rung for the score. Null for current products (they resolve from
  // certs); written later by the brand-disclosure intake or a lab test.
  verification_rung?: VerificationRung | null;
  // Fibers present when no percentage breakdown is published (e.g. home goods).
  // Display-only: rendered as a fiber list with NO Toxome score or bars.
  fibers_present?: string[] | null;
  occasion?: string[] | null;
  age_band?: "baby" | "kids" | null;
  // Raw distinct size labels from the source (e.g. ["0-3M","2T","5/6"]).
  // Kids age bands for the shop filter are derived from this via lib/kidsSizes.
  sizes?: string[] | null;
}
