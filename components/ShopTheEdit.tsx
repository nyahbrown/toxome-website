import type { Article } from "@/lib/journal";
import { selectEditProducts } from "@/lib/journal-products";
import MiniProductCard from "@/components/MiniProductCard";

export default async function ShopTheEdit({ article }: { article: Article }) {
  const products = await selectEditProducts(article);
  if (products.length === 0) return null;

  return (
    <section className="shell" style={{ paddingTop: 8, paddingBottom: 80 }}>
      <div className="j-article" style={{ marginBottom: 30 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Shop the edit
        </div>
        <h2
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 500,
            fontSize: "clamp(24px, 3vw, 34px)",
            lineHeight: 1.15,
            letterSpacing: "-0.018em",
            color: "var(--ink)",
            margin: 0,
            maxWidth: 720,
            textWrap: "balance",
          }}
        >
          non-toxic pieces worth reaching for.
        </h2>
      </div>
      {/* Constrained to the article column: a 5-up rail of small cards that
          aligns to the body/heading instead of spanning the whole page. */}
      <div className="j-article">
        <div className="edit-rail">
          {products.map((p) => (
            <MiniProductCard key={p.id} p={p} showScore />
          ))}
        </div>
      </div>
    </section>
  );
}
