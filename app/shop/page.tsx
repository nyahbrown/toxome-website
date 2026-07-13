import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "./ShopClient";
import ShopGridFallback from "./ShopGridFallback";
import ShopIntro from "@/components/ShopIntro";
import ShopNewsletter from "@/components/ShopNewsletter";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Shop Non-Toxic Clothing | Toxome",
  description:
    "Non-plastic clothing, hand-curated by Toxome. Every item is low-toxin, made from cleaner natural fibers.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <Suspense fallback={<ShopGridFallback products={products} />}>
        <ShopClient products={products} taxonomy={taxonomy} section={null} />
      </Suspense>
      <ShopIntro intro="every piece in the toxome shop is read for its fiber content and scored for how it treats your body. we curate non-toxic clothing and home textiles made from cleaner natural fibers like organic cotton, linen, silk, and hemp, and skip the plastic-heavy fast fashion. filter by fiber, department, or certification to find your match." />
      <ShopNewsletter />
      <Footer />
    </>
  );
}
