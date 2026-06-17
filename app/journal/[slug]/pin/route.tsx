import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { getArticle, getAllSlugs } from "@/lib/journal";

// Tall (2:3) Pinterest pin card: the article's hero photo with the title set
// over it, the way the Instagram posts look. ShareBar passes this URL as the
// Pinterest pin `media`, and the article's hero carries it as `data-pin-media`,
// so saving the page to Pinterest pins this card instead of the raw photo.
export const contentType = "image/png";
export const dynamic = "force-static";

const WIDTH = 1000;
const HEIGHT = 1500;
const CREAM = "#FCFBF7";
const INK = "59,60,58"; // --ink as rgb, used for the legibility scrim (no pure black)

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// Read a /public image off disk and inline it as a data URI so the card renders
// at build time without a network fetch.
function publicImageDataUri(publicPath: string): string | null {
  try {
    const rel = publicPath.replace(/^\//, "");
    const buf = fs.readFileSync(path.join(process.cwd(), "public", rel));
    const ext = path.extname(rel).slice(1).toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = getArticle(slug);
  const title = article?.title ?? "Toxome Journal";
  const eyebrow = article ? `Toxome · ${article.pillar}` : "Toxome Journal";
  const heroUri = article?.hero ? publicImageDataUri(article.hero) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: CREAM,
        }}
      >
        {heroUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUri}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}

        {/* Legibility scrim: transparent at top, deep warm-ink at the bottom
            where the text block sits. Explicit dimensions (Satori ignores `inset`). */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            backgroundImage: `linear-gradient(to bottom, rgba(${INK},0) 45%, rgba(${INK},0.65) 72%, rgba(${INK},0.95) 100%)`,
          }}
        />

        {/* Text block anchored to the bottom over the dark scrim, IG-style. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 72,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 25,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: CREAM,
              fontWeight: 600,
              marginBottom: 22,
              opacity: 0.92,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 52 ? 66 : 78,
              lineHeight: 1.05,
              color: CREAM,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              maxWidth: 856,
            }}
          >
            {title}
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}
