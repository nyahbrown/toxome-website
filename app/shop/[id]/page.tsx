import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/supabase";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return { title: "Product not found — Toxome" };
  }
  const title = `${product.item_name} — ${product.brand} · Toxome`;
  const desc =
    product.description ||
    `${product.item_name} by ${product.brand}. Vetted by Toxome.`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: product.item_image ? [product.item_image] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  return (
    <>
      <Nav />
      <ProductDetailClient product={product} />
      <Footer />
    </>
  );
}
