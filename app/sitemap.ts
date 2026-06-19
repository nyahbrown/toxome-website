import type { MetadataRoute } from "next";
import { allFiberSlugs } from "@/lib/fiberGuide";
import { getPublishedProducts } from "@/lib/supabase";
import { getAllSlugs, getArticle } from "@/lib/journal";
import { allCollectionSlugs } from "@/lib/shopPages";

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
    { url: `${BASE_URL}/shop/kids`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/shop/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/guide`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/guide/certifications`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/journal`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/app`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/extension`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/partnerships`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Programmatic shop collections (attribute-filtered directory pages).
  const collectionRoutes: MetadataRoute.Sitemap = allCollectionSlugs().map((slug) => ({
    url: `${BASE_URL}/shop/collection/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Fiber guide, the proprietary glossary, one indexable page per fiber.
  const fiberRoutes: MetadataRoute.Sitemap = allFiberSlugs().map((slug) => ({
    url: `${BASE_URL}/guide/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Journal articles, one indexable page per published markdown file.
  const journalRoutes: MetadataRoute.Sitemap = getAllSlugs().map((slug) => {
    const article = getArticle(slug);
    return {
      url: `${BASE_URL}/journal/${slug}`,
      lastModified: article?.date ? new Date(`${article.date}T12:00:00Z`) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

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

  return [
    ...staticRoutes,
    ...collectionRoutes,
    ...fiberRoutes,
    ...journalRoutes,
    ...productRoutes,
  ];
}
