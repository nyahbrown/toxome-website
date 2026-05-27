import type { Metadata } from "next";
import { getPublishedProducts } from "@/lib/supabase";
import ShopClient from "./ShopClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop Clean Clothes — Toxome",
  description:
    "Hand-selected clothing alternatives. Every item is low-toxin, made from cleaner fabrics. Shop with affiliate links that support Toxome.",
};

export default async function ShopPage() {
  const products = await getPublishedProducts();
  return <ShopClient products={products} />;
}
