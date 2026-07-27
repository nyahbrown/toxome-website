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

// Google truncates a result title around 60 characters. Everything past that is
// spent, not shown.
const TITLE_MAX = 60;

/** Keyword-first SEO title: item name (matches the long-tail garment query),
 * brand, then the Toxome differentiator that earns the click over the retailer.
 * Avoids repeating the brand when it's already in the item name.
 *
 * Degrades to fit 60 chars instead of emitting one fixed shape. An audit on
 * 2026-07-27 found 389 of 824 published titles (47%) over the limit, averaging
 * 61: product names average 25 characters and 92 exceed 38, so " by {brand}"
 * plus a 21-character " | Toxome Fiber Score" suffix pushed most of the catalog
 * past it. The ladder keeps the fullest version that actually renders:
 *
 *   1. name by brand | Toxome Fiber Score   (the differentiator survives)
 *   2. name by brand | Toxome               (brand survives)
 *   3. name | Toxome Fiber Score            (long name, brand already implied)
 *   4. name | Toxome
 *   5. truncated name | Toxome              (last resort, cut on a word)
 *
 * The product NAME is never dropped — it is the long-tail query being matched.
 */
export function productSeoTitle(p: Product): string {
  const name = p.item_name;
  const brandIsRedundant =
    !p.brand || name.toLowerCase().includes(p.brand.toLowerCase());
  const withBrand = brandIsRedundant ? name : `${name} by ${p.brand}`;

  for (const candidate of [
    `${withBrand} | Toxome Fiber Score`,
    `${withBrand} | Toxome`,
    `${name} | Toxome Fiber Score`,
    `${name} | Toxome`,
  ]) {
    if (candidate.length <= TITLE_MAX) return candidate;
  }

  // Name alone still overflows. Cut on a word boundary so the title never ends
  // mid-word, and keep the suffix so the result is still identifiably Toxome.
  const room = TITLE_MAX - " | Toxome".length;
  const cut = name.slice(0, room);
  const atWord = cut.slice(0, cut.lastIndexOf(" "));
  return `${(atWord.length > room * 0.6 ? atWord : cut).trim()} | Toxome`;
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
