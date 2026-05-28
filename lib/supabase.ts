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

  const women = new Set<string>();
  const men = new Set<string>();
  const home = new Set<string>();

  for (const row of data ?? []) {
    if (!row.category) continue;
    if (row.category === "Other") {
      home.add("Other");
      continue;
    }
    const g = (row.gender || "").toLowerCase();
    if (g === "women" || g === "female") women.add(row.category);
    else if (g === "men" || g === "male") men.add(row.category);
  }

  const sortAlpha = (a: string, b: string) => a.localeCompare(b);
  return {
    women: [...women].sort(sortAlpha),
    men: [...men].sort(sortAlpha),
    home: [...home].sort(sortAlpha),
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
    .order("toxome_score", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (problemCategories.length > 0) {
    q = q.in("category", problemCategories);
  }
  q = q.or("risk_level.eq.low,toxome_score.lte.30");

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
