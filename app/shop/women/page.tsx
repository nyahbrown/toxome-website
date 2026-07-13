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
  title: "Women's Non-Toxic Clothing | Toxome",
  description:
    "Non-plastic women's clothing, hand-curated by Toxome. Every item is low-toxin, made from cleaner natural fibers.",
  alternates: { canonical: "/shop/women" },
};

export default async function WomenShopPage() {
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
            section="women"
            heading="non-toxic women's clothing"
          />
        }
      >
        <ShopClient
          products={products}
          taxonomy={taxonomy}
          section="women"
          heading="non-toxic women's clothing"
        />
      </Suspense>
      <ShopIntro intro="every women's piece here is read for what it's actually made of, then scored for how it treats your skin and your body. we skip the polyester-heavy fast fashion and curate dresses, tops, and basics built from cleaner natural fibers like organic cotton, linen, and silk. filter by fiber to find your match." />
      <ShopNewsletter section="women" />
      <Footer />
    </>
  );
}
