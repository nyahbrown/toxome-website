/**
 * Server-rendered copy below the product detail UI.
 *
 * ProductDetailClient is a client component, so everything it renders is
 * invisible to a crawler that does not execute JS. This section is the product
 * page's actual readable text, plus the internal links that connect a product
 * to its fiber guide, its category page and its brand page. Same shape as the
 * block under the collection and category grids.
 */
import Link from "next/link";
import type { Product } from "@/types/product";
import {
  compositionParagraph,
  fiberLines,
  productCategoryPage,
  productBrandHref,
  productFaqs,
} from "@/lib/productCopy";

const linkStyle = {
  fontSize: 15,
  color: "var(--ink-2)",
  textDecoration: "none",
  borderBottom: "1px solid var(--hairline-strong)",
  paddingBottom: 2,
} as const;

const eyebrow = {
  color: "var(--ink)",
  marginBottom: 14,
  fontSize: 12,
  textTransform: "uppercase",
} as const;

export default function ProductSeoSection({ product }: { product: Product }) {
  const composition = compositionParagraph(product);
  const faqs = productFaqs(product);
  const fibers = fiberLines(product).filter((f) => f.href);
  const category = productCategoryPage(product);
  const brandHref = productBrandHref(product);

  // A product with no composition and no description has nothing honest to say
  // here, and an empty heading is worse than no section.
  if (!composition && !product.description) return null;

  return (
    <section style={{ background: "var(--bg)", padding: "72px 0 104px" }}>
      <div className="shell" style={{ padding: "0 21px", maxWidth: 680 }}>
        <h2 className="eyebrow" style={eyebrow}>
          what it is made of
        </h2>
        {composition && (
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: "var(--ink-2)",
              margin: "0 0 24px",
              maxWidth: "60ch",
            }}
          >
            {composition}
          </p>
        )}
        {product.description && (
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: "var(--ink-2)",
              margin: "0 0 40px",
              maxWidth: "60ch",
            }}
          >
            {product.description}
          </p>
        )}

        {(fibers.length > 0 || category || brandHref) && (
          <nav aria-label="Related pages" style={{ margin: "0 0 64px" }}>
            <h2 className="eyebrow" style={eyebrow}>
              read more
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px" }}>
              {fibers.map((f) => (
                <Link key={f.href} href={f.href!} style={linkStyle}>
                  is {f.label} safe to wear?
                </Link>
              ))}
              {category && (
                <Link href={category.href} style={linkStyle}>
                  more {category.heading}
                </Link>
              )}
              {brandHref && (
                <Link href={brandHref} style={linkStyle}>
                  is {product.brand} non-toxic?
                </Link>
              )}
            </div>
          </nav>
        )}

        <h2 className="eyebrow" style={eyebrow}>
          FAQ
        </h2>
        <div className="faq-list">
          {faqs.map((f) => (
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
  );
}
