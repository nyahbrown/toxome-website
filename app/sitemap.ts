import type { MetadataRoute } from "next";
import { allFiberSlugs } from "@/lib/fiberGuide";
import { getPublishedProducts } from "@/lib/supabase";

const BASE_URL = "https://toxome.app";

// Regenerate hourly so newly published products / guide entries get picked up
// without a full redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/shop/women`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/shop/men`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/shop/home`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/guide`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/journal`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Fiber guide — the proprietary glossary, one indexable page per fiber.
  const fiberRoutes: MetadataRoute.Sitemap = allFiberSlugs().map((slug) => ({
    url: `${BASE_URL}/guide/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Product detail pages. Tolerate a data-source failure so the sitemap still
  // builds with the static + guide routes rather than 500-ing.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getPublishedProducts();
    productRoutes = products.map((p) => ({
      url: `${BASE_URL}/shop/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (err) {
    console.error("sitemap: failed to load products", err);
  }

  return [...staticRoutes, ...fiberRoutes, ...productRoutes];
}
