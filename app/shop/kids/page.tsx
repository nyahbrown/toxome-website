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
  title: "Kids' Non-Toxic Clothing | Toxome",
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
      <Suspense
        fallback={
          <ShopGridFallback
            products={products}
            section="kids"
            heading="non-toxic kids' & baby clothing"
          />
        }
      >
        <ShopClient
          products={products}
          taxonomy={taxonomy}
          section="kids"
          heading="non-toxic kids' & baby clothing"
        />
      </Suspense>
      <ShopIntro intro="what touches a child's skin matters more, because young skin is thinner and more absorbent. every kids' and baby piece here is organic-cotton-forward and scored by toxome for its fiber content, so you can dress them in fabrics that breathe instead of plastic." />
      <Footer />
    </>
  );
}
