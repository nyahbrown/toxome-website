import Link from "next/link";
import type { Article } from "@/lib/journal";
import type { Product } from "@/types/product";
import { getProductsByIds } from "@/lib/supabase";
import { QuickShopProvider } from "@/components/QuickShopProvider";
import QuickShopCard from "@/components/QuickShopCard";

// Goop-style shoppable editorial layout, used ONLY when an article ships a
// structured `sections` array (currently just the summer-edit piece). Each
// section = a trend heading, an editorial writeup paired with a lead product
// photo, and a shoppable grid of real products below it. Falls back to nothing
// when there are no sections, so the article page can render the normal body
// instead. All product imagery uses plain <img> (external CDN hosts), matching
// MiniProductCard, since next/image has no remote host allowlist configured.

function money(p: Product): string | null {
  return p.item_price != null ? `$${p.item_price.toLocaleString()}` : null;
}

export default async function TrendEditSections({
  article,
}: {
  article: Article;
}) {
  const sections = article.sections ?? [];
  if (sections.length === 0) return null;

  // One fetch for every product referenced anywhere in the piece (lead images
  // + grids), de-duplicated, then looked up by id per section.
  const allIds = Array.from(
    new Set(sections.flatMap((s) => [s.leadProductId, ...s.productIds]))
  );
  const products = await getProductsByIds(allIds);
  const byId = new Map(products.map((p) => [p.id, p]));

  return (
    <QuickShopProvider>
      <div className="shell" style={{ paddingTop: 40, paddingBottom: 8 }}>
      <div className="j-article">
        {/* Full-width lead image + caption */}
        {article.leadImageUrl && (
          <figure className="trend-lead">
            {article.leadImageHref ? (
              <Link href={article.leadImageHref} className="trend-lead__link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.leadImageUrl}
                  alt={article.leadImageAlt || article.title}
                  className="trend-lead__img"
                />
              </Link>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.leadImageUrl}
                alt={article.leadImageAlt || article.title}
                className="trend-lead__img"
              />
            )}
            {article.leadCaption && (
              <figcaption className="trend-cap">{article.leadCaption}</figcaption>
            )}
          </figure>
        )}

        {/* Curation intro */}
        {article.introHtml && (
          <div
            className="trend-intro"
            dangerouslySetInnerHTML={{ __html: article.introHtml }}
          />
        )}

        {/* Repeating trend blocks */}
        {sections.map((s, i) => {
          const lead = byId.get(s.leadProductId);
          const grid = s.productIds
            .map((id) => byId.get(id))
            .filter((p): p is Product => !!p);
          return (
            <section key={i} className="trend-section">
              <h2 className="trend-section__head">{s.heading}</h2>

              <div className="trend-section__top">
                <div
                  className="trend-writeup"
                  dangerouslySetInnerHTML={{ __html: s.writeupHtml }}
                />
                {lead && (
                  <figure className="trend-lead-figure">
                    <Link href={`/shop/${lead.id}`}>
                      {lead.item_image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={lead.item_image}
                          alt={s.leadImageAlt || lead.item_name}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </Link>
                    <figcaption className="trend-cap">
                      {lead.brand}, {lead.item_name}
                      {money(lead) ? ` · ${money(lead)}` : ""}
                    </figcaption>
                  </figure>
                )}
              </div>

              {grid.length > 0 && (
                <div className="trend-grid">
                  {grid.map((p) => (
                    <QuickShopCard key={p.id} p={p} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* The Toxome Take */}
        {article.takeHtml && (
          <div className="trend-take">
            <div className="eyebrow trend-take__eyebrow">The Toxome Take</div>
            <div dangerouslySetInnerHTML={{ __html: article.takeHtml }} />
          </div>
        )}

        {/* Close + shop CTA */}
        {article.closeHtml && (
          <div
            className="trend-close"
            dangerouslySetInnerHTML={{ __html: article.closeHtml }}
          />
        )}
      </div>
      </div>
    </QuickShopProvider>
  );
}
