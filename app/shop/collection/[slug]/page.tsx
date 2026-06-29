import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ShopClient from "../../ShopClient";
import ShopGridFallback from "../../ShopGridFallback";
import CollectionTracker from "./CollectionTracker";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import { getCollection, allCollectionSlugs } from "@/lib/shopPages";

const BASE_URL = "https://toxome.app";

export const revalidate = 86400;

export async function generateStaticParams() {
  return allCollectionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return { title: "Collection not found | Toxome" };
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/shop/collection/${c.slug}` },
    openGraph: {
      title: c.title,
      description: c.description,
      url: `/shop/collection/${c.slug}`,
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) notFound();

  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  const matched = products.filter(c.match);

  // FAQPage answers the queries the page targets; BreadcrumbList gives the
  // Home › Shop › [Collection] trail. Same pattern as the journal + product pages.
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: c.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${BASE_URL}/shop` },
          {
            "@type": "ListItem",
            position: 3,
            name: c.heading,
            item: `${BASE_URL}/shop/collection/${c.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <JsonLd data={schema} />
      <CollectionTracker slug={c.slug} itemCount={matched.length} />

      <Suspense
        fallback={
          <ShopGridFallback
            products={matched}
            section={c.section}
            heading={c.heading}
          />
        }
      >
        <ShopClient
          products={matched}
          taxonomy={taxonomy}
          section={c.section}
          heading={c.heading}
        />
      </Suspense>

      {/* Server-rendered SEO content. Sits below the grid (products first for
          shoppers, the rankable copy + FAQ below) and carries the page's unique
          text since ShopClient renders client-side. */}
      <section style={{ background: "var(--bg)", padding: "72px 0 104px" }}>
        <div className="shell" style={{ padding: "0 21px", maxWidth: 680 }}>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-2)", margin: "0 0 72px", maxWidth: "60ch" }}>
            {c.intro}
          </p>

          <h2
            className="eyebrow"
            style={{ color: "var(--ink)", marginBottom: 18, fontSize: 12, textTransform: "uppercase" }}
          >
            FAQ
          </h2>
          <div className="faq-list">
            {c.faqs.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>
                  <h3 style={{ font: "inherit", margin: 0 }}>{f.q}</h3>
                  <svg
                    className="faq-chevron"
                    width="13"
                    height="8"
                    viewBox="0 0 13 8"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M1 1l5.5 5.5L12 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="faq-a">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
