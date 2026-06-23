// Internal render surface for Instagram carousel slides (1080×1350).
// Visit /studio/carousel?c=SLUG&i=N to render a single slide for screenshot/export.
// Omit i to get a contact sheet of the whole carousel. Omit c for the default.
// Not linked anywhere; used to produce post visuals for the content dashboard.
// Editorial reference: Headicure-style, full-bleed stat cover + minimal cream
// interior slides with eye+wordmark lockup, one big statement each. Inter only.
// Carousel CONTENT lives in the `carousels` Supabase table (slug + slides jsonb).
// This file owns the DESIGN (SlideView); add/edit carousels as data, not code.

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1080;
const H = 1350;
const PAD = 84;
const WARM = "#FBF8F1";

type Slide =
  | { kind: "cover"; hook: string; stat: string; image: string; kicker?: string; headline?: string; standfirst?: string }
  | { kind: "statement"; paras: string[] }
  | { kind: "quote"; quote: string; attrib?: string }
  | { kind: "close"; headline: string; image: string };

type Variant = "educational" | "editorial";

async function getCarousel(slug: string): Promise<{ slides: Slide[]; style: Variant } | null> {
  const { data, error } = await supabaseAdmin
    .from("carousels")
    .select("slides, style")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  const slides = data.slides as Slide[] | null;
  if (!slides || !slides.length) return null;
  const style = (data.style as Variant) || "educational";
  return { slides, style };
}

const DEFAULT_SLUG = "plastic-closet";

export default async function CarouselStudio({
  searchParams,
}: {
  searchParams: Promise<{ i?: string; c?: string; style?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.c || DEFAULT_SLUG;
  const carousel = (await getCarousel(slug)) ?? (await getCarousel(DEFAULT_SLUG));
  const slides = carousel?.slides ?? [];
  const variant: Variant = (sp.style as Variant) || carousel?.style || "educational";
  if (!slides.length) {
    return (
      <div style={{ background: "#E9E7E1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", color: "#1d1b17" }}>
        No carousel found for "{slug}".
      </div>
    );
  }
  const raw = sp.i;
  const showAll = raw == null;
  const i = Math.max(0, Math.min(slides.length - 1, Number(raw ?? 0)));

  if (showAll) {
    // Contact sheet, all slides scaled down for review.
    return (
      <div style={{ background: "#E9E7E1", minHeight: "100vh", padding: 32, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
        <HideChrome />
        {slides.map((_, idx) => (
          <div key={idx} style={{ width: W * 0.26, height: H * 0.26, overflow: "hidden", borderRadius: 8, boxShadow: "0 8px 28px rgba(0,0,0,0.14)" }}>
            <div style={{ transform: "scale(0.26)", transformOrigin: "top left" }}>
              <SlideView slide={slides[idx]} index={idx} total={slides.length} variant={variant} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single slide, exact size, centered on a neutral backdrop for clean capture.
  return (
    <div style={{ background: "#C9C7C1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <HideChrome />
      <SlideView slide={slides[i]} index={i} total={slides.length} variant={variant} />
    </div>
  );
}

// Suppress the root-layout cookie banner + Next dev-tools badge so they don't
// bleed into slide captures.
function HideChrome() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[aria-label="Cookie consent"]{display:none !important}nextjs-portal{display:none !important}`,
      }}
    />
  );
}

function SlideView({ slide, index, total, variant = "educational" }: { slide: Slide; index: number; total: number; variant?: Variant }) {
  if (variant === "editorial") {
    return <EditorialSlide slide={slide} index={index} total={total} />;
  }
  const frame: React.CSSProperties = {
    width: W,
    height: H,
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    fontFamily: "var(--font-sans)",
    textTransform: "none",
    WebkitFontSmoothing: "antialiased",
  };

  if (slide.kind === "cover") {
    return (
      <div style={{ ...frame, background: "#1d1b17" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        {/* Strong dark wash, keeps white type legible over any photo tone. */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,19,15,0.62) 0%, rgba(20,19,15,0.34) 30%, rgba(20,19,15,0.40) 60%, rgba(20,19,15,0.80) 100%)" }} />

        {/* small eye mark */}
        <div style={{ position: "absolute", top: 56, left: PAD }}>
          <EyeLogo size={68} />
        </div>

        {/* top hairline */}
        <div style={{ position: "absolute", top: 132, left: PAD, right: PAD, height: 1, background: "rgba(251,248,241,0.85)" }} />
        {/* hook */}
        <div style={{ position: "absolute", top: 168, left: PAD, right: PAD, color: WARM, fontSize: 40, lineHeight: 1.32, fontWeight: 400, letterSpacing: "-0.01em", maxWidth: 820, textShadow: "0 2px 18px rgba(0,0,0,0.35)" }}>
          {slide.hook}
        </div>

        {/* giant stat */}
        <StatBig stat={slide.stat} />

        {/* read all CTA */}
        <div style={{ position: "absolute", right: PAD, bottom: 110, display: "flex", alignItems: "center", gap: 22, color: WARM }}>
          <span style={{ fontSize: 30, fontWeight: 400 }}>Read all.</span>
          <ArrowRing color={WARM} size={74} />
        </div>
      </div>
    );
  }

  // Closing CTA slide, phone mockup + eye lockup on a soft radial wash.
  if (slide.kind === "close") {
    return (
      <div style={{ ...frame, background: "radial-gradient(ellipse 78% 56% at 50% 40%, #FCFBF7 0%, #EFECE4 48%, #D9D4CA 100%)", color: "var(--ink, #3B3C3A)" }}>
        {/* pagination index */}
        <div style={{ position: "absolute", top: PAD, right: PAD, fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 500, letterSpacing: "0.08em", color: "var(--ink-3, #8A9199)" }}>
          {`Nº ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
        </div>
        {/* headline */}
        <div style={{ position: "absolute", top: 150, left: PAD, right: PAD, textAlign: "center", fontSize: 54, lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 400, color: "var(--ink, #3B3C3A)" }}>
          {slide.headline}
        </div>
        {/* phone mockup */}
        <div style={{ position: "absolute", top: 372, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <PhoneMock src={slide.image} />
        </div>
        {/* eye + wordmark */}
        <div style={{ position: "absolute", bottom: 92, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <EyeLogo size={118} />
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 54, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink, #3B3C3A)" }}>Toxome</div>
        </div>
      </div>
    );
  }

  // Interior slides, cream chrome: eye+wordmark lockup, statement/quote, arrow.
  return (
    <div style={{ ...frame, background: "var(--cream, #FCFBF7)", color: "var(--ink, #3B3C3A)" }}>
      {/* wordmark lockup with eye */}
      <div style={{ position: "absolute", top: PAD, left: PAD, display: "flex", alignItems: "center", gap: 14 }}>
        <EyeLogo size={54} />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 46, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink, #3B3C3A)" }}>Toxome</span>
      </div>
      {/* pagination index */}
      <div style={{ position: "absolute", top: PAD, right: PAD, fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 500, letterSpacing: "0.08em", color: "var(--ink-3, #8A9199)" }}>
        {`Nº ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
      </div>
      {slide.kind === "statement" && (
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 150, display: "flex", flexDirection: "column", gap: 40 }}>
          {slide.paras.map((p, idx) =>
            idx === 0 ? (
              <div key={idx} style={{ fontSize: 56, lineHeight: 1.16, letterSpacing: "-0.015em", fontWeight: 400, maxWidth: 840, color: "var(--ink, #3B3C3A)" }}>
                {p}
              </div>
            ) : (
              <div key={idx} style={{ fontSize: 40, lineHeight: 1.28, letterSpacing: "-0.012em", fontWeight: 400, maxWidth: 840, color: "var(--ink-2, #57636C)" }}>
                {p}
              </div>
            )
          )}
        </div>
      )}

      {slide.kind === "quote" && (
        <div style={{ position: "absolute", left: PAD, right: PAD, top: "50%", transform: "translateY(-50%)" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 140, lineHeight: 0.8, fontWeight: 400, color: "var(--ink-3, #8A9199)", marginBottom: 8, userSelect: "none" }}>
            &ldquo;
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 72, lineHeight: 1.18, letterSpacing: "-0.01em", color: "var(--ink, #3B3C3A)", maxWidth: 880 }}>
            {slide.quote}
          </div>
        </div>
      )}

      {/* arrow CTA */}
      <div style={{ position: "absolute", right: PAD, bottom: 132 }}>
        <ArrowRing color="var(--ink, #3B3C3A)" size={74} />
      </div>
    </div>
  );
}

// Editorial / NYT-style design (style="editorial"): a Journal teaser that drives
// traffic to the article. Serif (Cormorant) headlines, photo + headline-overlay
// cover, attributed pull-quote, cream interiors, article CTA close. No stat, no ring.
function EditorialSlide({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  const frame: React.CSSProperties = {
    width: W,
    height: H,
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    fontFamily: "var(--font-sans)",
    textTransform: "none",
    WebkitFontSmoothing: "antialiased",
  };
  const serif = "var(--font-serif, Georgia, 'Times New Roman', serif)";
  const kicker: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  };
  const pageStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: "0.08em",
    color: "var(--ink-3, #8A9199)",
  };
  const pageTag = `Nº ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  // COVER, full-bleed photo + serif headline and standfirst over a bottom scrim.
  if (slide.kind === "cover") {
    return (
      <div style={{ ...frame, background: "#1d1b17" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,19,15,0.20) 0%, rgba(20,19,15,0.04) 30%, rgba(20,19,15,0.52) 64%, rgba(20,19,15,0.90) 100%)" }} />
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 92 }}>
          <div style={{ ...kicker, color: WARM }}>{slide.kicker ?? "The Journal"}</div>
          <div style={{ fontFamily: serif, color: WARM, fontSize: 84, lineHeight: 1.05, letterSpacing: "-0.01em", fontWeight: 500, marginTop: 22, maxWidth: 900, textShadow: "0 2px 22px rgba(0,0,0,0.45)" }}>
            {slide.headline ?? slide.hook}
          </div>
          {slide.standfirst && (
            <div style={{ color: "rgba(251,248,241,0.88)", fontSize: 30, lineHeight: 1.42, marginTop: 24, maxWidth: 800, textShadow: "0 1px 14px rgba(0,0,0,0.4)" }}>
              {slide.standfirst}
            </div>
          )}
          <div style={{ width: 148, height: 1, background: "rgba(251,248,241,0.8)", marginTop: 32 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26 }}>
            <EyeLogo size={46} />
            <span style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.01em", color: WARM }}>Toxome</span>
          </div>
        </div>
      </div>
    );
  }

  // CLOSE, cream, centered, drives the reader to the article on the website.
  if (slide.kind === "close") {
    const [head, ...rest] = slide.headline.split(". ");
    const sub = rest.join(". ");
    return (
      <div style={{ ...frame, background: "var(--cream, #FCFBF7)", color: "var(--ink, #3B3C3A)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: PAD }}>
        <div style={{ position: "absolute", top: PAD, right: PAD, ...pageStyle }}>{pageTag}</div>
        <EyeLogo size={120} />
        <div style={{ fontFamily: serif, fontSize: 76, lineHeight: 1.1, letterSpacing: "-0.01em", fontWeight: 500, marginTop: 40, maxWidth: 840 }}>
          {head}{rest.length ? "." : ""}
        </div>
        {sub && (
          <div style={{ fontSize: 32, lineHeight: 1.4, color: "var(--ink-2, #57636C)", marginTop: 26, maxWidth: 760 }}>{sub}</div>
        )}
      </div>
    );
  }

  // INTERIOR, cream, eye+wordmark lockup, serif lead line, Inter support.
  return (
    <div style={{ ...frame, background: "var(--cream, #FCFBF7)", color: "var(--ink, #3B3C3A)" }}>
      <div style={{ position: "absolute", top: PAD, left: PAD, display: "flex", alignItems: "center", gap: 14 }}>
        <EyeLogo size={50} />
        <span style={{ fontSize: 42, fontWeight: 500, letterSpacing: "-0.01em" }}>Toxome</span>
      </div>
      <div style={{ position: "absolute", top: PAD, right: PAD, ...pageStyle }}>{pageTag}</div>

      {slide.kind === "statement" && (
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 150, display: "flex", flexDirection: "column", gap: 34 }}>
          {slide.paras.map((p, idx) =>
            idx === 0 ? (
              <div key={idx} style={{ fontFamily: serif, fontSize: 68, lineHeight: 1.12, letterSpacing: "-0.015em", fontWeight: 500, maxWidth: 880 }}>{p}</div>
            ) : (
              <div key={idx} style={{ fontSize: 38, lineHeight: 1.34, letterSpacing: "-0.01em", color: "var(--ink-2, #57636C)", maxWidth: 840 }}>{p}</div>
            )
          )}
        </div>
      )}

      {slide.kind === "quote" && (
        <div style={{ position: "absolute", left: PAD, right: PAD, top: "50%", transform: "translateY(-50%)" }}>
          <div style={{ fontFamily: serif, fontSize: 150, lineHeight: 0.7, color: "var(--ink-3, #8A9199)", marginBottom: 4, userSelect: "none" }}>&ldquo;</div>
          <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 66, lineHeight: 1.22, letterSpacing: "-0.01em", maxWidth: 900 }}>{slide.quote}</div>
          {slide.attrib && (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 28, fontWeight: 500, letterSpacing: "0.02em", color: "var(--ink-3, #8A9199)", marginTop: 36 }}>{slide.attrib}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Giant cover statistic. Splits a numeric prefix from a trailing unit (%, K, …)
// so the unit renders smaller and raised, matching the editorial reference.
function StatBig({ stat }: { stat: string }) {
  const m = stat.match(/^([\d.,]+)(.*)$/);
  const num = m ? m[1] : stat;
  const unit = m ? m[2] : "";
  return (
    <div style={{ position: "absolute", left: PAD - 8, bottom: 96, display: "flex", alignItems: "flex-start", color: WARM, lineHeight: 0.8, textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
      <span style={{ fontSize: 400, fontWeight: 500, letterSpacing: "-0.04em" }}>{num}</span>
      {unit && (
        <span style={{ fontSize: 184, fontWeight: 500, marginTop: 26, letterSpacing: "-0.02em" }}>{unit}</span>
      )}
    </div>
  );
}

function ArrowRing({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 74 74" fill="none" aria-hidden>
      <circle cx="37" cy="37" r="35.5" stroke={color} strokeWidth="2" />
      <path d="M30 37h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M40 31l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Toxome eye mark, the actual locked logo (eye only, 4311×2813 ≈ 1.532:1).
// Scaled proportionally, never recolored or cropped.
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

// Minimal phone frame holding an app screenshot (warm dark bezel, no notch, // the screenshot carries its own status bar).
function PhoneMock({ src }: { src: string }) {
  return (
    <div style={{ width: 304, height: 652, borderRadius: 54, background: "#1d1b17", padding: 12, boxSizing: "border-box", boxShadow: "0 34px 64px -22px rgba(40,36,30,0.5)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 43, overflow: "hidden", background: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    </div>
  );
}
