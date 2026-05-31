import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getShopTaxonomy } from "@/lib/supabase";
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
    return { title: "Toxome | Product not found" };
  }
  const title = `Toxome | ${product.item_name}`;
  const desc =
    product.description ||
    `${product.item_name} by ${product.brand}. Vetted by Toxome.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/shop/${id}` },
    openGraph: {
      title,
      description: desc,
      url: `/shop/${id}`,
      // Fall back to the site-wide og image (app/opengraph-image.tsx) when the
      // product has no image, rather than emitting an empty image list.
      images: product.item_image ? [product.item_image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, taxonomy] = await Promise.all([
    getProductById(id),
    getShopTaxonomy(),
  ]);
  if (!product) notFound();
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <ProductDetailClient product={product} />
      <Footer />
    </>
  );
}
