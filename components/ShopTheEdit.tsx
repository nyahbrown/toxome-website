import type { Article } from "@/lib/journal";
import type { Product } from "@/types/product";
import { getProductsByIds, getPublishedProducts } from "@/lib/supabase";
import MiniProductCard from "@/components/MiniProductCard";

// WOMEN'S-ONLY audience rule: the Journal reader base is ~89% female, so the
// end-of-article rail only ever recommends women's (or unisex) pieces. Men's,
// kids, and home are excluded at every selection path.
const WOMENS_GENDERS = new Set(["women", "female", "unisex"]);

// Filler dropped when deriving topic terms from an article's keywords/pillar —
// generic English plus Toxome boilerplate that would match everything.
const STOP_TERMS = new Set([
  "is", "are", "the", "a", "an", "your", "for", "in", "of", "what", "why",
  "how", "and", "or", "to", "vs", "versus", "really", "explained", "toxic",
  "non", "nontoxic", "bad", "you", "that", "this", "with", "without", "best",
  "guide", "science", "about", "really", "free", "into",
]);

// Derive matchable topic terms from the article's keywords + pillar.
function topicTerms(article: Article): string[] {
  const raw = [...article.keywords, article.pillar].join(" ").toLowerCase();
  const seen = new Set<string>();
  for (const tok of raw.split(/[^a-z0-9]+/)) {
    if (tok.length < 3 || STOP_TERMS.has(tok)) continue;
    seen.add(tok);
  }
  return [...seen];
}

// How many topic terms a product's text surface matches. Prefix-tolerant on
// both sides so "leggings" matches a "Legging" category and vice versa.
function matchCount(p: Product, terms: string[]): number {
  const hayWords = [
    p.category,
    p.item_name,
    ...(p.tags ?? []),
    ...Object.keys(p.fabric_composition ?? {}),
    ...(p.fibers_present ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
  const hay = new Set(hayWords);
  return terms.filter(
    (t) => hay.has(t) || hayWords.some((w) => w.includes(t) || t.includes(w))
  ).length;
}

// Select up to 5 women's/unisex products for the article's "Shop the edit".
//  1. Frontmatter `products:` override → those IDs, in order (curated already).
//  2. Else auto-match by topic among published women's/unisex items that have
//     an image + score, ranked by match strength then score.
//  3. Fallback (< 2 topic matches): highest-scored women's/unisex, never
//     men's/kids/home.
async function selectEditProducts(article: Article): Promise<Product[]> {
  if (article.products && article.products.length > 0) {
    const picked = await getProductsByIds(article.products);
    return picked.slice(0, 5);
  }

  const pool = (await getPublishedProducts()).filter(
    (p) =>
      !!p.item_image &&
      p.toxome_score != null &&
      WOMENS_GENDERS.has((p.gender ?? "").toLowerCase())
  );

  const terms = topicTerms(article);
  const topic = pool
    .map((p) => ({ p, m: matchCount(p, terms) }))
    .filter((s) => s.m > 0)
    .sort(
      (a, b) => b.m - a.m || (b.p.toxome_score ?? 0) - (a.p.toxome_score ?? 0)
    )
    .map((s) => s.p);

  if (topic.length >= 2) return topic.slice(0, 5);

  // Fill from highest-scored women's/unisex, keeping any single topic match.
  const result = [...topic];
  const byScore = [...pool].sort(
    (a, b) => (b.toxome_score ?? 0) - (a.toxome_score ?? 0)
  );
  for (const p of byScore) {
    if (result.length >= 5) break;
    if (!result.some((r) => r.id === p.id)) result.push(p);
  }
  return result.slice(0, 5);
}

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
