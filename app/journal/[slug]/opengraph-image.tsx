import { ImageResponse } from "next/og";
import { getArticle, getAllSlugs } from "@/lib/journal";

// Per-article social + Pinterest pin card, generated from the markdown.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Toxome Journal";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

const CREAM = "#FCFBF7";
const INK = "#3B3C3A";
const INK_2 = "#57636C";
const HONEY = "#C9A96E";

export default async function ArticleOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  const eyebrow = article ? `Toxome · ${article.pillar}` : "Toxome Journal";
  const title = article?.title ?? "Toxome Journal";
  const line = article?.dek ?? "Know what's in your clothes.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: INK_2,
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 48 ? 70 : 80,
            lineHeight: 1.04,
            color: INK,
            maxWidth: 1000,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 26,
            color: INK_2,
            maxWidth: 1000,
          }}
        >
          <div style={{ width: 40, height: 4, background: HONEY, flexShrink: 0 }} />
          {line.length > 90 ? `${line.slice(0, 88)}…` : line}
        </div>
      </div>
    ),
    { ...size }
  );
}
