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
  title: "Women's Natural Fiber Clothing, Scored by Fiber | Toxome",
  description:
    "Natural fiber clothing for women, hand-curated and scored by Toxome. Organic cotton, linen, silk and wool, without the plastic blends.",
  alternates: { canonical: "/shop/women" },
};

export default async function WomenShopPage() {
  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  // Categories with their own indexable page, so the filter dropdown can
  // route into them instead of appending ?category=.
  const categoryPages = categorySlugsForSection("women").map((p) => ({
    category: p.category,
    slug: p.slug,
    subHeadings: p.subcategoryHeadings,
  }));
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <Suspense
        fallback={
          <ShopGridFallback
            products={products}
            section="women"
            heading="women's natural fiber clothing"
          />
        }
      >
        <ShopClient
          products={products}
          taxonomy={taxonomy}
          section="women"
          isDepartmentRoot
          categoryPages={categoryPages}
          heading="women's natural fiber clothing"
        />
      </Suspense>
      <ShopIntro intro="every women's piece here is read for what it's actually made of, then scored for how it treats your skin and your body. we skip the polyester-heavy fast fashion and curate dresses, tops, and basics built from cleaner natural fibers like organic cotton, linen, and silk. filter by fiber to find your match." />
      <ShopNewsletter section="women" />
      <Footer />
    </>
  );
}
