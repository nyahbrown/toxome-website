import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/types/product";

export type { Product };

export type ShopTaxonomy = {
  women: string[];
  men: string[];
  home: string[];
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getPublishedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error.message);
    return [];
  }
  return data ?? [];
}

export const getShopTaxonomy = cache(async (): Promise<ShopTaxonomy> => {
  const { data, error } = await supabase
    .from("products")
    .select("category, gender")
    .eq("published", true);

  if (error) {
    console.error("Supabase taxonomy fetch error:", error.message);
    return { women: [], men: [], home: [] };
  }

  // Count products per category so the filter dropdown can rank by relevance
  // (most-stocked categories first) instead of alphabetically.
  const women = new Map<string, number>();
  const men = new Map<string, number>();
  const home = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

  for (const row of data ?? []) {
    if (!row.category) continue;
    // Department is carried on `gender` (Women / Men / Home). Home goods get
    // their own real categories (Bedding, Bath, etc.) just like apparel.
    const g = (row.gender || "").toLowerCase();
    if (g === "women" || g === "female") bump(women, row.category);
    else if (g === "men" || g === "male") bump(men, row.category);
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
