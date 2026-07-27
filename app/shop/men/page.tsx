import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "../ShopClient";
import ShopGridFallback from "../ShopGridFallback";
import ShopIntro from "@/components/ShopIntro";
import ShopNewsletter from "@/components/ShopNewsletter";
import { categorySlugsForSection } from "@/lib/shopCategoryPages";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Men's Natural Fiber Clothing, Scored by Fiber | Toxome",
  description:
    "Natural fiber clothing for men, hand-curated and scored by Toxome. Organic cotton, linen, hemp and wool, without the plastic blends.",
  alternates: { canonical: "/shop/men" },
};

export default async function MenShopPage() {
  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  // Categories with their own indexable page, so the filter dropdown can
  // route into them instead of appending ?category=.
  const categoryPages = categorySlugsForSection("men").map((p) => ({
    category: p.category,
    slug: p.slug,
  }));
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <Suspense
        fallback={
          <ShopGridFallback
            products={products}
            section="men"
            heading="men's natural fiber clothing"
          />
        }
      >
        <ShopClient
          products={products}
          taxonomy={taxonomy}
          section="men"
          isDepartmentRoot
          categoryPages={categoryPages}
          heading="men's natural fiber clothing"
        />
      </Suspense>
      <ShopIntro intro="men's clothing curated for what's in the fabric, not just the look. every piece is scored by toxome for its fiber content, so you can build a wardrobe of organic cotton, linen, hemp, and merino wool instead of plastic blends. filter by fiber to shop the cleanest options." />
      <ShopNewsletter section="men" />
      <Footer />
    </>
  );
}
