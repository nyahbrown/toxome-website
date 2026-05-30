import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "./ShopClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Toxome | Shop",
  description:
    "Non-plastic clothing, hand-curated by Toxome. Every item is low-toxin, made from cleaner natural fibers.",
};

export default async function ShopPage() {
  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <Suspense fallback={null}>
        <ShopClient products={products} taxonomy={taxonomy} section={null} />
      </Suspense>
      <Footer />
    </>
  );
}
