import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/types/product";
import { resolveRung, healthCertBadge, type HealthCertBadge } from "@/lib/verification";

export type { Product };

export type VerifiedBrand = {
  brand: string;
  certs: HealthCertBadge[];
  count: number;
};

export type ShopTaxonomy = {
  women: string[];
  men: string[];
  kids: string[];
  home: string[];
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// PostgREST caps any select at 1000 rows and reports NO error — it just returns
// the first page. The queries below are each meant to return the WHOLE published
// catalog, so a plain select silently drops products from the shop grid, the
// fiber filter, and the brand directory once the catalog passes the cap, with
// nothing in the logs to say so. Page until a short page comes back.
//
// Callers must supply a total order (a unique tiebreaker like id), or rows can
// shift between pages and be duplicated or skipped at a boundary.
const PAGE_SIZE = 1000;

async function selectAllPages<T>(
  buildPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export async function getPublishedProducts(): Promise<Product[]> {
  try {
    return await selectAllPages<Product>((from, to) =>
      supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    );
  } catch (e) {
    console.error("Supabase fetch error:", (e as Error).message);
    return [];
  }
}

export const getShopTaxonomy = cache(async (): Promise<ShopTaxonomy> => {
  let data: { category: string | null; gender: string | null }[];
  try {
    data = await selectAllPages((from, to) =>
      supabase
        .from("products")
        .select("category, gender")
        .eq("published", true)
        .order("id", { ascending: true })
        .range(from, to)
    );
  } catch (e) {
    console.error("Supabase taxonomy fetch error:", (e as Error).message);
    return { women: [], men: [], kids: [], home: [] };
  }

  // Count products per category so the filter dropdown can rank by relevance
  // (most-stocked categories first) instead of alphabetically.
  const women = new Map<string, number>();
  const men = new Map<string, number>();
  const kids = new Map<string, number>();
  const home = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

  for (const row of data ?? []) {
    if (!row.category) continue;
    // Department is carried on `gender` (Women / Men / Home). Home goods get
    // their own real categories (Bedding, Bath, etc.) just like apparel.
    const g = (row.gender || "").toLowerCase();
    if (g === "women" || g === "female") bump(women, row.category);
    else if (g === "men" || g === "male") bump(men, row.category);
    else if (g === "kids") bump(kids, row.category);
    else if (g === "home") bump(home, row.category);
  }

  // Rank by count desc, alphabetical as a stable tiebreaker.
  const byRelevance = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([cat]) => cat);

  return {
    women: byRelevance(women),
    men: byRelevance(men),
    kids: byRelevance(kids),
    home: byRelevance(home),
  };
});

export async function getCleanerAlternatives(
  problemCategories: string[],
  limit = 4
): Promise<Product[]> {
  // No problem categories → pull general low-risk picks regardless of category.
  let q = supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("toxome_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (problemCategories.length > 0) {
    q = q.in("category", problemCategories);
  }
  q = q.or("risk_level.eq.low,toxome_score.gte.70");

  const { data, error } = await q;
  if (error) {
    console.error("Supabase alternatives fetch error:", error.message);
    return [];
  }
  return data ?? [];
}

// Brands with at least one product that resolves to the "verified" rung. Each
// carries the set of health certs found across its published products and a
// product count. Computed with the SAME resolver the product pages use, so the
// directory and the pills can never drift. Sorted by count desc, then name.
export const getVerifiedBrands = cache(async (): Promise<VerifiedBrand[]> => {
  let data: Pick<Product, "brand" | "certifications" | "verification_rung">[];
  try {
    data = await selectAllPages((from, to) =>
      supabase
        .from("products")
        .select("brand, certifications, verification_rung")
        .eq("published", true)
        .order("id", { ascending: true })
        .range(from, to)
    );
  } catch (e) {
    console.error("Supabase verified-brands fetch error:", (e as Error).message);
    return [];
  }

  const byBrand = new Map<
    string,
    { certs: Map<string, HealthCertBadge>; count: number }
  >();
  for (const row of data ?? []) {
    const brand = (row.brand || "").trim();
    if (!brand) continue;
    const rung = resolveRung({
      certifications: row.certifications,
      verification_rung: row.verification_rung,
    });
    if (rung !== "verified") continue;

    const entry =
      byBrand.get(brand) ?? { certs: new Map<string, HealthCertBadge>(), count: 0 };
    entry.count += 1;
    for (const c of row.certifications ?? []) {
      const badge = healthCertBadge(c);
      if (badge) entry.certs.set(badge.slug, badge); // dedupe by slug
    }
    byBrand.set(brand, entry);
  }

  return [...byBrand.entries()]
    .map(([brand, e]) => ({
      brand,
      certs: [...e.certs.values()].sort((a, b) => a.label.localeCompare(b.label)),
      count: e.count,
    }))
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
});

// Fetch a fixed set of published products by ID, preserving the order of the
// `ids` argument (Supabase `.in()` returns rows in arbitrary order). Missing or
// unpublished IDs are silently dropped. Used by the curated "Shop the edit"
// override on Journal articles.
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("published", true);

  if (error) {
    console.error("Supabase products-by-ids fetch error:", error.message);
    return [];
  }
  const byId = new Map((data ?? []).map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is Product => !!p);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("Supabase product fetch error:", error.message);
    return null;
  }
  return data;
}
