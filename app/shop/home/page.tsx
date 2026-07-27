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
  title: "Natural Fiber Home & Bedding, Scored by Fiber | Toxome",
  description:
    "Natural fiber bedding, bath and blankets, hand-curated and scored by Toxome. Organic cotton, linen and wool for the textiles you live on.",
  alternates: { canonical: "/shop/home" },
};

export default async function HomeShopPage() {
  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  // Categories with their own indexable page, so the filter dropdown can
  // route into them instead of appending ?category=.
  const categoryPages = categorySlugsForSection("home").map((p) => ({
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
            section="home"
            heading="natural fiber home & bedding"
          />
        }
      >
        <ShopClient
          products={products}
          taxonomy={taxonomy}
          section="home"
          isDepartmentRoot
          categoryPages={categoryPages}
          heading="natural fiber home & bedding"
        />
      </Suspense>
      <ShopIntro intro="the textiles you sleep in and wrap up in touch your skin for hours at a time. every home piece here is scored by toxome for its fiber content, so you can choose bedding, bath, and throws made from cleaner natural fibers instead of synthetic blends." />
      <ShopNewsletter section="home" />
      <Footer />
    </>
  );
}
