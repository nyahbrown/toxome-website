import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getShopTaxonomy } from "@/lib/supabase";
import { outboundHrefFor } from "@/lib/affiliatePrograms";
import { findCertification } from "@/lib/certifications";
import { availableLogos } from "@/lib/certLogos";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { productSeoTitle, productSeoDescription } from "@/lib/productSeo";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 604800; // weekly backstop; on-demand revalidation keeps it fresh on change

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
  const title = productSeoTitle(product);
  const desc = product.description || productSeoDescription(product);
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

  // Where the Buy button points. Resolved on the server because it reads
  // brand_affiliate_programs, which is service-role only (it holds publisher_id).
  //
  // Returns /out/<id> only for a brand whose program row actually builds a
  // wrapper, and a direct merchant link otherwise — routing an unwrapped click
  // through /out would hide it from Skimlinks, which is the only thing earning on
  // the 154 brands with no row. See lib/affiliatePrograms.ts.
  //
  // ⚠ This page is ISR-cached (revalidate below), so the href is decided at
  // render time, not click time. A brand's first program row does not reach the
  // Buy button until this page revalidates — POST /api/revalidate after inserting
  // one instead of waiting out the weekly backstop.
  const outboundHref = await outboundHrefFor({
    id: product.id,
    brand: product.brand,
    item_url: product.item_url ?? null,
    affiliate_url: product.affiliate_url ?? null,
  });

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
    description: product.description || productSeoDescription(product),
    brand: { "@type": "Brand", name: product.brand },
    // Surface the Toxome fiber-health score as structured data (the honest way —
    // NOT aggregateRating, which requires real user reviews).
    ...(typeof product.toxome_score === "number"
      ? {
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Toxome fiber health score",
              value: product.toxome_score,
              maxValue: 100,
            },
          ],
        }
      : {}),
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
      <ProductDetailClient
        product={product}
        certBadges={certBadges}
        outboundHref={outboundHref}
      />
      <Footer />
    </>
  );
}
