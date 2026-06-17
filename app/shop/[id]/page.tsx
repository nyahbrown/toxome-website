import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getShopTaxonomy } from "@/lib/supabase";
import { findCertification } from "@/lib/certifications";
import { availableLogos } from "@/lib/certLogos";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 3600;

const SITE = "https://toxome.app";

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

  // Resolve each free-form certification string to a guide entry so the detail
  // page can render the same circular badge the certifications guide uses. The
  // logo lookup needs the filesystem, so it runs here on the server.
  const logos = availableLogos();
  const certBadges = (product.certifications ?? []).map((raw) => {
    const cert = findCertification(raw);
    const slug = cert?.slug ?? raw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      slug,
      name: cert?.name ?? raw,
      abbr: cert?.abbr,
      label: cert?.abbr ?? cert?.name ?? raw,
      logoSrc: cert ? logos.get(cert.slug) : undefined,
      href: cert ? `/guide/certifications#${cert.slug}` : undefined,
    };
  });

  const images = [product.item_image, ...(product.images ?? [])].filter(
    (u): u is string => !!u
  );
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.item_name,
    ...(images.length ? { image: images } : {}),
    ...(product.description ? { description: product.description } : {}),
    brand: { "@type": "Brand", name: product.brand },
    ...(product.item_price != null
      ? {
          offers: {
            "@type": "Offer",
            price: product.item_price,
            priceCurrency: product.currency || "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE}/shop/${id}`,
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={schema} />
      <Nav taxonomy={taxonomy} />
      <ProductDetailClient product={product} certBadges={certBadges} />
      <Footer />
    </>
  );
}
