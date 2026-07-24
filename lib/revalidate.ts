import { revalidatePath } from "next/cache";
import { slugifyBrand } from "./brands";

/**
 * Flush the cached surfaces a single product change actually affects, so the
 * change shows up quickly without regenerating the whole catalog.
 *
 * Scope note (2026-07-23): this used to flush EVERY collection page and EVERY
 * brand page wholesale (`revalidatePath("/shop/collection/[slug]", "page")` +
 * the same for `/brand/[slug]`). With ~1,150 products across 206 brands and 32
 * collections, one product write dirtied ~245 pages; crawlers + the sitemap
 * then regenerated them all, and that fan-out was the bulk of Vercel's ISR-write
 * usage (blew past the Hobby cap). Collections carry a daily backstop
 * (`revalidate = 86400`) and brand pages a weekly one, so a new/edited product
 * reaching those grids within a day is fine — we no longer pay ~100× the ISR
 * writes to make it instant. We still flush on-demand the surfaces a shopper is
 * most likely to hit immediately: the department grids, the product's own detail
 * page, and its own brand page.
 *
 * Shared by the admin write routes and the Supabase webhook (/api/revalidate)
 * so on-demand revalidation fires no matter how a product changed — the admin
 * UI, add-by-url, a backfill script, the app, or a direct table edit.
 *
 * @param id    the product's id (for its detail page)
 * @param brand the product's brand name (for its own /brand/[slug] page)
 */
export function revalidateProductSurfaces(
  id?: string | null,
  brand?: string | null,
) {
  // Department + index grids (static routes). Six pages, negligible write cost,
  // and the surfaces shoppers land on first.
  for (const path of [
    "/shop",
    "/shop/women",
    "/shop/men",
    "/shop/kids",
    "/shop/home",
    "/shop/collections",
  ]) {
    revalidatePath(path);
  }

  // The product's own detail page.
  if (id) revalidatePath(`/shop/${id}`);

  // The product's OWN brand page only — not every brand. Brand pages otherwise
  // ride their weekly time backstop, which is why we flush this one on-demand
  // (a week is too long for a brand's own verdict to lag a change).
  if (brand) revalidatePath(`/brand/${slugifyBrand(brand)}`);

  // Sitemap, so newly published / removed products reach crawlers right away.
  revalidatePath("/sitemap.xml");
}
