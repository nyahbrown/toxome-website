import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";
import {
  fibersByBand,
  BAND_META,
  KIND_LABEL,
  type GuideFiber,
} from "@/lib/fiberGuide";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Toxome | Fabric Guide",
  description:
    "A plain-spoken guide to what your clothes are made of and how each fiber affects your health. Every fiber, scored, sourced, and ranked from safest to avoid.",
};

function teaser(text: string): string {
  const clean = text.replace(/\*/g, "");
  const firstSentence = clean.split(/\.\s/)[0];
  const base = firstSentence.length > 116 ? clean.slice(0, 116) : firstSentence;
  return base.replace(/[.,;:\s]+$/, "") + ".";
}

function FiberCard({ fiber }: { fiber: GuideFiber }) {
  return (
    <Link
      href={`/guide/${fiber.slug}`}
      className="guide-card"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          {KIND_LABEL[fiber.kind]}
        </span>
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 999,
            border: `2px solid ${fiber.color}`,
            fontFamily: "var(--sans)",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          {fiber.score}
        </span>
      </div>
      <h3
        style={{
          fontFamily: "var(--serif)",
          fontSize: 23,
          fontWeight: 500,
          lineHeight: 1.15,
          letterSpacing: "-0.015em",
          color: "var(--ink)",
          margin: "0 0 8px",
        }}
      >
        {fiber.name}
      </h3>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
          color: "var(--ink-2)",
          margin: 0,
        }}
      >
        {teaser(fiber.whatItIs)}
      </p>
    </Link>
  );
}

export default async function GuidePage() {
  const taxonomy = await getShopTaxonomy();
  const groups = fibersByBand();

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
          style={{ textAlign: "center", paddingTop: 56, paddingBottom: 12 }}
        >
          <div
            className="eyebrow"
            style={{ color: "var(--ink-3)", marginBottom: 22 }}
          >
            The fabric guide
          </div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(28px, 4vw, 46px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 auto 20px",
              maxWidth: 640,
            }}
          >
            Know what touches your skin all day.
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              margin: "0 auto",
              maxWidth: 560,
            }}
          >
            Every fiber, scored from <em>0 (clean)</em> to <em>100 (high
            concern)</em> on what it means for your health, not the planet alone.
            The fiber is rarely the whole story. The dyes and finishes are. Start
            here.
          </p>
        </div>

        {/* Bands */}
        <div className="shell" style={{ paddingTop: 40 }}>
          {groups.map(({ band, fibers }) => {
            const meta = BAND_META[band];
            return (
              <section key={band} style={{ marginBottom: 64 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    flexWrap: "wrap",
                    paddingBottom: 8,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background:
                        band === "low"
                          ? "var(--risk-low)"
                          : band === "moderate"
                          ? "var(--orange)"
                          : "var(--red)",
                      display: "inline-block",
                      transform: "translateY(-1px)",
                    }}
                  />
                  <h2
                    style={{
                      fontFamily: "var(--serif)",
                      fontWeight: 400,
                      fontSize: "clamp(22px, 2.6vw, 30px)",
                      letterSpacing: "-0.018em",
                      color: "var(--ink)",
                      margin: 0,
                    }}
                  >
                    {meta.label}
                  </h2>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      letterSpacing: ".08em",
                      color: "var(--ink-3)",
                    }}
                  >
                    Score {meta.rangeLabel}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: "var(--ink-2)",
                    margin: "0 0 24px",
                    maxWidth: 640,
                  }}
                >
                  {meta.blurb}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 16,
                  }}
                >
                  {fibers.map((f) => (
                    <FiberCard key={f.slug} fiber={f} />
                  ))}
                </div>
              </section>
            );
          })}

          <p
            style={{
              marginTop: 16,
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
            medical advice.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
