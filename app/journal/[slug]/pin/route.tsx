import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { getArticle, getAllSlugs } from "@/lib/journal";

// Tall portrait (4:5, 1080×1350) Pinterest pin that reproduces Toxome's branded
// "teaser" social template — the eye logo + masthead, the article hero photo
// behind warm scrims, a serif (Cormorant) headline, an italic dek, a thin rule
// and a "Read on toxome.app →" CTA. This is the exact design rendered live in
// app/studio/post (post.kind === "teaser"), ported into next/og so Pinterest
// pins this card when a Journal article is saved. ShareBar passes this URL as
// the pin `media`; the hero carries it as `data-pin-media`.
export const contentType = "image/png";
export const dynamic = "force-static";

// Matches the studio teaser frame exactly.
const W = 1080;
const H = 1350;
const PAD = 92;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// Read a /public image off disk and inline it as a data URI so the card renders
// at build time without a network fetch. Satori cannot resolve "/path" URLs.
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

// Bundled OFL fonts (Satori needs TTF/OTF, not woff2). Cormorant carries the
// signature serif headline; Inter carries the eyebrow/kicker/dek/CTA.
function fontData(file: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), "assets", "fonts", file));
}

// First sentence (or a clean ~120-char trim) — article deks run 2 sentences,
// a teaser wants one crisp line. Mirrors teaserDek() in app/studio/post.
function teaserDek(dek: string): string {
  const firstSentence = dek.match(/^.*?[.!?](?=\s|$)/);
  const s = firstSentence ? firstSentence[0] : dek;
  if (s.length <= 130) return s.trim();
  return dek.slice(0, 120).trim().replace(/[\s,;:]+\S*$/, "") + "…";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = getArticle(slug);

  const kicker = article?.pillar || "The Journal";
  const headline = article?.title ?? "Toxome Journal";
  const dek = article ? teaserDek(article.dek) : "";
  const cta = "Read on toxome.app";

  const heroUri = article?.hero ? publicImageDataUri(article.hero) : null;
  const logoUri = publicImageDataUri("/toxome-logo.png");
  const logoSize = 58;

  // Headline size mirrors the studio teaser's responsive steps.
  const hSize = headline.length > 52 ? 64 : headline.length > 38 ? 74 : 86;

  const cormorantMedium = fontData("Cormorant-Medium.ttf");
  const interRegular = fontData("Inter-Regular.ttf");
  const interSemiBold = fontData("Inter-SemiBold.ttf");

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          display: "flex",
          background: "#1d1b17",
        }}
      >
        {/* article hero photo, full-bleed */}
        {heroUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUri}
            alt=""
            style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
          />
        ) : null}

        {/* gentle overall depth */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: "flex",
            backgroundImage:
              "linear-gradient(180deg, rgba(20,19,15,0.46) 0%, rgba(20,19,15,0.06) 26%, rgba(20,19,15,0.14) 52%, rgba(20,19,15,0.40) 100%)",
          }}
        />
        {/* strong bottom scrim, guarantees white text reads over any hero */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            width: W,
            height: Math.round(H * 0.62),
            display: "flex",
            backgroundImage:
              "linear-gradient(180deg, rgba(20,19,15,0) 0%, rgba(20,19,15,0.55) 52%, rgba(20,19,15,0.92) 100%)",
          }}
        />

        {/* masthead row */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: PAD,
            width: W - PAD * 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {logoUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUri}
              alt="Toxome"
              width={logoSize}
              height={Math.round(logoSize / 1.532)}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div style={{ width: logoSize, height: Math.round(logoSize / 1.532) }} />
          )}
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.82)",
            }}
          >
            Toxome
          </span>
        </div>

        {/* headline block, lower third */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            bottom: 128,
            width: W - PAD * 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: "Inter",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              marginTop: 26,
              fontFamily: "Cormorant",
              color: "#fff",
              fontSize: hSize,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              maxWidth: 900,
              textShadow: "0 2px 22px rgba(0,0,0,0.45)",
            }}
          >
            {headline}
          </div>
          {dek ? (
            <div
              style={{
                marginTop: 26,
                fontFamily: "Inter",
                color: "rgba(255,255,255,0.92)",
                fontSize: 28,
                fontWeight: 400,
                fontStyle: "italic",
                lineHeight: 1.4,
                letterSpacing: "-0.005em",
                maxWidth: 720,
                textShadow: "0 1px 14px rgba(0,0,0,0.4)",
              }}
            >
              {dek}
            </div>
          ) : null}
          {/* thin white rule */}
          <div style={{ marginTop: 38, height: 1, width: 92, background: "rgba(255,255,255,0.6)" }} />
          {/* CTA row */}
          <div style={{ marginTop: 22, display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "Inter",
                color: "#fff",
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: "0.01em",
                marginRight: 16,
              }}
            >
              {cta}
            </span>
            <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
              <path d="M0 7h36" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M31 2l6 5-6 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Cormorant", data: cormorantMedium, weight: 500, style: "normal" },
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
        // Inter ships no italic master; register the roman face for the italic
        // dek so Satori has a glyph source (text reads even without true slant).
        { name: "Inter", data: interRegular, weight: 400, style: "italic" },
      ],
    }
  );
}
