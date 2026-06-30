"use client";

// Instagram carousel MOCKUP for the Roundup/glyphosate article.
// Visit /studio/ig-mockup to preview how the post reads in an IG post frame.
// Slide 1 is the cotton-spray video with a text overlay; the rest are the
// locked cream editorial cards. Self-contained (no Supabase) — it's a mockup.

import { useState } from "react";

const CREAM = "#FCFBF7";
const INK = "#3B3C3A";
const INK2 = "#57636C";
const BLUE = "#A8BDD3";
const SANS =
  "var(--font-sans), Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const VIDEO = "/journal/supreme-court-glyphosate-cotton.mp4";
const POSTER = "/journal/supreme-court-glyphosate-cotton.jpg";
const SHOP_PORTRAIT = "/posts/shop-portrait.png";

type Slide =
  | { kind: "video"; eyebrow: string; hook: string }
  | { kind: "card"; body: string; foot?: string }
  | { kind: "shop"; headline: string; sub: string; url: string };

const SLIDES: Slide[] = [
  {
    kind: "video",
    eyebrow: "In the news",
    hook: "The Supreme Court just ruled to protect Monsanto from Roundup lawsuits.",
  },
  {
    kind: "card",
    body: "In a 7-2 decision, the Court held that Monsanto cannot be sued under state law for failing to warn that Roundup may cause cancer.",
    foot: "Monsanto v. Durnell, June 25, 2026",
  },
  {
    kind: "card",
    body: "Glyphosate, the weedkiller in Roundup, is sprayed on most of the world's cotton, and again before harvest to dry the plants.",
  },
  {
    kind: "card",
    body: "Residues can remain in the fiber. A 1996 study found that glyphosate passed from cotton through human skin, and that sweat increased how much got through.",
    foot: "Food & Chemical Toxicology, 1996",
  },
  {
    kind: "shop",
    headline: "Shop certified organic cotton.",
    sub: "Organic and GOTS-certified, vetted by Toxome.",
    url: "toxome.app/shop",
  },
];

const CAPTION =
  "On June 25, the Supreme Court ruled that Monsanto cannot be sued under state law for failing to warn that Roundup may cause cancer. Glyphosate, the weedkiller in Roundup, is sprayed on most conventional cotton, and residues can remain in the fabric that sits against your skin. The science is still contested. Choosing organic or GOTS-certified cotton is one way to lower your exposure to glyphosate in clothing. Read the full account on the Journal (link in bio), and browse the non-toxic, organic-cotton edit at toxome.app/shop. #nontoxicliving #organiccotton #glyphosate #fashionwellness #toxicfreefashion";

function Logo({ size = 22 }: { size?: number }) {
  // Actual Toxome brand eye mark (public/toxome-logo.png), aspect ~1.53:1.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/toxome-logo.png"
      alt="Toxome"
      style={{ display: "block", height: size, width: "auto" }}
    />
  );
}

function Lockup({ light = false }: { light?: boolean }) {
  // Matches the website nav wordmark: Inter 600, sentence case, -0.01em.
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Logo size={24} />
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: "-0.01em",
          textTransform: "none",
          color: light ? "#fff" : INK,
        }}
      >
        Toxome
      </span>
    </div>
  );
}

function ShopBrowserBar({ url }: { url: string }) {
  return (
    <div
      style={{
        height: 30,
        flexShrink: 0,
        background: "#ededea",
        borderBottom: "1px solid #e2e2dc",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 12px",
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#e1655a" }} />
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#e3b34e" }} />
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#9fc471" }} />
      <div
        style={{
          flex: 1,
          marginLeft: 8,
          height: 18,
          borderRadius: 999,
          background: "#fff",
          border: "1px solid #e2e2dc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#8a8a82",
        }}
      >
        {url}
      </div>
    </div>
  );
}

// Three design options for the final shop CTA slide, switchable via ?v=1|2|3.
function ShopSlide({
  slide,
  variant,
}: {
  slide: Extract<Slide, { kind: "shop" }>;
  variant: number;
}) {
  // V1 — full-bleed shop photo with a text overlay (matches the video cover)
  if (variant === 1) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SHOP_PORTRAIT}
          alt="The Toxome shop"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 58%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.74) 100%)",
          }}
        />
        <div style={{ position: "absolute", top: 22, left: 22 }}>
          <Lockup light />
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 28 }}>
          <h2
            style={{
              fontSize: 27,
              lineHeight: 1.14,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#fff",
              margin: "0 0 10px",
            }}
          >
            {slide.headline}
          </h2>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.92)",
              margin: 0,
            }}
          >
            {slide.url}
          </p>
        </div>
      </div>
    );
  }

  // V2 — a browser window that fills the slide (portrait capture)
  if (variant === 2) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: CREAM,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "26px 24px 22px",
        }}
      >
        <Lockup />
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: INK,
            margin: "12px 0 14px",
            textAlign: "center",
          }}
        >
          {slide.headline}
        </p>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid #dcdcd6",
            boxShadow: "0 16px 38px rgba(59,60,58,0.16)",
            background: "#fff",
          }}
        >
          <ShopBrowserBar url={slide.url} />
          <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SHOP_PORTRAIT}
              alt="The Toxome shop"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // V3 — editorial cream card with a clean framed grid
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: CREAM,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "30px 30px 26px",
      }}
    >
      <Lockup />
      <h2
        style={{
          fontSize: 22,
          lineHeight: 1.16,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: INK,
          margin: "14px 0 0",
        }}
      >
        {slide.headline}
      </h2>
      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.45,
          color: INK2,
          margin: "7px 0 0",
          maxWidth: 280,
        }}
      >
        {slide.sub}
      </p>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          margin: "16px 0 14px",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #ece8df",
          boxShadow: "0 16px 38px rgba(59,60,58,0.14)",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SHOP_PORTRAIT}
          alt="The Toxome shop"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top",
          }}
        />
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: INK2, margin: 0 }}>
        {slide.url}
      </p>
    </div>
  );
}

function SlideView({
  slide,
  shopVariant,
}: {
  slide: Slide;
  shopVariant: number;
}) {
  if (slide.kind === "video") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <video
          src={VIDEO}
          poster={POSTER}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* legibility scrim */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.12) 58%, rgba(0,0,0,0.62) 100%)",
          }}
        />
        <div style={{ position: "absolute", top: 22, left: 22 }}>
          <Lockup light />
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 30 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.82)",
              margin: "0 0 12px",
            }}
          >
            {slide.eyebrow}
          </p>
          <h2
            style={{
              fontSize: 30,
              lineHeight: 1.12,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#fff",
              margin: 0,
              textShadow: "0 1px 24px rgba(0,0,0,0.35)",
            }}
          >
            {slide.hook}
          </h2>
        </div>
      </div>
    );
  }

  if (slide.kind === "shop") {
    return <ShopSlide slide={slide} variant={shopVariant} />;
  }

  // statement card
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: CREAM,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 40px",
      }}
    >
      <div style={{ position: "absolute", top: 28, left: 40 }}>
        <Lockup />
      </div>
      <p
        style={{
          fontSize: 25,
          lineHeight: 1.28,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          color: INK,
          margin: 0,
        }}
      >
        {slide.body}
      </p>
      {slide.foot && (
        <p
          style={{
            position: "absolute",
            bottom: 28,
            left: 40,
            right: 40,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: BLUE,
            margin: 0,
          }}
        >
          {slide.foot}
        </p>
      )}
    </div>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="#262626"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function IgMockup() {
  // Optional ?slide=N deep-link (1-based) so a single slide can be exported.
  const [i, setI] = useState(() => {
    if (typeof window === "undefined") return 0;
    const raw = new URLSearchParams(window.location.search).get("slide");
    const n = raw ? parseInt(raw, 10) - 1 : 0;
    return Number.isInteger(n) && n >= 0 && n < SLIDES.length ? n : 0;
  });
  // Shop-slide design variation, switchable with ?v=1|2|3 for comparison.
  const shopVariant =
    typeof window === "undefined"
      ? 1
      : Math.min(
          3,
          Math.max(
            1,
            parseInt(new URLSearchParams(window.location.search).get("v") || "1", 10) || 1
          )
        );
  const last = SLIDES.length - 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E9E7E1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px 64px",
        fontFamily: SANS,
        textTransform: "none",
        color: "#262626",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#8a8a82",
          margin: "0 0 18px",
        }}
      >
        Instagram preview · mockup
      </p>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          border: "1px solid #dbdbdb",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "11px 14px",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: CREAM,
              border: "1px solid #ece8df",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Logo size={20} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#262626" }}>
              toxome
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#3897f0">
              <path d="M12 2l2.4 2.1 3.1-.5 1.2 2.9 2.9 1.2-.5 3.1L23 12l-2.1 2.4.5 3.1-2.9 1.2-1.2 2.9-3.1-.5L12 23l-2.4-2.1-3.1.5-1.2-2.9L2.4 17l.5-3.1L1 12l2.1-2.4-.5-3.1 2.9-1.2L6.7 2l3.1.5L12 2z" />
              <path
                d="M9.5 12.5l1.8 1.8 3.5-3.7"
                stroke="#fff"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ color: "#262626", fontSize: 14 }}>· </span>
            <span style={{ color: "#0095f6", fontSize: 14, fontWeight: 600 }}>
              Follow
            </span>
          </div>
          <div style={{ marginLeft: "auto", color: "#262626", fontSize: 20 }}>
            ⋯
          </div>
        </div>

        {/* media (4:5) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 5",
            background: "#000",
            overflow: "hidden",
          }}
        >
          {/* sliding track keeps the video mounted */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              width: `${SLIDES.length * 100}%`,
              transform: `translateX(-${(i * 100) / SLIDES.length}%)`,
              transition: "transform 360ms cubic-bezier(0.22,0.61,0.36,1)",
            }}
          >
            {SLIDES.map((s, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  width: `${100 / SLIDES.length}%`,
                  flexShrink: 0,
                }}
              >
                <SlideView slide={s} shopVariant={shopVariant} />
              </div>
            ))}
          </div>

          {/* slide counter */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {i + 1}/{SLIDES.length}
          </div>

          {/* arrows */}
          {i > 0 && (
            <button
              onClick={() => setI(i - 1)}
              aria-label="Previous"
              style={navBtn("left")}
            >
              <Arrow dir="left" />
            </button>
          )}
          {i < last && (
            <button
              onClick={() => setI(i + 1)}
              aria-label="Next"
              style={navBtn("right")}
            >
              <Arrow dir="right" />
            </button>
          )}
        </div>

        {/* action bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "11px 14px 4px",
            color: "#262626",
          }}
        >
          <HeartIcon />
          <CommentIcon />
          <ShareIcon />
          {/* dots */}
          <div
            style={{
              display: "flex",
              gap: 5,
              margin: "0 auto",
            }}
          >
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setI(idx)}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  cursor: "pointer",
                  background: idx === i ? "#0095f6" : "#c7c7c7",
                  transition: "background 200ms",
                }}
              />
            ))}
          </div>
          <BookmarkIcon />
        </div>

        {/* likes + caption */}
        <div style={{ padding: "2px 14px 16px", color: "#262626" }}>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "4px 0 8px" }}>
            Liked by bookieboo and 2,431 others
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.45, margin: 0 }}>
            <span style={{ fontWeight: 600 }}>toxome</span>{" "}
            <span style={{ color: "#262626" }}>{CAPTION}</span>
          </p>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#8e8e8e",
              margin: "10px 0 0",
            }}
          >
            2 hours ago
          </p>
        </div>
      </div>

      <p
        style={{
          fontSize: 12.5,
          color: "#7c7c74",
          margin: "20px 0 0",
          textAlign: "center",
          maxWidth: 440,
          lineHeight: 1.5,
        }}
      >
        Tap the arrows or dots to move through the carousel. Slide 1 is the
        cotton-spray video with a text overlay.
      </p>
    </div>
  );
}

function navBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 10,
    transform: "translateY(-50%)",
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 1px 6px rgba(0,0,0,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  };
}

function HeartIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s-7.5-4.6-10-9.2C.5 8.6 2 5 5.3 5 7.4 5 8.8 6.2 12 9c3.2-2.8 4.6-4 6.7-4C22 5 23.5 8.6 22 11.8 19.5 16.4 12 21 12 21z"
        stroke="#262626"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"
        stroke="#262626"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 3L11 14M22 3l-7 19-4-8-8-4 19-7z"
        stroke="#262626"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      style={{ marginLeft: "auto" }}
    >
      <path
        d="M6 3h12v18l-6-4-6 4V3z"
        stroke="#262626"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
