import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "../ShopClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Toxome | Women's",
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
      <Suspense fallback={null}>
        <ShopClient products={products} taxonomy={taxonomy} section="women" />
      </Suspense>
      <Footer />
    </>
  );
}
