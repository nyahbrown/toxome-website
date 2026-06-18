import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getShopTaxonomy } from "@/lib/supabase";
import { SHOP_COLLECTIONS } from "@/lib/shopPages";

const SITE = "https://toxome.app";

export const metadata: Metadata = {
  title: "Shop by Collection: Non-Toxic Clothing Edits | Toxome",
  description:
    "Browse Toxome's non-toxic clothing collections by material, certification, and category, from organic cotton, linen, and silk to GOTS and OEKO-TEX certified pieces.",
  alternates: { canonical: "/shop/collections" },
};

// Hub page for the programmatic shop collections. Gives the whole collection
// cluster a single home and internal links from one place (they're otherwise
// only reached via contextual product/guide links).
export default async function CollectionsIndex() {
  const taxonomy = await getShopTaxonomy();

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Toxome Collections",
    url: `${SITE}/shop/collections`,
    hasPart: SHOP_COLLECTIONS.map((c) => ({
      "@type": "WebPage",
      name: c.heading,
      url: `${SITE}/shop/collection/${c.slug}`,
    })),
  };

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <JsonLd data={schema} />

      <main className="shell" style={{ padding: "120px 21px 96px" }}>
        <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
          Shop by collection
        </div>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: "clamp(34px, 5vw, 56px)",
            lineHeight: 1.05,
            color: "var(--ink)",
            margin: "0 0 20px",
            maxWidth: 720,
          }}
        >
          the toxome edits
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)", maxWidth: "60ch", margin: "0 0 56px" }}>
          every collection is the toxome shop, re-cut by one thing: a fiber, a certification, or a
          category. each piece in them is scored for what it&rsquo;s actually made of.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(264px, 1fr))",
            gap: 16,
          }}
        >
          {SHOP_COLLECTIONS.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/collection/${c.slug}`}
              style={{
                display: "block",
                padding: 22,
                background: "var(--white)",
                borderRadius: 14,
                textDecoration: "none",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3 }}>
                {c.heading}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-3)" }}>{c.description}</div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
