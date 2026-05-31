import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

// Published Journal articles live as markdown here. To publish a new piece,
// drop a finalized `<slug>.md` (with frontmatter) into this folder — the
// listing, the /journal/[slug] page, and its OG/pin image all pick it up.
const JOURNAL_DIR = path.join(process.cwd(), "content/journal");

export type Source = { label: string; href: string };

export type ArticleMeta = {
  slug: string;
  title: string;
  dek: string;
  date: string; // ISO (YYYY-MM-DD)
  pillar: string;
  mode?: string;
  pinned: boolean; // featured as the standing Journal cover
  hero: string; // card/listing image (path under /public)
  keywords: string[]; // SEO keywords
  cta: string; // end-of-article CTA variant: app | shop | guide
  readingTime: string;
  sources: Source[];
};

export type Article = ArticleMeta & { html: string };

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

  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));

  // marked is synchronous when no async extensions are registered.
  const html = marked.parse(content, { async: false }) as string;

  return {
    slug,
    title: String(data.title ?? ""),
    dek: String(data.dek ?? ""),
    date: String(data.date ?? ""),
    pillar: String(data.pillar ?? "Journal"),
    mode: data.mode ? String(data.mode) : undefined,
    pinned: data.pinned === true,
    hero: String(data.hero ?? "/fibers/linen.jpg"),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    cta: String(data.cta ?? "app"),
    readingTime: `${minutes} min read`,
    sources: normalizeSources(data.sources),
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

export function getAllArticles(): Article[] {
  return getAllSlugs()
    .map(readArticle)
    .filter((a): a is Article => a !== null)
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
