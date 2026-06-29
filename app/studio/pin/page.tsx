// Internal render surface for branded Pinterest product pins (1000×1500, 2:3).
// Visit /studio/pin?id=<productId>&v=<1|2|3> to render a single pin for
// screenshot/export. Three variants (genuinely different designs count as
// separate "fresh pins" on Pinterest, which boosts distribution):
//   v=1  band   — dominant product image up top, cream editorial band below
//   v=2  cover  — full-bleed product image, text over a soft bottom scrim
//   v=3  frame  — product image framed on cream, centered editorial layout
// Inter for everything functional; Cormorant on the single headline only.
// Score ring matches the app (lib/design/score_ring.dart): tan track, thick
// round-cap arc colored by verdict band, center number + "score" label.
// Pin CONTENT comes from the `products` table via getProductById; this file owns
// the DESIGN. Mirrors app/studio/carousel/page.tsx conventions.

import { getProductById } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1000;
const H = 1500;

type Variant = "band" | "cover" | "frame";

function variantFrom(v: string | undefined): Variant {
  if (v === "2" || v === "cover") return "cover";
  if (v === "3" || v === "frame") return "frame";
  return "band";
}

export default async function PinStudio({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; v?: string }>;
}) {
  const sp = await searchParams;
  const id = sp.id;
  const variant = variantFrom(sp.v);
  const product = id ? await getProductById(id) : null;

  if (!product) {
    return (
      <div
        style={{
          background: "#E9E7E1",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-sans)",
          color: "#1d1b17",
        }}
      >
        <HideChrome />
        No product found{id ? ` for "${id}"` : ""}.
      </div>
    );
  }

  // Single pin, exact size, centered on a neutral backdrop for clean capture.
  return (
    <div style={{ background: "#C9C7C1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <HideChrome />
      {variant === "cover" ? (
        <CoverPin product={product} />
      ) : variant === "frame" ? (
        <FramePin product={product} />
      ) : (
        <BandPin product={product} />
      )}
    </div>
  );
}

// Suppress the root-layout cookie banner + Next dev-tools badge so they don't
// bleed into the pin capture.
function HideChrome() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[aria-label="Cookie consent"]{display:none !important}nextjs-portal{display:none !important}`,
      }}
    />
  );
}

type Product = NonNullable<Awaited<ReturnType<typeof getProductById>>>;

const FRAME: React.CSSProperties = {
  width: W,
  height: H,
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans)",
  textTransform: "none",
  WebkitFontSmoothing: "antialiased",
  background: "var(--cream, #FCFBF7)",
  color: "var(--ink, #3B3C3A)",
};
const SERIF = "var(--font-serif, Georgia, 'Times New Roman', serif)";

function imageOf(p: Product) {
  return p.item_image || p.images?.[0] || null;
}

// ── Variant 1: editorial band ───────────────────────────────────────────────
function BandPin({ product }: { product: Product }) {
  const image = imageOf(product);
  const hasScore = typeof product.toxome_score === "number";
  const brand = (product.brand || "").trim();
  const IMG_H = 1020; // top ~68%, smaller band
  const PAD = 64;

  return (
    <div style={FRAME}>
      <div style={{ position: "absolute", top: 0, left: 0, width: W, height: IMG_H, background: "var(--tan, #EDE9E0)", overflow: "hidden" }}>
        <ProductImg src={image} />
      </div>

      <div style={{ position: "absolute", top: IMG_H, left: 0, right: 0, bottom: 0, padding: PAD, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Lockup />
          {hasScore && <ScoreRing score={product.toxome_score as number} />}
        </div>

        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
          {brand && <div style={eyebrow()}>{brand}</div>}
          <Headline text={product.item_name} size={58} clamp={2} />
        </div>

        <div style={{ marginTop: "auto" }}>
          <Cta />
        </div>
      </div>
    </div>
  );
}

// ── Variant 2: full-bleed cover ─────────────────────────────────────────────
function CoverPin({ product }: { product: Product }) {
  const image = imageOf(product);
  const hasScore = typeof product.toxome_score === "number";
  const brand = (product.brand || "").trim();
  const PAD = 64;

  return (
    <div style={FRAME}>
      {/* Full-bleed product image. */}
      <div style={{ position: "absolute", inset: 0, background: "var(--tan, #EDE9E0)", overflow: "hidden" }}>
        <ProductImg src={image} />
      </div>

      {/* Top lockup on a soft scrim so it reads on any photo. */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, background: "linear-gradient(to bottom, rgba(35,36,34,0.42), rgba(35,36,34,0))" }} />
      <div style={{ position: "absolute", top: PAD, left: 48 }}>
        <Lockup onDark />
      </div>
      {hasScore && (
        <div style={{ position: "absolute", top: PAD, right: PAD }}>
          <ScoreRing score={product.toxome_score as number} size={148} stroke={17} onDark />
        </div>
      )}

      {/* Bottom scrim + text block. */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 620, background: "linear-gradient(to bottom, rgba(35,36,34,0), rgba(35,36,34,0.82))" }} />
      <div style={{ position: "absolute", left: PAD, right: PAD, bottom: PAD, display: "flex", flexDirection: "column", gap: 16 }}>
        {brand && <div style={eyebrow("rgba(252,251,247,0.72)")}>{brand}</div>}
        <Headline text={product.item_name} size={62} clamp={3} color="var(--cream, #FCFBF7)" />
        <div style={{ marginTop: 6 }}>
          <Cta color="rgba(252,251,247,0.92)" />
        </div>
      </div>
    </div>
  );
}

// ── Variant 3: framed on cream, centered ────────────────────────────────────
function FramePin({ product }: { product: Product }) {
  const image = imageOf(product);
  const hasScore = typeof product.toxome_score === "number";
  const brand = (product.brand || "").trim();
  const M = 80; // side margin for the framed image

  return (
    <div style={FRAME}>
      {/* Masthead. */}
      <div style={{ position: "absolute", top: 56, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Lockup />
      </div>

      {/* Framed product image, square-cornered editorial card. */}
      <div style={{ position: "absolute", top: 168, left: M, width: W - M * 2, height: 800, background: "var(--tan, #EDE9E0)", overflow: "hidden" }}>
        <ProductImg src={image} />
      </div>

      {/* Centered caption block. */}
      <div style={{ position: "absolute", top: 1004, left: M, right: M, bottom: 56, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
        {brand && <div style={{ ...eyebrow(), textAlign: "center" }}>{brand}</div>}
        <Headline text={product.item_name} size={56} clamp={2} center />
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 24 }}>
          {hasScore && <ScoreRing score={product.toxome_score as number} size={96} stroke={12} />}
          <Cta />
        </div>
      </div>
    </div>
  );
}

// ── Shared pieces ────────────────────────────────────────────────────────────
function ProductImg({ src }: { src: string | null }) {
  if (!src) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3, #8A9199)", fontSize: 26 }}>
        no image
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
}

function eyebrow(color = "var(--ink-3, #8A9199)"): React.CSSProperties {
  return {
    fontFamily: "var(--font-sans)",
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
    color,
  };
}

function Headline({
  text,
  size,
  clamp,
  color = "var(--ink, #3B3C3A)",
  center = false,
}: {
  text: string;
  size: number;
  clamp: number;
  color?: string;
  center?: boolean;
}) {
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontSize: size,
        lineHeight: 1.06,
        letterSpacing: "-0.015em",
        fontWeight: 500,
        color,
        textAlign: center ? "center" : "left",
        display: "-webkit-box",
        WebkitLineClamp: clamp,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {text}
    </div>
  );
}

function Lockup({ onDark = false, eye = 48 }: { onDark?: boolean; eye?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(eye * 0.27) }}>
      <EyeLogo size={eye} />
      <span style={{ fontSize: Math.round(eye * 0.83), fontWeight: 500, letterSpacing: "-0.01em", color: onDark ? "var(--cream, #FCFBF7)" : "var(--ink, #3B3C3A)" }}>Toxome</span>
    </div>
  );
}

function Cta({ color = "var(--ink-2, #57636C)" }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.01em", color }}>shop on toxome.app</span>
      <Arrow color={color} />
    </div>
  );
}

// Toxome score ring — matches the app's ScoreRing (lib/design/score_ring.dart)
// and the website closet-lab ring: tan track, thick round-cap arc, center
// number + "score" label, 12 o'clock start. Arc fills to score% and is colored
// by the app's verdict band (>=68 low/green, >=40 moderate/amber, else high/red).
// onDark switches the track + numerals to cream for use over a photo scrim.
function ScoreRing({
  score,
  size = 116,
  stroke = 14,
  onDark = false,
}: {
  score: number;
  size?: number;
  stroke?: number;
  onDark?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const len = pct * circ;
  const c = size / 2;
  const arc =
    score >= 68
      ? "var(--risk-low, #ADC89C)"
      : score >= 40
        ? "var(--orange, #E6A638)"
        : "var(--red, #C84242)";
  const track = onDark ? "rgba(252,251,247,0.28)" : "var(--tan, #EDE9E0)";
  const num = onDark ? "var(--cream, #FCFBF7)" : "var(--ink, #3B3C3A)";
  const label = onDark ? "rgba(252,251,247,0.7)" : "var(--ink-3, #8A9199)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }} aria-hidden>
        <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={arc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${len} ${circ}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: Math.round(size * 0.27), lineHeight: 1, letterSpacing: "-0.04em", color: num, fontFeatureSettings: '"tnum"' }}>
          {score}
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: label, marginTop: 4 }}>
          score
        </span>
      </div>
    </div>
  );
}

function Arrow({ color }: { color: string }) {
  return (
    <svg width={38} height={20} viewBox="0 0 38 20" fill="none" aria-hidden>
      <path d="M2 10h32" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M27 4l7 6-7 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Toxome eye mark, the actual locked logo (eye only, 4311×2813 ≈ 1.532:1).
// Scaled proportionally, never recolored or cropped. Matches the carousel studio.
function EyeLogo({ size = 56 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/toxome-logo.png"
      alt="Toxome"
      width={size}
      height={Math.round(size / 1.532)}
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}
