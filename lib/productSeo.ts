// SEO helpers for product pages: keyword-first titles and a programmatic
// description generated from data already on the product, so no product page
// ships thin (GSC showed product pages ranking but earning ~0 clicks because
// the title was just "Toxome | {name}" and many descriptions were generic).

import type { Product } from "@/types/product";

// Clean a fabric_composition key for display. Handles the catalog's mixed key
// formats ("organic cotton" vs "organic_cotton") without collapsing to a base
// fiber, so the real fiber name is preserved.
function cleanFiber(key: string): string {
  return key.toLowerCase().replace(/_/g, " ").trim();
}

/** The dominant fiber (highest %), for titles. Falls back to fibers_present. */
export function primaryFiber(p: Product): string | null {
  if (p.fabric_composition) {
    const top = Object.entries(p.fabric_composition).sort((a, b) => b[1] - a[1])[0];
    if (top) return cleanFiber(top[0]);
  }
  if (p.fibers_present?.length) return cleanFiber(p.fibers_present[0]);
  return null;
}

/** Compact fiber breakdown like "70% cotton, 30% linen" (top 3). */
function fiberBreakdown(p: Product): string | null {
  if (p.fabric_composition) {
    const entries = Object.entries(p.fabric_composition)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (entries.length) {
      return entries.map(([k, v]) => `${Math.round(v)}% ${cleanFiber(k)}`).join(", ");
    }
  }
  if (p.fibers_present?.length) {
    return p.fibers_present.map(cleanFiber).join(", ");
  }
  return null;
}

/** Keyword-first SEO title: item name (matches the long-tail garment query),
 * brand, then the Toxome differentiator that earns the click over the retailer.
 * Avoids repeating the brand when it's already in the item name. */
export function productSeoTitle(p: Product): string {
  const lead =
    !p.brand || p.item_name.toLowerCase().includes(p.brand.toLowerCase())
      ? p.item_name
      : `${p.item_name} by ${p.brand}`;
  return `${lead} | Toxome Fiber Score`;
}

/** Meta description + on-page About fallback, built from product data so every
 * product page has unique, useful text even when `description` is empty. */
export function productSeoDescription(p: Product): string {
  const parts: string[] = [`${p.item_name} by ${p.brand}.`];
  const breakdown = fiberBreakdown(p);
  if (breakdown) parts.push(`Made of ${breakdown}.`);
  if (typeof p.toxome_score === "number") {
    parts.push(`Toxome scores it ${p.toxome_score}/100 for fiber health.`);
  }
  if (p.certifications?.length) {
    parts.push(`Certified ${p.certifications.slice(0, 3).join(", ")}.`);
  }
  return parts.join(" ");
}
