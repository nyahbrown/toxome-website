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

// The collections split three ways for the reader: what it's made of, what it's
// certified to, what you'd actually wear. Anything not listed falls through to
// "by category", so a new collection is never dropped from the hub.
const CERTIFICATION_SLUGS = new Set([
  "gots-certified-clothing",
  "oeko-tex-certified-clothing",
]);

const FIBER_SLUGS = new Set([
  "non-toxic-organic-cotton-clothing",
  "non-toxic-linen-clothing",
  "non-toxic-silk-clothing",
  "non-toxic-hemp-clothing",
  "non-toxic-wool-clothing",
  "non-toxic-merino-wool",
  "non-toxic-cashmere",
  "non-toxic-tencel-lyocell-clothing",
  "non-toxic-ramie-clothing",
  "non-toxic-alpaca-clothing",
]);

const GROUPS = [
  {
    eyebrow: "By fiber",
    blurb: "the edit re-cut by what the cloth actually is.",
    has: (slug: string) => FIBER_SLUGS.has(slug),
  },
  {
    eyebrow: "By certification",
    blurb: "pieces whose supply chain has been audited by someone other than the brand.",
    has: (slug: string) => CERTIFICATION_SLUGS.has(slug),
  },
  {
    eyebrow: "By category",
    blurb: "the edit re-cut by what you're shopping for.",
    has: (slug: string) => !FIBER_SLUGS.has(slug) && !CERTIFICATION_SLUGS.has(slug),
  },
];

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

      {/* .shell runs edge-to-edge (it's built for the photo grids). This is a
          reading page, so cap the measure or the cards shred into 9 columns. */}
      <main className="shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "120px 32px 96px" }}>
        <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14, textAlign: "center" }}>
          Shop by collection
        </div>
        <h1
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 500,
            fontSize: "clamp(30px, 4.2vw, 46px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            margin: "0 auto 18px",
            maxWidth: 720,
            textAlign: "center",
          }}
        >
          the toxome edits
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)", maxWidth: "58ch", margin: "0 auto 72px", textAlign: "center" }}>
          every collection is the toxome shop, re-cut by one thing: a fiber, a certification, or a
          category. each piece in them is scored for what it&rsquo;s actually made of.
        </p>

        {GROUPS.map((group) => {
          const items = SHOP_COLLECTIONS.filter((c) => group.has(c.slug));
          if (items.length === 0) return null;

          return (
            <section key={group.eyebrow} style={{ marginBottom: "clamp(56px, 8vw, 88px)" }}>
              <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 8 }}>
                {group.eyebrow}
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.5, color: "var(--ink-2)", margin: "0 0 24px", maxWidth: "52ch" }}>
                {group.blurb}
              </p>

              <div className="coll-grid">
                {items.map((c) => (
                  <Link key={c.slug} href={`/shop/collection/${c.slug}`} className="coll-card">
                    <span className="coll-card-title">
                      {c.heading}
                      <svg
                        className="coll-card-chev"
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4.5 2.5 L8.5 6.5 L4.5 10.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="coll-card-desc">{c.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <Footer />
    </>
  );
}
