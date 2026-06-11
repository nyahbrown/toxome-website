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
  // Fibers present when no percentage breakdown is published (e.g. home goods).
  // Display-only: rendered as a fiber list with NO Toxome score or bars.
  fibers_present?: string[] | null;
  occasion?: string[] | null;
  age_band?: "baby" | "kids" | null;
}
