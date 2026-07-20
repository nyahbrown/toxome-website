import { getAllArticles } from "@/lib/journal";

// A small JSON feed of recent journal articles for the Toxome mobile app's
// Shop-feed "Journal" rail. The app fetches this, renders cards, and opens each
// article in its in-app web view at the returned `url`. Articles are Markdown
// files read from disk at build time, so this is generated statically and
// refreshed on every deploy (the same cadence new articles ship at).
export const runtime = "nodejs";
export const dynamic = "force-static";

const SITE = "https://toxome.app";

function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE}${path}`;
}

export function GET() {
  const articles = getAllArticles()
    .slice(0, 20)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      dek: a.dek,
      date: a.date,
      pillar: a.pillar, // kicker: Journal / Health / Environment / Fashion
      hero: absolute(a.hero),
      url: `${SITE}/journal/${a.slug}`,
    }));
  return Response.json({ articles });
}
