import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

// Published Journal articles live as markdown here. To publish a new piece,
// drop a finalized `<slug>.md` (with frontmatter) into this folder, the
// listing, the /journal/[slug] page, and its OG/pin image all pick it up.
const JOURNAL_DIR = path.join(process.cwd(), "content/journal");

export type Source = { label: string; href: string };

// Optional FAQ block. When an article ships `faq` in its frontmatter, the
// /journal/[slug] page renders the shared FaqAccordion (the same drop-down UI
// as /verify, the fiber guides, and /extension) and emits FAQPage JSON-LD, so
// the answers are eligible for the "People also ask" snippet.
export type FaqItem = { q: string; a: string };

// Structured "trend edit" section for the Goop-style shoppable layout. Optional
// and article-specific: only the summer-edit piece uses it. When `sections` is
// present on an article, the /journal/[slug] page renders TrendEditSections
// instead of the normal .j-prose body + ShopTheEdit rail. Every other article
// (no `sections`) renders exactly as before.
export type TrendSection = {
  heading: string;
  writeupHtml: string; // rendered from the frontmatter `writeup` markdown
  leadProductId: string; // the section's lead image = this product's photo
  leadImageAlt?: string;
  productIds: string[]; // shoppable grid below the writeup
};

export type ArticleMeta = {
  slug: string;
  title: string;
  dek: string;
  date: string; // ISO (YYYY-MM-DD)
  pillar: string;
  mode?: string;
  pinned: boolean; // featured as the standing Journal cover
  /**
   * Search-only article. The page still routes and still ships in the sitemap,
   * so Google indexes it, but it is kept off every surface that *displays* a
   * list: the Journal index, the homepage rail, the app's journal feed, and the
   * Pinterest auto-pin cron. Use for comparison/SEO pieces that should earn
   * organic traffic without appearing in the editorial Journal.
   * Unlisted is NOT orphaned: these pages are still linked contextually from
   * the fiber guides they belong to, because pages with no inbound links rank
   * badly no matter what the sitemap says.
   */
  unlisted: boolean;
  hero: string; // card/listing image (path under /public); also the video poster
  heroVideo?: string; // optional looping hero video (path under /public); poster = hero
  heroAlt?: string; // alt text for the hero/lead image
  keywords: string[]; // SEO keywords
  cta: string; // end-of-article CTA variant: app | shop | guide
  // Optional curated override for the end-of-article "Shop the edit" rail:
  // an ordered list of /shop product IDs. When absent, products auto-match
  // the article topic. See components/ShopTheEdit.tsx.
  products?: string[];
  readingTime: string;
  sources: Source[];
  faq: FaqItem[]; // optional drop-down FAQ; empty when the article has none
  // Header treatment. Default (undefined) = the centered title + full-width
  // hero. "split" = the roundup header: tall portrait image on the left, title
  // + byline + updated date on the right. The hero figure is skipped in split
  // mode because the header already carries the image.
  headerLayout?: string;
  author?: string; // byline name; falls back to "Our Editors"
  authorRole?: string; // e.g. "Founder, Toxome" — the E-E-A-T line
  updated?: string; // ISO date shown as "UPDATED <date>"; falls back to `date`
  // ── Optional Goop-style "trend edit" layout (summer-edit only) ──────────
  // Full-width lead image (product photography) + caption above the intro.
  leadImageUrl?: string;
  leadImageAlt?: string;
  leadImageHref?: string; // links the lead image to a product detail page
  leadCaption?: string;
  introHtml?: string; // curation intro paragraph(s), rendered from markdown
  sections?: TrendSection[]; // repeating trend blocks (writeup + shoppable grid)
  takeHtml?: string; // "The Toxome Take" callout, rendered from markdown
  closeHtml?: string; // closing paragraph with the shop-the-edit CTA link
};

export type Article = ArticleMeta & { html: string };

function normalizeFaq(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const { q, a } = item as Record<string, unknown>;
      if (!q || !a) return null;
      return { q: String(q), a: String(a) };
    })
    .filter((x): x is FaqItem => x !== null);
}

function normalizeSources(raw: unknown): Source[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) =>
      s && typeof s === "object" && "label" in s && "href" in s
        ? { label: String((s as Source).label), href: String((s as Source).href) }
        : null
    )
    .filter((s): s is Source => s !== null);
}

function readArticle(slug: string): Article | null {
  const filePath = path.join(JOURNAL_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  // marked is synchronous when no async extensions are registered.
  const html = marked.parse(content, { async: false }) as string;
  const md = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim()
      ? (marked.parse(v.trim(), { async: false }) as string)
      : undefined;

  // Optional structured trend sections (summer-edit). Absent on every other
  // article, so those fall through to the normal .j-prose render untouched.
  const sections: TrendSection[] | undefined = Array.isArray(data.sections)
    ? data.sections
        .map((s): TrendSection | null => {
          if (!s || typeof s !== "object") return null;
          const sec = s as Record<string, unknown>;
          const heading = String(sec.heading ?? "");
          const leadProductId = String(sec.leadProductId ?? "");
          if (!heading || !leadProductId) return null;
          return {
            heading,
            writeupHtml: md(sec.writeup) ?? "",
            leadProductId,
            leadImageAlt: sec.leadImageAlt ? String(sec.leadImageAlt) : undefined,
            productIds: Array.isArray(sec.productIds)
              ? sec.productIds.map(String).filter(Boolean)
              : [],
          };
        })
        .filter((s): s is TrendSection => s !== null)
    : undefined;

  const introHtml = md(data.intro);
  const takeHtml = md(data.take);
  const closeHtml = md(data.close);

  // Reading time counts the structured copy too, not just the markdown body,
  // so the trend-edit article reports a realistic length.
  const wordSource = [
    content,
    typeof data.intro === "string" ? data.intro : "",
    typeof data.take === "string" ? data.take : "",
    typeof data.close === "string" ? data.close : "",
    ...(Array.isArray(data.sections)
      ? data.sections.map((s) =>
          s && typeof s === "object"
            ? `${(s as Record<string, unknown>).heading ?? ""} ${(s as Record<string, unknown>).writeup ?? ""}`
            : ""
        )
      : []),
  ].join(" ");
  const words = wordSource.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));

  return {
    slug,
    title: String(data.title ?? ""),
    dek: String(data.dek ?? ""),
    date: String(data.date ?? ""),
    pillar: String(data.pillar ?? "Journal"),
    mode: data.mode ? String(data.mode) : undefined,
    pinned: data.pinned === true,
    unlisted: data.unlisted === true,
    hero: String(data.hero ?? "/fibers/linen.jpg"),
    heroVideo: data.heroVideo ? String(data.heroVideo) : undefined,
    heroAlt: data.heroAlt ? String(data.heroAlt) : undefined,
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    cta: String(data.cta ?? "app"),
    products: Array.isArray(data.products)
      ? data.products.map(String).filter(Boolean)
      : undefined,
    readingTime: `${minutes} min read`,
    sources: normalizeSources(data.sources),
    faq: normalizeFaq(data.faq),
    headerLayout: data.headerLayout ? String(data.headerLayout) : undefined,
    author: data.author ? String(data.author) : undefined,
    authorRole: data.authorRole ? String(data.authorRole) : undefined,
    updated: data.updated ? String(data.updated) : undefined,
    leadImageUrl: data.leadImageUrl ? String(data.leadImageUrl) : undefined,
    leadImageAlt: data.leadImageAlt ? String(data.leadImageAlt) : undefined,
    leadImageHref: data.leadImageHref ? String(data.leadImageHref) : undefined,
    leadCaption: data.leadCaption ? String(data.leadCaption) : undefined,
    introHtml,
    sections,
    takeHtml,
    closeHtml,
    html,
  };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(JOURNAL_DIR)) return [];
  return fs
    .readdirSync(JOURNAL_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getArticle(slug: string): Article | null {
  return readArticle(slug);
}

/**
 * Every article that should appear in a *list*. Unlisted (search-only) pieces
 * are excluded here, which is what keeps them out of the Journal index, the
 * homepage rail, /api/journal, and the Pinterest cron in one place rather than
 * four. Routing and the sitemap use getAllSlugs, so unlisted pages still exist
 * and still get indexed. Pass { includeUnlisted: true } only for tooling that
 * genuinely needs the full set.
 */
export function getAllArticles(
  opts: { includeUnlisted?: boolean } = {}
): Article[] {
  return getAllSlugs()
    .map(readArticle)
    .filter((a): a is Article => a !== null)
    .filter((a) => opts.includeUnlisted || !a.unlisted)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  // Parse as UTC noon to avoid timezone drift shifting the day.
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
