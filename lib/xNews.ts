// Server-only: pull recent news on synthetic-fiber / toxic-clothing topics from
// Google News RSS (no API key needed) to feed the daily X engine. Returns deduped
// recent headlines for the tweet writer to react to.
// NEVER import this into a client component.

export type NewsItem = {
  title: string;
  url: string; // google news redirect link (resolves to the article on click)
  source: string; // publication name
  publishedAt: string; // ISO, "" if missing
};

// Each query becomes a Google News RSS search, tuned to Toxome's beat.
const QUERIES = [
  '"synthetic fibers" health',
  '"toxic clothing" OR "toxins in clothing"',
  "microplastics clothing OR textiles",
  "PFAS textiles OR clothing OR activewear",
  "polyester health OR hormones OR fertility",
  "endocrine disruptors clothing OR fashion",
];

const RSS = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function parseItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  for (const block of xml.split("<item>").slice(1)) {
    const seg = block.split("</item>")[0];
    const pick = (tag: string) => {
      const m = seg.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
      return m ? decodeEntities(m[1].trim()) : "";
    };
    const rawTitle = pick("title");
    const link = pick("link");
    if (!rawTitle || !link) continue;
    // Google News titles are "Headline - Source"; lift the trailing source out.
    const source = pick("source") || (rawTitle.includes(" - ") ? rawTitle.split(" - ").pop()!.trim() : "");
    const title = source && rawTitle.endsWith(` - ${source}`) ? rawTitle.slice(0, -(source.length + 3)).trim() : rawTitle;
    const pub = pick("pubDate");
    const parsed = pub ? Date.parse(pub) : NaN;
    items.push({ title, url: link, source, publishedAt: Number.isNaN(parsed) ? "" : new Date(parsed).toISOString() });
  }
  return items;
}

// Fetch all queries, dedupe by normalized title (keep newest), filter to a recency
// window, and return the freshest `limit` stories.
export async function fetchClothingToxinNews(opts?: { maxAgeHours?: number; limit?: number }): Promise<NewsItem[]> {
  const maxAgeHours = opts?.maxAgeHours ?? 72;
  const limit = opts?.limit ?? 12;
  const cutoff = Date.now() - maxAgeHours * 3600_000;

  const all: NewsItem[] = [];
  await Promise.all(
    QUERIES.map(async (q) => {
      try {
        const res = await fetch(RSS(q), { headers: { "User-Agent": "Mozilla/5.0" } });
        if (res.ok) all.push(...parseItems(await res.text()));
      } catch {
        // one query failing should not kill the batch
      }
    })
  );

  const seen = new Map<string, NewsItem>();
  for (const it of all) {
    const key = it.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);
    if (!key) continue;
    const when = it.publishedAt ? Date.parse(it.publishedAt) : 0;
    if (when && when < cutoff) continue;
    const prev = seen.get(key);
    if (!prev || (it.publishedAt && it.publishedAt > prev.publishedAt)) seen.set(key, it);
  }

  return [...seen.values()]
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, limit);
}
