import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "../ShopClient";
import ShopGridFallback from "../ShopGridFallback";
import ShopIntro from "@/components/ShopIntro";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Non-Toxic Home & Bedding | Toxome",
  description:
    "Clean home goods, hand-curated by Toxome. Low-toxin textiles for the spaces you live in.",
  alternates: { canonical: "/shop/home" },
};

export default async function HomeShopPage() {
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
            section="home"
            heading="non-toxic home & bedding"
          />
        }
      >
        <ShopClient
          products={products}
          taxonomy={taxonomy}
          section="home"
          heading="non-toxic home & bedding"
        />
      </Suspense>
      <ShopIntro intro="the textiles you sleep in and wrap up in touch your skin for hours at a time. every home piece here is scored by toxome for its fiber content, so you can choose bedding, bath, and throws made from cleaner natural fibers instead of synthetic blends." />
      <Footer />
    </>
  );
}
