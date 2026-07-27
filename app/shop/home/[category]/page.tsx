/**
 * /shop/home/[category] — indexable category pages for the home department.
 * Content + copy live in lib/shopCategoryPages.ts; rendering in
 * app/shop/CategoryPageView.tsx. This file is only the route binding.
 */
import type { Metadata } from "next";
import CategoryPageView from "../../CategoryPageView";
import { getCategoryPage, categorySlugsForSection } from "@/lib/shopCategoryPages";

const SECTION = "home" as const;

export const revalidate = 86400;

export function generateStaticParams() {
  return categorySlugsForSection(SECTION).map((p) => ({ category: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const page = getCategoryPage(SECTION, category);
  if (!page) return { title: "Category not found | Toxome" };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/shop/${SECTION}/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `/shop/${SECTION}/${page.slug}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <CategoryPageView section={SECTION} slug={category} />;
}
