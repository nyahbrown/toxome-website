import fs from "fs";
import path from "path";
import type { ReactElement } from "react";
import { findCertification } from "@/lib/certifications";
import { availableLogos } from "@/lib/certLogos";
import { markFor, remoteCandidates } from "@/lib/certMarks";
import { slideScore, type Slide } from "@/lib/social-slides";

// Shared chrome for the social slide renderers (TikTok 9:16, Instagram 4:5 and
// 1:1): the Toxome lockup, the score ring, and the certification badge. Ported
// from the LOCKED product-pin design in app/shop/[id]/pin.
//
// Satori gotchas baked in here, do not "clean up":
//   • Every chrome element is a FLAT absolutely-positioned node. Satori has no
//     real position:relative containing block, so an absolute child nested in a
//     relative wrapper silently renders nothing.
//   • The ring's dial geometry ships as an <svg> data URI. Inline stroke-dasharray
//     + rotate on a <circle> is flaky in Satori.
//   • Images must be inlined as data URIs (Satori can't resolve "/public" paths),
//     and a remote logo is fetched here first so a dead URL can't fail the render.

export const CREAM = "#FCFBF7";
export const INK = "#3B3C3A";

/** Read a /public image off disk and inline it as a data URI. */
export function publicImageDataUri(publicPath: string): string | null {
  try {
    const rel = publicPath.replace(/^\//, "");
    const buf = fs.readFileSync(path.join(process.cwd(), "public", rel));
    const ext = path.extname(rel).slice(1).toLowerCase();
    // Every non-png, non-webp extension used to fall through to image/jpeg,
    // which mislabelled oeko-tex-standard-100.svg as a JPEG and made Satori
    // throw "Invalid JPEG" — killing the whole slide, not just the badge.
    const MIME: Record<string, string> = {
      png: "image/png",
      webp: "image/webp",
      svg: "image/svg+xml",
      gif: "image/gif",
      avif: "image/avif",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
    };
    const mime = MIME[ext] ?? "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function fontData(file: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), "assets", "fonts", file));
}

/** Inter 400 + 600, the only faces the slides use. */
export function interFonts() {
  return [
    { name: "Inter", data: fontData("Inter-Regular.ttf"), weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: fontData("Inter-SemiBold.ttf"), weight: 600 as const, style: "normal" as const },
  ];
}

async function remoteImageDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/png";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Verdict band, matching the app (>=68 low/green, >=40 moderate/amber, else red). */
function bandColor(score: number): string {
  if (score >= 68) return "#ADC89C";
  if (score >= 40) return "#E6A638";
  return "#C84242";
}

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

/**
 * Lockup (top-left), score ring (top-right) and cert badge (under the ring),
 * sized for a canvas `width` wide. Returns flat nodes to drop straight into the
 * ImageResponse root.
 */
export async function slideChrome(
  slide: Slide,
  { width, pad = 64, ringSize = 160, ringStroke = 18, eye = 52 }: {
    width: number;
    pad?: number;
    ringSize?: number;
    ringStroke?: number;
    eye?: number;
  }
): Promise<ReactElement[]> {
  const nodes: ReactElement[] = [];
  const logoUri = publicImageDataUri("/toxome-logo.png");
  const score = slideScore(slide);

  nodes.push(
    <div key="lockup" style={{ position: "absolute", top: pad + 48, left: pad, display: "flex", alignItems: "center" }}>
      {logoUri ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUri}
          alt="Toxome"
          width={eye}
          height={Math.round(eye / 1.532)}
          style={{ objectFit: "contain", marginRight: 14 }}
        />
      ) : null}
      <span style={{ fontFamily: "Inter", fontSize: 43, fontWeight: 600, letterSpacing: "-0.01em", color: CREAM }}>
        Toxome
      </span>
    </div>
  );

  if (typeof score === "number") {
    nodes.push(
      <div
        key="ring"
        style={{
          position: "absolute",
          top: pad,
          right: pad,
          width: ringSize,
          height: ringSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ringDataUri(score, ringSize, ringStroke)}
          alt=""
          width={ringSize}
          height={ringSize}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: Math.round(ringSize * 0.27),
              fontWeight: 600,
              letterSpacing: "-0.04em",
              color: CREAM,
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "rgba(252,251,247,0.7)",
              marginTop: 5,
            }}
          >
            SCORE
          </span>
        </div>
      </div>
    );
  }

  // Certifications — every one the product holds, as circular logo badges,
  // resolved exactly the way the article's j-pick cards do: a local file in
  // /public/certs first, then the certifying body's logo from the favicon
  // service, then a monogram. Stacked down the right edge under the ring.
  //
  // Satori has no flex `gap` and no position:relative containing block, so the
  // column is laid out by hand: each badge is its own absolutely-positioned
  // node at a computed top.
  const certs = slide.certifications
    .map((c) => findCertification(c))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  if (certs.length) {
    // One cert keeps the original full-size badge, so the apparel slides render
    // exactly as they did. More than one has to shrink to fit the column.
    const badge = certs.length === 1 ? ringSize : certs.length <= 3 ? 128 : 104;
    const gap = Math.round(badge * 0.14);
    const top = typeof score === "number" ? pad + ringSize + 20 : pad;

    const logos = await Promise.all(
      certs.map(async (cert) => {
        const local = availableLogos().get(cert.slug);
        // Satori cannot decode WebP: a .webp local mark (MADE SAFE) throws
        // "u2 is not iterable" and takes the whole render down. Skip it here
        // and let the remote logo answer. The site's own badges still use the
        // local file, which is why /public/certs is left alone.
        const usable = local && !local.toLowerCase().endsWith(".webp") ? local : null;
        const localUri = usable ? publicImageDataUri(usable) : null;
        if (localUri) return localUri;
        for (const url of remoteCandidates(cert.slug, 256)) {
          const remote = await remoteImageDataUri(url);
          if (remote) return remote;
        }
        return null;
      })
    );

    certs.forEach((cert, n) => {
      const logo = logos[n];
      const mark = markFor(cert.slug, cert.abbr, cert.name);
      nodes.push(
        <div
          key={`cert-${cert.slug}`}
          style={{
            position: "absolute",
            top: top + n * (badge + gap),
            // Right-aligned to the same edge as the ring whatever the size.
            left: width - pad - badge,
            width: badge,
            height: badge,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: "#FFFFFF",
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={cert.name}
              width={Math.round(badge * 0.7)}
              height={Math.round(badge * 0.7)}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <span
              style={{
                fontFamily: "Inter",
                // Long monograms (GOLS, USDA) overflow a circle at one fixed
                // size, so the type scales down as the mark gets longer. Same
                // ratios as CertBadge's fontFor.
                fontSize: Math.round(
                  badge * (mark.length <= 1 ? 0.46 : mark.length === 2 ? 0.4 : mark.length === 3 ? 0.3 : 0.235)
                ),
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: INK,
              }}
            >
              {mark}
            </span>
          )}
        </div>
      );
    });
  }

  return nodes;
}

/** Top scrim — keeps the lockup and ring legible on any photo. */
export function topScrim(width: number, height = 300): ReactElement {
  return (
    <div
      key="top-scrim"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        display: "flex",
        backgroundImage: "linear-gradient(180deg, rgba(35,36,34,0.45) 0%, rgba(35,36,34,0) 100%)",
      }}
    />
  );
}

/** Bottom scrim — guarantees white overlay copy reads over any photo. */
export function bottomScrim(width: number, height: number): ReactElement {
  return (
    <div
      key="bottom-scrim"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width,
        height,
        display: "flex",
        backgroundImage: "linear-gradient(180deg, rgba(35,36,34,0) 0%, rgba(35,36,34,0.78) 100%)",
      }}
    />
  );
}
