import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "../ShopClient";

export const revalidate = 3600;

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
      <Suspense fallback={null}>
        <ShopClient products={products} taxonomy={taxonomy} section="home" />
      </Suspense>
      <Footer />
    </>
  );
}
