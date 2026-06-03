// Internal render surface for single Instagram GRID TILES (1080×1350).
// Visit /studio/post?t=SLUG to render one tile; omit t for a contact sheet.
// These are the non-carousel templates that give the @toxome grid its rhythm:
// full-bleed photo tiles alternating with quiet cream type tiles. Inter only.
// (Editorial reference: warm beauty-magazine grids — mastheads, thin-line marks,
// big quiet headlines, lots of negative space.)

const W = 1080;
const H = 1350;
const PAD = 92;

type Post =
  // Magazine-cover masthead over a full-bleed photo.
  | { kind: "masthead"; eyebrow: string; coverline: string; issue: string; image: string }
  // Thin-line ring mark with a 3-word phrase over a textural photo.
  // Overlays on photos are ALWAYS white (locked 2026-06-03).
  | { kind: "linemark"; words: [string, string, string]; image: string }
  // Pure-type breather on cream — an overheard line.
  | { kind: "quote"; quote: string; attribution: string }
  // Editorial headline anchored bottom-left over a full-bleed photo.
  | { kind: "editorial"; eyebrow: string; headline: string; image: string }
  // Vogue-style article teaser — kicker + serif headline + standfirst + CTA
  // over a full-bleed editorial photo. Drives to a /journal article.
  | { kind: "teaser"; kicker: string; headline: string; dek: string; cta: string; image: string }
  // Fiber index card on cream — a swatch + the fiber's one-line dossier.
  | { kind: "index"; no: string; fiber: string; meta: string[]; verdict: string; image: string; tone?: "clean" | "warn" };

const POSTS: Record<string, Post> = {
  "cover-radiance": {
    kind: "masthead",
    eyebrow: "Fashion Wellness",
    coverline: "know what’s in your clothes.",
    issue: "Issue Nº 01",
    image: "/fibers/silk-1.jpg",
  },
  "mark-fibers": {
    kind: "linemark",
    words: ["know", "your", "fibers"],
    image: "/fibers/wool-2.jpg",
  },
  "quote-plain-shirt": {
    kind: "quote",
    quote: "why is it so hard to find a plain shirt that isn’t made of plastic?",
    attribution: "Overheard",
  },
  "editorial-next-to-skin": {
    kind: "editorial",
    eyebrow: "Next to skin",
    headline: "what you wear touches you all day.",
    image: "/fibers/linen-1.jpg",
  },
  "index-linen": {
    kind: "index",
    no: "Fiber Nº 01",
    fiber: "Linen",
    meta: ["from flax", "breathable", "biodegradable"],
    verdict: "zero plastic",
    image: "/fibers/guide/linen.jpg",
    tone: "clean",
  },
  "index-cotton": {
    kind: "index",
    no: "Fiber Nº 02",
    fiber: "Cotton",
    meta: ["from the cotton plant", "soft", "breathable"],
    verdict: "zero plastic",
    image: "/fibers/guide/cotton.jpg",
    tone: "clean",
  },
  "index-wool": {
    kind: "index",
    no: "Fiber Nº 03",
    fiber: "Wool",
    meta: ["from sheep", "warm", "odor-resistant"],
    verdict: "zero plastic",
    image: "/fibers/guide/wool.jpg",
    tone: "clean",
  },
  "index-silk": {
    kind: "index",
    no: "Fiber Nº 04",
    fiber: "Silk",
    meta: ["from silkworms", "smooth", "temperature-regulating"],
    verdict: "zero plastic",
    image: "/fibers/guide/silk.jpg",
    tone: "clean",
  },
  "index-polyester": {
    kind: "index",
    no: "Fiber Nº 05",
    fiber: "Polyester",
    meta: ["spun from petroleum", "sheds microplastics", "traps heat & sweat"],
    verdict: "this one is plastic",
    image: "/fibers/guide/polyester.jpg",
    tone: "warn",
  },
  "teaser-quiet-plastic": {
    kind: "teaser",
    kicker: "The Journal",
    headline: "The Quiet Plastic in Your Closet",
    dek: "The softest shirt in your drawer may be spun from petroleum. A field guide to reading what you wear.",
    cta: "Read on toxome.com",
    image: "/hero-field.jpg",
  },
  "teaser-what-linen-knows": {
    kind: "teaser",
    kicker: "The Journal",
    headline: "What Linen Knows",
    dek: "On flax, breath, and the case for fabrics that were never trying to be plastic.",
    cta: "Read on toxome.com",
    image: "/fibers/linen-1.jpg",
  },
};

const ORDER = [
  "cover-radiance",
  "mark-fibers",
  "quote-plain-shirt",
  "editorial-next-to-skin",
  "index-linen",
  "index-cotton",
  "index-wool",
  "index-silk",
  "index-polyester",
  "teaser-quiet-plastic",
  "teaser-what-linen-knows",
];

export default async function PostStudio({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.t && POSTS[sp.t] ? sp.t : null;

  if (!slug) {
    return (
      <div style={{ background: "#E9E7E1", minHeight: "100vh", padding: 32, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
        <HideChrome />
        {ORDER.map((s) => (
          <div key={s} style={{ width: W * 0.3, height: H * 0.3, overflow: "hidden", borderRadius: 8, boxShadow: "0 8px 28px rgba(0,0,0,0.14)" }}>
            <div style={{ transform: "scale(0.3)", transformOrigin: "top left" }}>
              <PostView post={POSTS[s]} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: "#C9C7C1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <HideChrome />
      <PostView post={POSTS[slug]} />
    </div>
  );
}

function HideChrome() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[aria-label="Cookie consent"]{display:none !important}nextjs-portal{display:none !important}`,
      }}
    />
  );
}

function PostView({ post }: { post: Post }) {
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

  // ── Masthead cover ───────────────────────────────────────────────────────
  if (post.kind === "masthead") {
    return (
      <div style={{ ...frame, background: "#1d1b17" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,19,15,0.52) 0%, rgba(20,19,15,0.12) 34%, rgba(20,19,15,0.18) 62%, rgba(20,19,15,0.66) 100%)" }} />

        <div style={{ position: "absolute", top: 84, left: PAD, right: PAD, textAlign: "center" }}>
          <div style={eyebrowWhite}>{post.eyebrow}</div>
          <div style={{ marginTop: 18, color: "#fff", fontSize: 132, fontWeight: 500, letterSpacing: "0.14em", lineHeight: 1 }}>
            TOXOME
          </div>
        </div>

        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 150, textAlign: "center" }}>
          <div style={{ color: "#fff", fontStyle: "italic", fontSize: 50, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.2, textShadow: "0 2px 18px rgba(0,0,0,0.4)" }}>
            {post.coverline}
          </div>
          <div style={{ ...eyebrowWhite, marginTop: 28 }}>{post.issue}</div>
        </div>
      </div>
    );
  }

  // ── Thin-line ring mark ──────────────────────────────────────────────────
  if (post.kind === "linemark") {
    // Overlays on photos are always white (locked 2026-06-03).
    const c = "#fff";
    return (
      <div style={{ ...frame, background: "#1d1b17" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        {/* dark veil so the white line work reads cleanly over any photo */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,19,15,0.42)" }} />

        {/* eye mark, top-center */}
        <div style={{ position: "absolute", top: 104, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <EyeLogo size={76} />
        </div>

        {/* broken ring + words on the centerline */}
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: c, fontSize: 64, fontWeight: 400, letterSpacing: "0.01em", textAlign: "right", marginRight: -28, zIndex: 2 }}>{post.words[0]}</span>
          <div style={{ position: "relative", width: 268, height: 268, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="268" height="268" viewBox="0 0 268 268" style={{ position: "absolute", inset: 0 }} fill="none" aria-hidden>
              <path d="M134 16 A118 118 0 0 1 252 134" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M134 252 A118 118 0 0 1 16 134" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span style={{ color: c, fontStyle: "italic", fontSize: 64, fontWeight: 400 }}>{post.words[1]}</span>
          </div>
          <span style={{ color: c, fontSize: 64, fontWeight: 400, letterSpacing: "0.01em", textAlign: "left", marginLeft: -28, zIndex: 2 }}>{post.words[2]}</span>
        </div>

        {/* lockup label, bottom-center */}
        <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 600, letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.82)" }}>
            Toxome
          </span>
        </div>
      </div>
    );
  }

  // ── Overheard quote (cream breather) ─────────────────────────────────────
  if (post.kind === "quote") {
    return (
      <div style={{ ...frame, background: "var(--cream, #FCFBF7)", color: "var(--ink, #3B3C3A)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: PAD }}>
        <EyeLogo size={84} />
        <div style={{ marginTop: 56, fontStyle: "italic", fontSize: 64, fontWeight: 400, lineHeight: 1.24, letterSpacing: "-0.015em", textAlign: "center", maxWidth: 840, color: "var(--ink, #3B3C3A)" }}>
          “{post.quote}”
        </div>
        <div style={{ ...eyebrowInk, marginTop: 56 }}>{post.attribution}</div>
      </div>
    );
  }

  // ── Editorial headline over photo ────────────────────────────────────────
  if (post.kind === "editorial") {
    return (
      <div style={{ ...frame, background: "#1d1b17" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,19,15,0.30) 0%, rgba(20,19,15,0.05) 42%, rgba(20,19,15,0.34) 74%, rgba(20,19,15,0.72) 100%)" }} />

        <div style={{ position: "absolute", top: 84, left: PAD }}>
          <EyeLogo size={64} />
        </div>

        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 132 }}>
          <div style={eyebrowWhite}>{post.eyebrow}</div>
          <div style={{ marginTop: 20, color: "#fff", fontSize: 60, fontWeight: 400, lineHeight: 1.14, letterSpacing: "-0.02em", maxWidth: 760, textShadow: "0 2px 18px rgba(0,0,0,0.42)" }}>
            {post.headline}
          </div>
        </div>
      </div>
    );
  }

  // ── Vogue-style article teaser ───────────────────────────────────────────
  if (post.kind === "teaser") {
    return (
      <div style={{ ...frame, background: "#1d1b17" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,19,15,0.50) 0%, rgba(20,19,15,0.10) 30%, rgba(20,19,15,0.36) 60%, rgba(20,19,15,0.86) 100%)" }} />

        {/* masthead row */}
        <div style={{ position: "absolute", top: 80, left: PAD, right: PAD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <EyeLogo size={58} />
          <span style={{ ...eyebrowWhite, fontSize: 19, letterSpacing: "0.30em" }}>Toxome</span>
        </div>

        {/* headline block, lower third */}
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 128 }}>
          <div style={{ ...eyebrowWhite, color: "rgba(255,255,255,0.9)" }}>{post.kicker}</div>
          <div style={{ marginTop: 26, fontFamily: "var(--font-serif)", color: "#fff", fontSize: 86, fontWeight: 500, lineHeight: 1.04, letterSpacing: "-0.01em", maxWidth: 880, textShadow: "0 2px 22px rgba(0,0,0,0.45)" }}>
            {post.headline}
          </div>
          <div style={{ marginTop: 26, fontFamily: "var(--font-sans)", color: "rgba(255,255,255,0.92)", fontSize: 28, fontWeight: 400, fontStyle: "italic", lineHeight: 1.4, letterSpacing: "-0.005em", maxWidth: 720, textShadow: "0 1px 14px rgba(0,0,0,0.4)" }}>
            {post.dek}
          </div>
          {/* thin white rule + CTA */}
          <div style={{ marginTop: 38, height: 1, background: "rgba(255,255,255,0.6)", width: 92 }} />
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "var(--font-sans)", color: "#fff", fontSize: 24, fontWeight: 500, letterSpacing: "0.01em" }}>{post.cta}</span>
            <svg width="40" height="14" viewBox="0 0 40 14" fill="none" aria-hidden>
              <path d="M0 7h36" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M31 2l6 5-6 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // ── Fiber index card (cream) ─────────────────────────────────────────────
  return (
    <div style={{ ...frame, background: "var(--cream, #FCFBF7)", color: "var(--ink, #3B3C3A)", padding: PAD, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={eyebrowInk}>{post.no}</div>
        <EyeLogo size={56} />
      </div>

      {/* swatch */}
      <div style={{ marginTop: 64, width: "100%", height: 470, borderRadius: 18, overflow: "hidden", background: "var(--tan, #EDE9E0)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>

      <div style={{ marginTop: 56, fontSize: 132, fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 0.96, color: "var(--ink, #3B3C3A)" }}>
        {post.fiber}
      </div>
      <div style={{ marginTop: 28, fontSize: 30, fontWeight: 400, letterSpacing: "0.01em", color: "var(--ink-2, #57636C)" }}>
        {post.meta.join("   ·   ")}
      </div>
      <div
        style={{
          marginTop: 40,
          display: "inline-block",
          padding: "12px 22px",
          borderRadius: 999,
          background: post.tone === "warn" ? "var(--red, #C84242)" : "var(--blue, #A8BDD3)",
          color: post.tone === "warn" ? "#fff" : "var(--ink, #3B3C3A)",
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "0.01em",
        }}
      >
        {post.verdict}
      </div>
    </div>
  );
}

const eyebrowWhite: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 22,
  fontWeight: 600,
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.82)",
};

const eyebrowInk: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: "0.30em",
  textTransform: "uppercase",
  color: "var(--ink-3, #8A9199)",
};

// Toxome eye mark — the actual locked logo (eye only, 4311×2813 ≈ 1.532:1).
function EyeLogo({ size = 56 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/toxome-logo.png" alt="Toxome" width={size} height={Math.round(size / 1.532)} style={{ display: "block", objectFit: "contain" }} />
  );
}
