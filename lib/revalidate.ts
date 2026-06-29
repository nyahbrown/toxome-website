import { revalidatePath } from "next/cache";

/**
 * Flush every cached surface that renders product data so a change shows up
 * immediately instead of waiting for the page's time-based backstop.
 *
 * Shared by the admin write routes and the Supabase webhook (/api/revalidate)
 * so on-demand revalidation fires no matter how a product changed — the admin
 * UI, add-by-url, a backfill script, the app, or a direct table edit.
 */
export function revalidateProductSurfaces(id?: string | null) {
  // Department + index grids (static routes).
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

  // Attribute-collection and brand directory pages are dynamic; one product can
  // appear in many of them, so flush each route type wholesale rather than
  // trying to guess which slugs it belongs to.
  revalidatePath("/shop/collection/[slug]", "page");
  revalidatePath("/brand/[slug]", "page");

  // The product's own detail page.
  if (id) revalidatePath(`/shop/${id}`);

  // Sitemap, so newly published / removed products reach crawlers right away.
  revalidatePath("/sitemap.xml");
}
