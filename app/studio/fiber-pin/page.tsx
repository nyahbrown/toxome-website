// Internal render surface for EDUCATIONAL Pinterest pins built from the fiber
// guide pages (1000×1500, 2:3), for the "Fabric Guide" board.
//
//   /studio/fiber-pin?slug=linen            → all 5 designs, scaled, side by side
//   /studio/fiber-pin?slug=linen&v=<1..5>   → one design at full size (clean capture)
//
// Five GENUINELY DIFFERENT educational layouts (distinct designs read as separate
// "fresh pins" on Pinterest, which boosts distribution):
//   v=1  poster    — type-forward magazine cover, "what is X?" as the hero
//   v=2  swatch    — full-bleed fabric texture, teaching text over a bottom scrim
//   v=3  data-card — encyclopedia-style reference card, score ring as the payoff
//   v=4  split     — photo top / lesson bottom, clean editorial split
//   v=5  qa        — question-and-answer teaching card
//
// Headline style is the explainer "what is <fiber>?"; the Toxome score ring is the
// payoff on every design; CTA sends people to the guide page (read, don't shop).
// Inter for everything functional; the site serif on headlines only. Score ring
// matches app/studio/pin (tan track, round-cap arc colored by verdict band).
// CONTENT comes from lib/fiberGuide (getFiber); this file owns the DESIGN.

import Link from "next/link";
import { getFiber, KIND_LABEL, BAND_META, type GuideFiber } from "@/lib/fiberGuide";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1000;
const H = 1500;

const VARIANTS = ["poster", "swatch", "data-card", "split", "qa"] as const;
type Variant = (typeof VARIANTS)[number];

function variantFrom(v: string | undefined): Variant | null {
  if (!v) return null;
  if (v === "1" || v === "poster") return "poster";
  if (v === "2" || v === "swatch") return "swatch";
  if (v === "3" || v === "data-card" || v === "data") return "data-card";
  if (v === "4" || v === "split") return "split";
  if (v === "5" || v === "qa") return "qa";
  return null;
}

export default async function FiberPinStudio({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; v?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.slug || "linen";
  const variant = variantFrom(sp.v);
  const fiber = getFiber(slug);

  if (!fiber) {
    return (
      <div style={{ background: "#E9E7E1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", color: "#1d1b17" }}>
        <HideChrome />
        No fiber guide found for &quot;{slug}&quot;.
      </div>
    );
  }

  // Single design, exact size, centered on a neutral backdrop for clean capture.
  if (variant) {
    return (
      <div style={{ background: "#C9C7C1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <HideChrome />
        <Pin variant={variant} fiber={fiber} />
      </div>
    );
  }

  // Overview: all five, scaled to thumbnails, each linking to its full capture.
  const S = 0.42;
  return (
    <div style={{ background: "#C9C7C1", minHeight: "100vh", fontFamily: "var(--font-sans)", color: "#1d1b17", padding: "48px 40px 80px" }}>
      <HideChrome />
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#57636C" }}>
          Fabric Guide · educational pins
        </div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {fiber.name} — 5 designs
        </h1>
        <p style={{ marginTop: 8, marginBottom: 32, fontSize: 15, color: "#57636C" }}>
          Try other fibers by changing <code>?slug=</code> (e.g.{" "}
          <code>?slug=polyester</code>). Click a design to open it full-size for capture.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
          {VARIANTS.map((v, i) => (
            <div key={v} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>v{i + 1}</span>
                <span style={{ fontSize: 15, color: "#57636C" }}>{v}</span>
                <Link href={`/studio/fiber-pin?slug=${slug}&v=${i + 1}`} style={{ fontSize: 13, color: "#57636C", marginLeft: 6 }}>
                  open full ↗
                </Link>
              </div>
              <div style={{ width: W * S, height: H * S, borderRadius: 8, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.18)" }}>
                <div style={{ transform: `scale(${S})`, transformOrigin: "top left", width: W, height: H }}>
                  <Pin variant={v} fiber={fiber} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pin({ variant, fiber }: { variant: Variant; fiber: GuideFiber }) {
  switch (variant) {
    case "swatch":
      return <SwatchPin fiber={fiber} />;
    case "data-card":
      return <DataCardPin fiber={fiber} />;
    case "split":
      return <SplitPin fiber={fiber} />;
    case "qa":
      return <QAPin fiber={fiber} />;
    default:
      return <PosterPin fiber={fiber} />;
  }
}

// Suppress the cookie banner + Next dev badge so they don't bleed into captures.
function HideChrome() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[aria-label="Cookie consent"]{display:none !important}nextjs-portal{display:none !important}`,
      }}
    />
  );
}

const SERIF = "var(--font-serif, Georgia, 'Times New Roman', serif)";
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

// ── Data helpers ─────────────────────────────────────────────────────────────
function heroOf(f: GuideFiber): string {
  return f.heroImage || `/fibers/guide/${f.slug}.jpg`;
}
function kindEyebrow(f: GuideFiber): string {
  return `${KIND_LABEL[f.kind]} fiber`;
}
// Short verdict word tied to the app's verdict band, used beside the score.
function verdictWord(f: GuideFiber): string {
  return f.band === "low" ? "clean" : f.band === "moderate" ? "wear with care" : "avoid";
}
function bandLabel(f: GuideFiber): string {
  return BAND_META[f.band].label; // "Safest choices" / "Wear with care" / "Worth avoiding"
}

// ── v1: poster (type-forward magazine cover) ─────────────────────────────────
function PosterPin({ fiber }: { fiber: GuideFiber }) {
  const PAD = 72;
  return (
    <div style={{ ...FRAME, padding: PAD, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Lockup />
        <span style={eyebrow()}>{kindEyebrow(fiber)}</span>
      </div>

      <div style={{ marginTop: 96 }}>
        <div style={{ ...eyebrow("var(--ink-3, #8A9199)"), marginBottom: 22 }}>the fabric guide</div>
        <Headline text={`What is ${fiber.name.toLowerCase()}?`} size={104} clamp={2} />
        {fiber.dek && (
          <p style={{ marginTop: 26, fontSize: 33, lineHeight: 1.32, color: "var(--ink-2, #57636C)", fontWeight: 400, maxWidth: 720 }}>
            {fiber.dek}
          </p>
        )}
      </div>

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={eyebrow("var(--ink-3, #8A9199)")}>toxome score</span>
          <span style={{ fontSize: 30, fontWeight: 500, color: "var(--ink, #3B3C3A)" }}>{bandLabel(fiber).toLowerCase()}</span>
        </div>
        <ScoreRing score={fiber.score} size={168} stroke={18} />
      </div>

      <div style={{ marginTop: 44, borderTop: "1.5px solid var(--tan, #EDE9E0)", paddingTop: 30 }}>
        <GuideCta slug={fiber.slug} />
      </div>
    </div>
  );
}

// ── v2: swatch (full-bleed texture, teaching text over a bottom scrim) ───────
function SwatchPin({ fiber }: { fiber: GuideFiber }) {
  const PAD = 72;
  return (
    <div style={FRAME}>
      <div style={{ position: "absolute", inset: 0, background: "var(--tan, #EDE9E0)" }}>
        <FiberImg src={heroOf(fiber)} />
      </div>
      {/* Top scrim for the lockup */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260, background: "linear-gradient(180deg, rgba(20,18,14,0.55), rgba(20,18,14,0))" }} />
      {/* Bottom scrim for the lesson */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 900, background: "linear-gradient(180deg, rgba(20,18,14,0), rgba(20,18,14,0.86) 62%)" }} />

      <div style={{ position: "absolute", top: PAD, left: PAD, right: PAD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Lockup onDark />
        <span style={eyebrow("rgba(252,251,247,0.82)")}>{kindEyebrow(fiber)}</span>
      </div>

      <div style={{ position: "absolute", left: PAD, right: PAD, bottom: PAD, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Headline text={`What is ${fiber.name.toLowerCase()}?`} size={80} clamp={2} color="var(--cream, #FCFBF7)" />
            {fiber.dek && (
              <p style={{ marginTop: 20, fontSize: 30, lineHeight: 1.3, color: "rgba(252,251,247,0.86)", maxWidth: 660 }}>
                {fiber.dek}
              </p>
            )}
          </div>
          <ScoreRing score={fiber.score} size={150} stroke={16} onDark />
        </div>
        <div style={{ marginTop: 40 }}>
          <GuideCta slug={fiber.slug} onDark />
        </div>
      </div>
    </div>
  );
}

// ── v3: data-card (encyclopedia reference card, score ring is the payoff) ────
function DataCardPin({ fiber }: { fiber: GuideFiber }) {
  const PAD = 72;
  const rows: { k: string; v: string }[] = [
    { k: "family", v: KIND_LABEL[fiber.kind] },
    { k: "toxome score", v: `${fiber.score} / 100` },
    { k: "verdict", v: bandLabel(fiber) },
  ];
  return (
    <div style={{ ...FRAME, padding: PAD, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Lockup />
        <span style={eyebrow("var(--ink-3, #8A9199)")}>the fabric guide</span>
      </div>

      <div style={{ marginTop: 64 }}>
        <span style={eyebrow("var(--ink-3, #8A9199)")}>{kindEyebrow(fiber)}</span>
        <div style={{ marginTop: 14 }}>
          <Headline text={`What is ${fiber.name.toLowerCase()}?`} size={78} clamp={2} />
        </div>
      </div>

      {/* Score ring as the centered hero payoff */}
      <div style={{ marginTop: 56, display: "flex", justifyContent: "center" }}>
        <ScoreRing score={fiber.score} size={300} stroke={26} withCaption={verdictWord(fiber)} />
      </div>

      {/* Reference rows */}
      <div style={{ marginTop: 60, display: "flex", flexDirection: "column" }}>
        {rows.map((r, i) => (
          <div
            key={r.k}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              padding: "26px 0",
              borderTop: "1.5px solid var(--tan, #EDE9E0)",
              ...(i === rows.length - 1 ? { borderBottom: "1.5px solid var(--tan, #EDE9E0)" } : {}),
            }}
          >
            <span style={{ ...eyebrow("var(--ink-3, #8A9199)"), fontSize: 24 }}>{r.k}</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 34, fontWeight: 500, color: "var(--ink, #3B3C3A)" }}>{r.v}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <GuideCta slug={fiber.slug} />
      </div>
    </div>
  );
}

// ── v4: split (photo top, lesson bottom) ─────────────────────────────────────
function SplitPin({ fiber }: { fiber: GuideFiber }) {
  const IMG_H = 820; // top ~55%
  const PAD = 72;
  return (
    <div style={FRAME}>
      <div style={{ position: "absolute", top: 0, left: 0, width: W, height: IMG_H, background: "var(--tan, #EDE9E0)", overflow: "hidden" }}>
        <FiberImg src={heroOf(fiber)} />
        <div style={{ position: "absolute", top: PAD, left: PAD, right: PAD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Lockup onDark />
          <span style={{ ...eyebrow("rgba(252,251,247,0.9)"), background: "rgba(20,18,14,0.32)", padding: "8px 16px", borderRadius: 999, backdropFilter: "blur(2px)" }}>
            {kindEyebrow(fiber)}
          </span>
        </div>
      </div>

      <div style={{ position: "absolute", top: IMG_H, left: 0, right: 0, bottom: 0, padding: PAD, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Headline text={`What is ${fiber.name.toLowerCase()}?`} size={66} clamp={2} />
            {fiber.dek && (
              <p style={{ marginTop: 18, fontSize: 29, lineHeight: 1.3, color: "var(--ink-2, #57636C)", maxWidth: 560 }}>
                {fiber.dek}
              </p>
            )}
          </div>
          <ScoreRing score={fiber.score} size={150} stroke={16} />
        </div>
        <div style={{ marginTop: "auto" }}>
          <GuideCta slug={fiber.slug} />
        </div>
      </div>
    </div>
  );
}

// ── v5: qa (question-and-answer teaching card) ───────────────────────────────
function QAPin({ fiber }: { fiber: GuideFiber }) {
  const PAD = 72;
  const clean = fiber.band === "low";
  const isSynthetic = fiber.kind === "synthetic";
  const madeOf =
    fiber.kind === "natural"
      ? "a natural fiber, worn close to how it grows."
      : fiber.kind === "semi-synthetic"
        ? "wood or plant cellulose, chemically regenerated into thread."
        : "a petrochemical plastic, spun from fossil feedstock.";
  const safeAnswer = clean
    ? "one of the safest fibers you can wear. The fiber is rarely the problem, the dyes and finishes are."
    : isSynthetic
      ? "worth avoiding. Plastic fibers shed microplastics and can carry residual monomers and disperse-dye allergens."
      : "wear with care. It breathes well, but you cannot see how clean the process was.";

  return (
    <div style={{ ...FRAME, padding: PAD, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Lockup />
        <span style={eyebrow("var(--ink-3, #8A9199)")}>{kindEyebrow(fiber)}</span>
      </div>

      <div style={{ marginTop: 60 }}>
        <Headline text={fiber.name} size={116} clamp={1} />
        <div style={{ ...eyebrow("var(--ink-3, #8A9199)"), marginTop: 12 }}>the fabric guide</div>
      </div>

      <div style={{ marginTop: 64, display: "flex", flexDirection: "column", gap: 44 }}>
        <QA q={`What is ${fiber.name.toLowerCase()}?`} a={`${cap(fiber.name)} is ${madeOf}`} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28 }}>
          <QA q="Is it safe to wear?" a={`Toxome scores it ${fiber.score}/100, ${safeAnswer}`} />
          <ScoreRing score={fiber.score} size={168} stroke={18} />
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 40, borderTop: "1.5px solid var(--tan, #EDE9E0)" }}>
        <GuideCta slug={fiber.slug} />
      </div>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1.12, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink, #3B3C3A)" }}>
        {q}
      </div>
      <p style={{ marginTop: 14, fontSize: 30, lineHeight: 1.34, color: "var(--ink-2, #57636C)" }}>{a}</p>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Shared primitives (mirror app/studio/pin) ────────────────────────────────
function FiberImg({ src }: { src: string | null }) {
  if (!src) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3, #8A9199)", fontFamily: "var(--font-sans)", fontSize: 26 }}>
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
}: {
  text: string;
  size: number;
  clamp: number;
  color?: string;
}) {
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: "-0.02em",
        fontWeight: 500,
        color,
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

function Lockup({ onDark = false, eye = 50 }: { onDark?: boolean; eye?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(eye * 0.27) }}>
      <EyeLogo size={eye} />
      <span style={{ fontSize: Math.round(eye * 0.83), fontWeight: 500, letterSpacing: "-0.01em", color: onDark ? "var(--cream, #FCFBF7)" : "var(--ink, #3B3C3A)" }}>
        Toxome
      </span>
    </div>
  );
}

function GuideCta({ slug, onDark = false }: { slug: string; onDark?: boolean }) {
  const color = onDark ? "var(--cream, #FCFBF7)" : "var(--ink-2, #57636C)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.01em", color }}>
        read the guide · toxome.app/guide/{slug}
      </span>
      <Arrow color={color} />
    </div>
  );
}

// Toxome score ring — matches app/studio/pin + the app's ScoreRing. Tan track,
// thick round-cap arc colored by verdict band (>=68 low/green, >=40 moderate/
// amber, else high/red), center number + "score" label (or a custom caption).
function ScoreRing({
  score,
  size = 116,
  stroke = 14,
  onDark = false,
  withCaption,
}: {
  score: number;
  size?: number;
  stroke?: number;
  onDark?: boolean;
  withCaption?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const len = pct * circ;
  const c = size / 2;
  const arc = score >= 68 ? "var(--risk-low, #ADC89C)" : score >= 40 ? "var(--orange, #E6A638)" : "var(--red, #C84242)";
  const track = onDark ? "rgba(252,251,247,0.28)" : "var(--tan, #EDE9E0)";
  const num = onDark ? "var(--cream, #FCFBF7)" : "var(--ink, #3B3C3A)";
  const label = onDark ? "rgba(252,251,247,0.7)" : "var(--ink-3, #8A9199)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }} aria-hidden>
        <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={arc} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${len} ${circ}`} transform={`rotate(-90 ${c} ${c})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: Math.round(size * 0.3), lineHeight: 1, letterSpacing: "-0.04em", color: num, fontFeatureSettings: '"tnum"' }}>
          {score}
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: Math.max(11, Math.round(size * 0.075)), fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: label, marginTop: Math.round(size * 0.03) }}>
          {withCaption || "score"}
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

// Toxome eye mark, the locked logo (eye only, ≈1.532:1), never recolored or cropped.
function EyeLogo({ size = 56 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/toxome-logo.png" alt="Toxome" width={size} height={Math.round(size / 1.532)} style={{ display: "block", objectFit: "contain" }} />
  );
}
