import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import RichText from "@/components/RichText";
import { getShopTaxonomy } from "@/lib/supabase";
import {
  getFiber,
  allFiberSlugs,
  KIND_LABEL,
  type FiberBand,
  type GuideFiber,
} from "@/lib/fiberGuide";

export const revalidate = 86400;

export function generateStaticParams() {
  return allFiberSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fiber = getFiber(slug);
  if (!fiber) return { title: "Toxome | Fabric Guide" };
  const desc = fiber.whatItIs.replace(/\*/g, "").slice(0, 155);
  return {
    title: `Toxome | ${fiber.name}`,
    description: desc,
  };
}

const BAND_LABEL: Record<FiberBand, string> = {
  low: "Low concern",
  moderate: "Moderate concern",
  high: "High concern",
};

function Section({ heading, body }: { heading: string; body: string }) {
  return (
    <section style={{ padding: "28px 0", borderTop: "1px solid var(--hairline)" }}>
      <div
        className="eyebrow"
        style={{ color: "var(--ink-3)", marginBottom: 14 }}
      >
        {heading}
      </div>
      <p
        style={{
          fontSize: 17,
          lineHeight: 1.68,
          letterSpacing: "-0.006em",
          color: "var(--ink)",
          margin: 0,
        }}
      >
        <RichText text={body} />
      </p>
    </section>
  );
}

export default async function FiberGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fiber = getFiber(slug);
  if (!fiber) notFound();

  const [taxonomy] = await Promise.all([getShopTaxonomy()]);
  const f: GuideFiber = fiber;

  const cta = f.shopFilter
    ? {
        href: `/shop?fiber=${encodeURIComponent(f.shopFilter)}`,
        label: `Shop ${f.name.toLowerCase()}`,
        ghost: false,
      }
    : f.band === "low"
    ? { href: "/shop", label: "Browse the shop", ghost: true }
    : { href: "/shop", label: "Browse cleaner fibers", ghost: true };

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
        <article
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          {/* Breadcrumb */}
          <div style={{ paddingTop: 48, paddingBottom: 28 }}>
            <Link
              href="/guide"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                textDecoration: "none",
              }}
            >
              ← The fabric guide
            </Link>
          </div>

          {/* Header */}
          <header style={{ paddingBottom: 8 }}>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              {KIND_LABEL[f.kind]} fiber
            </span>
            <h1
              style={{
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontSize: "clamp(32px, 5vw, 48px)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                margin: "10px 0 24px",
              }}
            >
              {f.name}
            </h1>

            {/* Score + risk */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 60,
                  height: 60,
                  borderRadius: 999,
                  border: `2.5px solid ${f.color}`,
                  fontFamily: "var(--sans)",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--ink)",
                  flexShrink: 0,
                }}
              >
                {f.score}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 15,
                    fontWeight: 500,
                    color: f.color,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {BAND_LABEL[f.band]}
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: ".06em",
                    color: "var(--ink-3)",
                    marginTop: 3,
                  }}
                >
                  Health score {f.score} of 100 · lower is safer
                </div>
              </div>
            </div>

            {/* Shop CTA */}
            <Link
              href={cta.href}
              className={cta.ghost ? "pill-cta ghost" : "pill-cta"}
              style={{ justifyContent: "center", minWidth: 200 }}
            >
              {cta.label}
            </Link>
          </header>

          {/* Sections */}
          <div style={{ marginTop: 36 }}>
            <Section heading="What it is" body={f.whatItIs} />
            <Section heading="The health story" body={f.healthStory} />
            <Section heading="What to look for" body={f.whatToLookFor} />
            <Section heading="Environmental note" body={f.environment} />
          </div>

          {/* Sources, fine print */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: "1px solid var(--hairline)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 12,
              }}
            >
              Sources
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 18,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {f.sources.map((s) => (
                <li
                  key={s.url}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    lineHeight: 1.55,
                    letterSpacing: ".01em",
                    color: "var(--ink-3)",
                  }}
                >
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--ink-2)",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                  >
                    {s.title}
                  </a>
                  <span style={{ color: "var(--ink-3)" }}> · {s.publisher}</span>
                </li>
              ))}
            </ol>
            <p
              style={{
                marginTop: 18,
                fontSize: 11,
                lineHeight: 1.6,
                color: "var(--ink-3)",
                fontFamily: "var(--mono)",
                letterSpacing: ".02em",
              }}
            >
              The health score reflects wearer health only and mirrors the
              Toxome app. This guide is educational and is not medical advice.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
