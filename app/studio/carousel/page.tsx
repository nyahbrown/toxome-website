// Internal render surface for Instagram carousel slides (1080×1350).
// Visit /studio/carousel?c=SLUG&i=N to render a single slide for screenshot/export.
// Omit i to get a contact sheet of the whole carousel. Omit c for the default.
// Not linked anywhere; used to produce post visuals for the content dashboard.
// Editorial reference: Headicure-style — full-bleed stat cover + minimal cream
// interior slides with eye+wordmark lockup, one big statement each. Inter only.

const W = 1080;
const H = 1350;
const PAD = 84;

type Slide =
  | { kind: "cover"; hook: string; stat: string; image: string }
  | { kind: "statement"; paras: string[] }
  | { kind: "quote"; quote: string }
  | { kind: "close"; headline: string; image: string };

// Every carousel is exactly 6 slides. Keyed by slug for ?c=SLUG.
const CAROUSELS: Record<string, Slide[]> = {
  // ── The original "60% plastic closet" carousel ───────────────────────────
  "plastic-closet": [
    {
      kind: "cover",
      hook: "Up to 60% of the average closet is made from plastic.",
      stat: "60%",
      image: "/hero-field.jpg",
    },
    { kind: "statement", paras: ["Polyester is plastic — spun from petroleum.", "And most of us wear it against our skin, all day."] },
    { kind: "statement", paras: ["It traps heat and sweat, and sheds microplastics as it wears down.", "Some finishes are even linked to hormone disruption."] },
    { kind: "quote", quote: "“why is it so hard to find a plain shirt that isn’t made of plastic?”" },
    { kind: "statement", paras: ["So we built the check.", "Scan any clothing label — and see what’s really in it."] },
    { kind: "close", headline: "Learn more about how your clothes are made.", image: "/app-screenshot.png" },
  ],

  // ── Educational: microplastics found in human blood (77%) ────────────────
  // Source: Leslie et al., Environment International, 2022 (Vrije Universiteit
  // Amsterdam). Plastic detected in 17 of 22 donors (77%); PET — the polymer
  // spun into polyester clothing — was among the most common.
  "microplastics-blood": [
    {
      kind: "cover",
      hook: "Scientists found microplastics in the blood of nearly 8 in 10 people they tested.",
      stat: "77%",
      image: "/hero-field.jpg",
    },
    { kind: "statement", paras: ["In 2022, researchers tested blood from 22 healthy adults.", "They found plastic particles in 77% of them."] },
    { kind: "statement", paras: ["One of the most common plastics was PET —", "the same material spun into polyester clothing."] },
    { kind: "quote", quote: "“we are wearing plastic, washing plastic — and now carrying it inside us.”" },
    { kind: "statement", paras: ["Your clothes are the plastic you touch most.", "So we built a way to check them."] },
    { kind: "close", headline: "See what your clothes are really made of.", image: "/app-screenshot.png" },
  ],

  // ── Educational: microfiber shedding per wash (up to 730K) ───────────────
  // Source: Napper & Thompson, Marine Pollution Bulletin, 2016. A single 6 kg
  // synthetic wash load can release up to ~730,000 microfibers (acrylic
  // highest; polyester ~496,000). Too small for most filters to catch.
  "microfiber-shedding": [
    {
      kind: "cover",
      hook: "A single load of synthetic laundry can release hundreds of thousands of plastic microfibers.",
      stat: "730K",
      image: "/fibers/wool-2.jpg",
    },
    { kind: "statement", paras: ["One synthetic wash load can shed up to 730,000 microfibers.", "Most are too small for any filter to catch."] },
    { kind: "statement", paras: ["They travel from your laundry to the ocean —", "and back to you, through water and food."] },
    { kind: "quote", quote: "“every time you wash polyester, it sheds a little more of itself.”" },
    { kind: "statement", paras: ["Natural fibers don’t shed plastic.", "Knowing what you own is where it starts."] },
    { kind: "close", headline: "Know what’s in your clothes.", image: "/app-screenshot.png" },
  ],

  // ── Educational: polyester & male fertility, Shafik study (honest) ───────
  // Source: Ahmed Shafik, early-1990s studies. Men in the polyester group
  // developed reduced sperm counts (some azoospermic) within months; cotton
  // and wool groups unchanged; effect reversed after removal. Caveat: small,
  // early study; proposed electrostatic mechanism. Presented honestly.
  "polyester-fertility": [
    {
      kind: "cover",
      hook: "In one early study, every man who switched to polyester underwear saw his fertility fall.",
      stat: "100%",
      image: "/fibers/silk-1.jpg",
    },
    { kind: "statement", paras: ["In the early 1990s, Dr. Ahmed Shafik tracked men who wore polyester, cotton, or wool underwear."] },
    { kind: "statement", paras: ["Every man in the polyester group saw his sperm count fall — some to zero — within months."] },
    { kind: "statement", paras: ["The cotton and wool groups saw no change.", "And when the men stopped, their fertility came back."] },
    { kind: "quote", quote: "“it was a small, early study — but it asks a question worth sitting with.”" },
    { kind: "close", headline: "What you wear touches more than your skin.", image: "/app-screenshot.png" },
  ],
};

const DEFAULT_SLUG = "plastic-closet";

export default async function CarouselStudio({
  searchParams,
}: {
  searchParams: Promise<{ i?: string; c?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.c && CAROUSELS[sp.c] ? sp.c : DEFAULT_SLUG;
  const slides = CAROUSELS[slug];
  const raw = sp.i;
  const showAll = raw == null;
  const i = Math.max(0, Math.min(slides.length - 1, Number(raw ?? 0)));

  if (showAll) {
    // Contact sheet — all slides scaled down for review.
    return (
      <div style={{ background: "#E9E7E1", minHeight: "100vh", padding: 32, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
        <HideChrome />
        {slides.map((_, idx) => (
          <div key={idx} style={{ width: W * 0.26, height: H * 0.26, overflow: "hidden", borderRadius: 8, boxShadow: "0 8px 28px rgba(0,0,0,0.14)" }}>
            <div style={{ transform: "scale(0.26)", transformOrigin: "top left" }}>
              <SlideView slide={slides[idx]} />
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
      <SlideView slide={slides[i]} />
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

function SlideView({ slide }: { slide: Slide }) {
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
        {/* Strong dark wash — keeps white type legible over any photo tone. */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,19,15,0.62) 0%, rgba(20,19,15,0.34) 30%, rgba(20,19,15,0.40) 60%, rgba(20,19,15,0.80) 100%)" }} />

        {/* small eye mark */}
        <div style={{ position: "absolute", top: 56, left: PAD }}>
          <EyeLogo size={68} />
        </div>

        {/* top hairline */}
        <div style={{ position: "absolute", top: 132, left: PAD, right: PAD, height: 1, background: "rgba(255,255,255,0.85)" }} />
        {/* hook */}
        <div style={{ position: "absolute", top: 168, left: PAD, right: PAD, color: "#fff", fontSize: 40, lineHeight: 1.32, fontWeight: 400, letterSpacing: "-0.01em", maxWidth: 820, textShadow: "0 2px 18px rgba(0,0,0,0.35)" }}>
          {slide.hook}
        </div>

        {/* giant stat */}
        <StatBig stat={slide.stat} />

        {/* read all CTA */}
        <div style={{ position: "absolute", right: PAD, bottom: 110, display: "flex", alignItems: "center", gap: 22, color: "#fff" }}>
          <span style={{ fontSize: 30, fontWeight: 400 }}>Read all.</span>
          <ArrowRing color="#fff" size={74} />
        </div>
      </div>
    );
  }

  // Closing CTA slide — phone mockup + eye lockup on a soft radial wash.
  if (slide.kind === "close") {
    return (
      <div style={{ ...frame, background: "radial-gradient(ellipse 78% 56% at 50% 40%, #FCFBF7 0%, #EFECE4 48%, #D9D4CA 100%)", color: "var(--ink, #3B3C3A)" }}>
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

  // Interior slides — cream chrome: eye+wordmark lockup, statement/quote, arrow.
  return (
    <div style={{ ...frame, background: "var(--cream, #FCFBF7)", color: "var(--ink, #3B3C3A)" }}>
      {/* wordmark lockup with eye */}
      <div style={{ position: "absolute", top: PAD, left: PAD, display: "flex", alignItems: "center", gap: 14 }}>
        <EyeLogo size={54} />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 46, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink, #3B3C3A)" }}>Toxome</span>
      </div>
      {slide.kind === "statement" && (
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 150, display: "flex", flexDirection: "column", gap: 40 }}>
          {slide.paras.map((p, idx) => (
            <div key={idx} style={{ fontSize: 56, lineHeight: 1.16, letterSpacing: "-0.015em", fontWeight: 400, maxWidth: 840, color: "var(--ink, #3B3C3A)" }}>
              {p}
            </div>
          ))}
        </div>
      )}

      {slide.kind === "quote" && (
        <div style={{ position: "absolute", left: PAD, right: PAD, top: "50%", transform: "translateY(-50%)" }}>
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

// Giant cover statistic. Splits a numeric prefix from a trailing unit (%, K, …)
// so the unit renders smaller and raised, matching the editorial reference.
function StatBig({ stat }: { stat: string }) {
  const m = stat.match(/^([\d.,]+)(.*)$/);
  const num = m ? m[1] : stat;
  const unit = m ? m[2] : "";
  return (
    <div style={{ position: "absolute", left: PAD - 8, bottom: 96, display: "flex", alignItems: "flex-start", color: "#fff", lineHeight: 0.8, textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
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

// Toxome eye mark — the actual locked logo (eye only, 4311×2813 ≈ 1.532:1).
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

// Minimal phone frame holding an app screenshot (warm dark bezel, no notch —
// the screenshot carries its own status bar).
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
