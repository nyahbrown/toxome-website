import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "../ShopClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Toxome | Kids",
  description:
    "Non-toxic baby & kids clothing, hand-curated by Toxome. Every piece is low-toxin, made from cleaner natural fibers, gentlest on growing skin.",
  alternates: { canonical: "/shop/kids" },
};

export default async function KidsShopPage() {
  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <Suspense fallback={null}>
        <ShopClient products={products} taxonomy={taxonomy} section="kids" />
      </Suspense>
      <Footer />
    </>
  );
}
