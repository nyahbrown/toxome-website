import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";
import { FIBER_GUIDE, withScore, KIND_LABEL, type GuideFiber } from "@/lib/fiberGuide";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Fabric & Fiber Guide, Scored by Health | Toxome",
  description:
    "A plain-spoken guide to what your clothes are made of and how each fiber affects your health. Every fiber, scored, sourced, and ranked from safest to avoid.",
  alternates: { canonical: "/guide" },
};

// Which fibers have a real photo in /public/fibers (checked at build time so the
// tiles stay pure server-rendered CSS with no client-side onError fallback).
function availableImages(): Set<string> {
  try {
    const dir = path.join(process.cwd(), "public", "fibers", "guide");
    const set = new Set<string>();
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(.+)\.(jpg|jpeg|png|webp|avif)$/i);
      if (m) set.add(m[1].toLowerCase());
    }
    return set;
  } catch {
    return new Set();
  }
}

// One concise line for the hover reveal, the first sentence of the researched
// "what it is" copy, with emphasis asterisks stripped and length capped.
function teaser(text: string): string {
  const clean = text.replace(/\*/g, "").trim();
  let s = clean.split(/\.\s/)[0]; // first sentence
  if (s.length > 78) {
    // Prefer a clean cut at the first clause; otherwise truncate on a word.
    const comma = s.indexOf(", ");
    if (comma > 36 && comma <= 92) {
      s = s.slice(0, comma);
    } else {
      s = s.slice(0, 78);
      s = s.slice(0, s.lastIndexOf(" "));
    }
  }
  return s.replace(/[.,;:\s]+$/, "") + ".";
}

function ArrowIcon() {
  return (
    <svg width="36" height="8" viewBox="0 0 36 8" fill="none" aria-hidden="true">
      <path
        d="M0 4h33.5M30.5 1 34 4l-3.5 3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FiberTile({
  fiber,
  hasImage,
}: {
  fiber: GuideFiber;
  hasImage: boolean;
}) {
  return (
    <Link href={`/guide/${fiber.slug}`} className="fiber-tile">
      <div className="fiber-tile__media">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="fiber-tile__img"
            src={`/fibers/guide/${fiber.slug}.jpg`}
            alt={`${fiber.name} fabric`}
            loading="lazy"
          />
        ) : (
          <div className="fiber-tile__fallback" />
        )}
        <div className="fiber-tile__scrim" />
        <div className="fiber-tile__veil" />
      </div>
      <div className="fiber-tile__content">
        <div className="fiber-tile__top">
          <span className="fiber-tile__kind">{KIND_LABEL[fiber.kind]}</span>
          <span className="fiber-tile__score" style={{ color: fiber.color }}>
            <b>{fiber.score}</b>
          </span>
        </div>
        <div className="fiber-tile__namewrap">
          <h3 className="fiber-tile__name">{fiber.name}</h3>
        </div>
        <div className="fiber-tile__reveal">
          <p className="fiber-tile__desc">{fiber.summary || teaser(fiber.whatItIs)}</p>
          <span className="fiber-tile__arrow">
            <ArrowIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function GuidePage() {
  const taxonomy = await getShopTaxonomy();
  const images = availableImages();
  // Flat gallery, highest score (safest) first so the ranking is implied by position.
  const fibers = FIBER_GUIDE.map(withScore).sort((a, b) => b.score - a.score);

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <main
        style={{
          background: "var(--linen)",
          minHeight: "100vh",
          paddingTop: 64,
          paddingBottom: 120,
        }}
      >
        {/* Header */}
        <div
          className="shell"
          style={{ textAlign: "center", paddingTop: 56, paddingBottom: 36 }}
        >
          <div
            className="eyebrow"
            style={{ color: "var(--ink-3)", marginBottom: 22 }}
          >
            The fabric guide
          </div>
          <h1
            className="guide-index-h1"
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(22px, 4.4vw, 46px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 auto 20px",
            }}
          >
            Know what touches your skin all day.
          </h1>
          <style>{`
            .guide-index-h1 { white-space: nowrap; }
            @media (max-width: 430px) {
              .guide-index-h1 { white-space: normal; }
            }
          `}</style>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              margin: "0 auto 28px",
              maxWidth: 560,
            }}
          >
            Every fiber, scored from <em>0 (high concern)</em> to <em>100
            (clean)</em> on what it means for your health.
          </p>
        </div>

        {/* Flat gallery */}
        <div className="shell">
          <div className="guide-grid">
            {fibers.map((f) => (
              <FiberTile
                key={f.slug}
                fiber={f}
                hasImage={images.has(f.slug.toLowerCase())}
              />
            ))}
          </div>

          <p
            style={{
              marginTop: 40,
              fontSize: 11,
              color: "var(--ink-3)",
              fontFamily: "var(--mono)",
              letterSpacing: ".04em",
              lineHeight: 1.6,
              maxWidth: 720,
            }}
          >
            Scores reflect wearer health only and mirror the Toxome app. Each
            fiber page lists its sources. This guide is educational and is not
            medical advice. Fabric imagery via Unsplash and Pexels.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
