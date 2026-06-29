import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { getProductById } from "@/lib/supabase";

// Live Pinterest pin image (1000×1500, 2:3) for a shop product — the LOCKED V2
// "full-bleed cover" design from app/studio/pin (variant "cover"), ported into
// next/og so the products-pinterest cron can auto-publish it without Puppeteer
// (Satori runs on Vercel). Full-bleed product photo, soft top + bottom scrims,
// Toxome eye+wordmark top-left aligned with a score ring top-right, brand
// eyebrow + Cormorant title + "shop on toxome.app →" over the bottom scrim.
// The score ring matches the app (lib/design/score_ring.dart): tan/cream track,
// thick round-cap arc colored by verdict band, center number + "score" label.

export const runtime = "nodejs";
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const W = 1000;
const H = 1500;
const PAD = 64;

// Read a /public image off disk and inline it as a data URI (Satori cannot
// resolve "/path" URLs). Product photos are remote https URLs, which next/og
// fetches directly, so only the bundled logo needs inlining.
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

function fontData(file: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), "assets", "fonts", file));
}

// Verdict-band color, matching the app (>=68 low/green, >=40 moderate/amber,
// else high/red). Catalog is curated-clean so most pins read green.
function bandColor(score: number): string {
  if (score >= 68) return "#ADC89C";
  if (score >= 40) return "#E6A638";
  return "#C84242";
}

// The score ring as a standalone SVG data URI — Satori renders SVG images
// reliably (stroke-dasharray + rotate on inline <circle> is flaky), so the dial
// geometry ships as an <img> and the numerals overlay as Satori text.
function ringDataUri(score: number, size: number, stroke: number): string {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const len = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const c = size / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(252,251,247,0.28)" stroke-width="${stroke}"/>` +
    `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${bandColor(score)}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${len} ${circ}" transform="rotate(-90 ${c} ${c})"/>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductById(id);

  const image = product?.item_image || product?.images?.[0] || null;
  const brand = (product?.brand || "").trim();
  const name = product?.item_name || "Toxome";
  const hasScore = typeof product?.toxome_score === "number";
  const score = (product?.toxome_score as number) ?? 0;

  const logoUri = publicImageDataUri("/toxome-logo.png");
  const eye = 48;
  const ringSize = 148;
  const ringStroke = 17;

  const cormorantMedium = fontData("Cormorant-Medium.ttf");
  const interRegular = fontData("Inter-Regular.ttf");
  const interSemiBold = fontData("Inter-SemiBold.ttf");

  return new ImageResponse(
    (
      <div style={{ position: "relative", width: W, height: H, display: "flex", background: "#EDE9E0" }}>
        {/* Full-bleed product photo. */}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} />
        ) : null}

        {/* Top scrim — keeps the lockup + ring legible on any photo. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: 220,
            display: "flex",
            backgroundImage: "linear-gradient(180deg, rgba(35,36,34,0.42) 0%, rgba(35,36,34,0) 100%)",
          }}
        />
        {/* Bottom scrim — guarantees cream text reads over any photo. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: W,
            height: 620,
            display: "flex",
            backgroundImage: "linear-gradient(180deg, rgba(35,36,34,0) 0%, rgba(35,36,34,0.82) 100%)",
          }}
        />

        {/* Toxome eye + wordmark, top-left. */}
        <div style={{ position: "absolute", top: PAD, left: 48, display: "flex", alignItems: "center" }}>
          {logoUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUri} alt="Toxome" width={eye} height={Math.round(eye / 1.532)} style={{ objectFit: "contain", marginRight: 13 }} />
          ) : null}
          <span style={{ fontFamily: "Inter", fontSize: 40, fontWeight: 600, letterSpacing: "-0.01em", color: "#FCFBF7" }}>Toxome</span>
        </div>

        {/* Score ring, top-right — top edge aligned with the lockup. */}
        {hasScore ? (
          <div style={{ position: "absolute", top: PAD, right: PAD, width: ringSize, height: ringSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ringDataUri(score, ringSize, ringStroke)} alt="" width={ringSize} height={ringSize} style={{ position: "absolute", top: 0, left: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: "Inter", fontSize: Math.round(ringSize * 0.27), fontWeight: 600, letterSpacing: "-0.04em", color: "#FCFBF7", lineHeight: 1 }}>{score}</span>
              <span style={{ fontFamily: "Inter", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "rgba(252,251,247,0.7)", marginTop: 4 }}>SCORE</span>
            </div>
          </div>
        ) : null}

        {/* Brand eyebrow + Cormorant title + CTA, over the bottom scrim. */}
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: PAD, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          {brand ? (
            <div style={{ fontFamily: "Inter", fontSize: 22, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(252,251,247,0.72)" }}>
              {brand}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 16,
              fontFamily: "Cormorant",
              fontSize: 62,
              fontWeight: 500,
              lineHeight: 1.06,
              letterSpacing: "-0.015em",
              color: "#FCFBF7",
              maxWidth: W - PAD * 2,
              display: "flex",
            }}
          >
            {name}
          </div>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "Inter", fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em", color: "rgba(252,251,247,0.92)", marginRight: 16 }}>
              shop on toxome.app
            </span>
            <svg width="38" height="20" viewBox="0 0 38 20" fill="none">
              <path d="M2 10h32" stroke="rgba(252,251,247,0.92)" strokeWidth="2" strokeLinecap="round" />
              <path d="M27 4l7 6-7 6" stroke="rgba(252,251,247,0.92)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
      ],
    }
  );
}
