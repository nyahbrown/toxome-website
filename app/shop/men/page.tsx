import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "../ShopClient";
import ShopGridFallback from "../ShopGridFallback";
import ShopIntro from "@/components/ShopIntro";
import ShopNewsletter from "@/components/ShopNewsletter";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Men's Non-Toxic Clothing | Toxome",
  description:
    "Non-plastic men's clothing, hand-curated by Toxome. Every item is low-toxin, made from cleaner natural fibers.",
  alternates: { canonical: "/shop/men" },
};

export default async function MenShopPage() {
  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <Suspense
        fallback={
          <ShopGridFallback
            products={products}
            section="men"
            heading="non-toxic men's clothing"
          />
        }
      >
        <ShopClient
          products={products}
          taxonomy={taxonomy}
          section="men"
          heading="non-toxic men's clothing"
        />
      </Suspense>
      <ShopIntro intro="men's clothing curated for what's in the fabric, not just the look. every piece is scored by toxome for its fiber content, so you can build a wardrobe of organic cotton, linen, hemp, and merino wool instead of plastic blends. filter by fiber to shop the cleanest options." />
      <ShopNewsletter section="men" />
      <Footer />
    </>
  );
}
