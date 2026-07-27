/**
 * Renders one indexable department + category page (/shop/women/tops, …).
 *
 * Shared by the four thin route files under app/shop/{women,men,kids,home}/
 * [category]/page.tsx, which exist as separate directories because
 * app/shop/[id] already owns the single dynamic segment at this level, so a
 * generic app/shop/[section]/[category] would collide with it.
 *
 * Mirrors app/shop/collection/[slug]/page.tsx: products filtered server-side,
 * grid rendered by ShopClient with a `heading` override, unique copy + FAQ
 * schema below the grid because ShopClient itself is a client component and
 * contributes no server-rendered text.
 */
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ShopClient from "./ShopClient";
import ShopGridFallback from "./ShopGridFallback";
import { getPublishedProducts, getShopTaxonomy } from "@/lib/supabase";
import {
  getCategoryPage,
  matchCategoryPage,
  categorySlugsForSection,
} from "@/lib/shopCategoryPages";

const BASE_URL = "https://toxome.app";

const SECTION_LABEL: Record<string, string> = {
  women: "Women",
  men: "Men",
  kids: "Kids",
  home: "Home",
};

export default async function CategoryPageView({
  section,
  slug,
}: {
  section: "women" | "men" | "kids" | "home";
  slug: string;
}) {
  const page = getCategoryPage(section, slug);
  if (!page) notFound();

  const [products, taxonomy] = await Promise.all([
    getPublishedProducts(),
    getShopTaxonomy(),
  ]);
  const matched = products.filter(matchCategoryPage(page));

  // Sibling categories in the same department. Rendered as real links so these
  // pages reach each other without the crawler having to execute the client-side
  // filter UI — an orphan page does not rank no matter how good its copy is.
  const siblings = categorySlugsForSection(section).filter(
    (p) => p.slug !== page.slug,
  );

  const url = `${BASE_URL}/shop/${section}/${page.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((f) => ({
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
            name: SECTION_LABEL[section],
            item: `${BASE_URL}/shop/${section}`,
          },
          { "@type": "ListItem", position: 4, name: page.heading, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <JsonLd data={schema} />

      <Suspense
        fallback={
          <ShopGridFallback
            products={matched}
            section={section}
            heading={page.heading}
          />
        }
      >
        <ShopClient
          products={matched}
          taxonomy={taxonomy}
          section={section}
          heading={page.heading}
          // The category lives in the route here, so hand it over explicitly:
          // it is what makes the Bras/Underwear sub-filter appear on
          // /shop/women/intimates and what keys the sub-heading lookup.
          lockedCategory={page.category}
          // No isDepartmentRoot: this page's H1 is fixed unless a sub-filter
          // narrows it. Passing the slug map so switching category from here
          // lands on the sibling's real page rather than bouncing out to
          // /shop/{section}?category=.
          categoryPages={categorySlugsForSection(section).map((p) => ({
            category: p.category,
            slug: p.slug,
            subHeadings: p.subcategoryHeadings,
          }))}
        />
      </Suspense>

      {/* Server-rendered SEO content: products first for shoppers, the rankable
          copy and FAQ below. */}
      <section style={{ background: "var(--bg)", padding: "72px 0 104px" }}>
        <div className="shell" style={{ padding: "0 21px", maxWidth: 680 }}>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: "var(--ink-2)",
              margin: "0 0 40px",
              maxWidth: "60ch",
            }}
          >
            {page.intro}
          </p>

          {siblings.length > 0 && (
            <nav
              aria-label={`More ${SECTION_LABEL[section].toLowerCase()} categories`}
              style={{ margin: "0 0 72px" }}
            >
              <h2
                className="eyebrow"
                style={{
                  color: "var(--ink)",
                  marginBottom: 14,
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                more in {SECTION_LABEL[section].toLowerCase()}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px" }}>
                {siblings.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/shop/${section}/${s.slug}`}
                    style={{
                      fontSize: 15,
                      color: "var(--ink-2)",
                      textDecoration: "none",
                      borderBottom: "1px solid var(--hairline-strong)",
                      paddingBottom: 2,
                    }}
                  >
                    {s.heading}
                  </Link>
                ))}
              </div>
            </nav>
          )}

          <h2
            className="eyebrow"
            style={{
              color: "var(--ink)",
              marginBottom: 18,
              fontSize: 12,
              textTransform: "uppercase",
            }}
          >
            FAQ
          </h2>
          <div className="faq-list">
            {page.faqs.map((f) => (
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
                    <path
                      d="M1 1l5.5 5.5L12 1"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
