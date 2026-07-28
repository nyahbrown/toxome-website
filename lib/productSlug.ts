/**
 * Product URL slugs.
 *
 * Product pages lived at /shop/{uuid} until 2026-07-28, which put zero keyword
 * signal in the URL across 825 indexable pages. They now live at
 * /shop/{brand}-{name}, and the old UUID paths 301 to the slug so every
 * indexed URL, journal link and Pinterest pin still resolves.
 *
 * Slugs are STORED (products.slug), not derived at request time, for two
 * reasons: lookup is one indexed query, and a slug must not move when a
 * product is renamed. A URL that changes because someone fixed a typo in the
 * title is a URL that loses its ranking.
 */
import type { Product } from "@/types/product";

/** Lowercase, ASCII, hyphen-separated. Strips accents so DÔEN reads "doen". */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * Base slug for a product: brand then name, with the brand dropped when the
 * name already contains it so we don't ship "asket-the-asket-merino-sweater".
 * NOT guaranteed unique — colorways of one garment collapse to the same base,
 * which is why the backfill appends a short id suffix on collision.
 */
export function baseProductSlug(brand: string | null, itemName: string): string {
  const name = slugify(itemName || "");
  const b = slugify(brand || "");
  if (!b) return name;
  if (!name) return b;
  return name.startsWith(b) || name.includes(b) ? name : `${b}-${name}`;
}

/** The path a product should be linked at. Falls back to the id when a row has
 *  no slug yet (a fresh insert before the trigger, or a partial backfill), so a
 *  missing slug degrades to a working URL rather than a 404. */
export function productHref(p: Pick<Product, "id"> & { slug?: string | null }): string {
  return `/shop/${p.slug || p.id}`;
}

/** True when a route param is a UUID rather than a slug. Those still resolve,
 *  and the page 301s them to the slug. */
export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
