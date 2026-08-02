import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getProductBySlugOrId,
  getShopTaxonomy,
  getCanonicalProductId,
  getPublishedProductSlugs,
} from "@/lib/supabase";
import { isUuid, productHref } from "@/lib/productSlug";
import { outboundHrefFor } from "@/lib/affiliatePrograms";
import { findCertification } from "@/lib/certifications";
import { availableLogos } from "@/lib/certLogos";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { productSeoTitle, productSeoDescription } from "@/lib/productSeo";
import ProductDetailClient from "./ProductDetailClient";
import ProductSeoSection from "./ProductSeoSection";
import { productFaqs, productCategoryPage } from "@/lib/productCopy";

export const revalidate = 604800; // weekly backstop; on-demand revalidation keeps it fresh on change

/**
 * Prerender every published product at build time.
 *
 * Without this, each product URL was a cold render on first request, and since a
 * crawler hits each URL roughly once, the ISR cache never got to help: logs
 * showed cache=MISS on essentially every /shop/* hit. One full catalog crawl was
 * ~800 cold renders (~1,600 invocations counting the UUID redirect hop), which
 * is what exhausted the Vercel Fluid Active CPU allowance.
 *
 * dynamicParams stays at its default (true), so UUID URLs and anything published
 * between builds still render on demand and 301 to the slug as before.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs();
  return slugs.map((id) => ({ id }));
}

const SITE = "https://toxome.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductBySlugOrId(id);
  if (!product) {
    return { title: "Toxome | Product not found" };
  }
  const title = productSeoTitle(product);
  const desc = product.description || productSeoDescription(product);
  // Colorways of one garment are separate rows (dedupe is on item_url), so they
  // ship identical titles and compete with each other. Point every twin's
  // canonical at the oldest of the group; they all stay live and shoppable.
  const canonicalId = await getCanonicalProductId(product);
  return {
    title,
    description: desc,
    alternates: { canonical: `/shop/${canonicalId}` },
    openGraph: {
      title,
      description: desc,
      url: `/shop/${canonicalId}`,
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
    getProductBySlugOrId(id),
    getShopTaxonomy(),
  ]);
  if (!product) notFound();

  // Product pages moved from /shop/{uuid} to /shop/{slug} on 2026-07-28. Every
  // UUID that is still out there (indexed, pinned, hard-coded in a journal
  // article) keeps working and lands on the keyword URL with a 301, so the
  // ranking follows rather than being stranded on a dead path.
  if (isUuid(id) && product.slug) permanentRedirect(productHref(product));

  // Same consolidation the canonical uses, so the Product schema's offer URL
  // agrees with the <link rel="canonical"> instead of contradicting it.
  const canonicalId = await getCanonicalProductId(product);

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
  const faqs = productFaqs(product);
  const categoryPage = productCategoryPage(product);
  const productSchema = {
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
            url: `${SITE}/shop/${canonicalId}`,
          },
        }
      : {}),
  };

  // One @graph rather than three script tags: the Product, the questions this
  // page now answers in prose, and the Home > Shop > Department > Product trail.
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      productSchema,
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop` },
          ...(categoryPage
            ? [{
                "@type": "ListItem",
                position: 3,
                name: categoryPage.heading,
                item: `${SITE}${categoryPage.href}`,
              }]
            : []),
          {
            "@type": "ListItem",
            position: categoryPage ? 4 : 3,
            name: product.item_name,
            item: `${SITE}/shop/${canonicalId}`,
          },
        ],
      },
    ],
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
      <ProductSeoSection product={product} />
      <Footer />
    </>
  );
}
