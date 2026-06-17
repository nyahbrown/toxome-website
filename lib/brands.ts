// Brand aggregation for the programmatic /brand/[slug] pages.
//
// Every brand page is derived from the products we've already scored: we group
// published products by `brand`, then compute a brand-level verdict (average
// Toxome score, risk spread, the fibers the brand leans on, cleanest picks and
// the pieces to skip). No new data source — this is the same catalog the shop
// runs on, re-cut by brand so we can rank for "is [brand] non-toxic".

import { getPublishedProducts } from "@/lib/supabase";
import { isBlacklisted } from "@/lib/brandBlacklist";
import type { Product } from "@/types/product";

// A brand needs at least this many SCORED products before it earns a page.
// Guardrail against thin / near-empty pages that read as doorway spam to Google.
const MIN_SCORED_PRODUCTS = 3;

export type FiberShare = { fiber: string; share: number };

export type BrandData = {
  brand: string;
  slug: string;
  productCount: number;
  scoredCount: number;
  avgScore: number | null;
  band: "low" | "moderate" | "high" | null; // overall risk verdict
  riskSpread: { low: number; moderate: number; high: number };
  topFibers: FiberShare[];
  cleanest: Product[]; // best-scoring pieces
  toAvoid: Product[]; // lowest-scoring pieces (only genuinely risky ones)
  allProducts: Product[];
};

export function slugifyBrand(brand: string): string {
  return brand
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// One average score → a single risk verdict, mirroring the app's bands.
function scoreToBand(score: number): "low" | "moderate" | "high" {
  if (score >= 70) return "low";
  if (score >= 45) return "moderate";
  return "high";
}

function buildBrand(brand: string, products: Product[]): BrandData {
  const scored = products.filter((p) => typeof p.toxome_score === "number");
  const avgScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, p) => sum + (p.toxome_score ?? 0), 0) /
            scored.length
        )
      : null;

  const riskSpread = { low: 0, moderate: 0, high: 0 };
  for (const p of products) {
    if (p.risk_level) riskSpread[p.risk_level] += 1;
  }

  // Aggregate fabric composition across the brand: sum each fiber's percentage
  // points, then normalise to a share of the brand's total fabric footprint.
  const fiberTotals = new Map<string, number>();
  let totalPoints = 0;
  for (const p of products) {
    if (!p.fabric_composition) continue;
    for (const [fiber, pct] of Object.entries(p.fabric_composition)) {
      fiberTotals.set(fiber, (fiberTotals.get(fiber) ?? 0) + pct);
      totalPoints += pct;
    }
  }
  const topFibers: FiberShare[] =
    totalPoints > 0
      ? [...fiberTotals.entries()]
          .map(([fiber, pts]) => ({ fiber, share: pts / totalPoints }))
          .sort((a, b) => b.share - a.share)
          .slice(0, 5)
      : [];

  const byScoreDesc = [...scored].sort(
    (a, b) => (b.toxome_score ?? 0) - (a.toxome_score ?? 0)
  );

  return {
    brand,
    slug: slugifyBrand(brand),
    productCount: products.length,
    scoredCount: scored.length,
    avgScore,
    band: avgScore != null ? scoreToBand(avgScore) : null,
    riskSpread,
    topFibers,
    cleanest: byScoreDesc.slice(0, 4),
    // Only surface "skip" items that are actually high-risk, not just the
    // lowest of a clean bunch.
    toAvoid: byScoreDesc
      .filter((p) => (p.toxome_score ?? 100) < 45)
      .slice(-4)
      .reverse(),
    allProducts: products,
  };
}

// Group the whole published catalog by brand once, cached per request tree.
async function getBrandMap(): Promise<Map<string, BrandData>> {
  const products = await getPublishedProducts();
  const groups = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.brand || isBlacklisted(p.brand)) continue;
    const arr = groups.get(p.brand) ?? [];
    arr.push(p);
    groups.set(p.brand, arr);
  }

  const map = new Map<string, BrandData>();
  for (const [brand, items] of groups) {
    map.set(slugifyBrand(brand), buildBrand(brand, items));
  }
  return map;
}

/** Slugs for every brand that clears the thin-content guardrail. Feeds
 * generateStaticParams + (later) the sitemap. */
export async function getBrandSlugs(): Promise<string[]> {
  const map = await getBrandMap();
  return [...map.values()]
    .filter((b) => b.scoredCount >= MIN_SCORED_PRODUCTS)
    .map((b) => b.slug);
}

export async function getBrandData(slug: string): Promise<BrandData | null> {
  const map = await getBrandMap();
  const data = map.get(slug);
  // Render only brands that earned a page; everything else 404s rather than
  // shipping an empty shell.
  if (!data || data.scoredCount < MIN_SCORED_PRODUCTS) return null;
  return data;
}
