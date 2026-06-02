import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import RichText from "@/components/RichText";
import JsonLd from "@/components/JsonLd";
import { getShopTaxonomy } from "@/lib/supabase";
import {
  getFiber,
  allFiberSlugs,
  FIBER_GUIDE,
  withScore,
  KIND_LABEL,
  type FiberBand,
  type GuideFiber,
} from "@/lib/fiberGuide";

export const revalidate = 86400;

const SITE = "https://toxome.app";

// Strip the *emphasis* asterisks from editorial prose for plain-text schema.
const plain = (s: string) => s.replace(/\*/g, "").trim();

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
  const title = `Toxome | ${fiber.name}`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/guide/${slug}` },
    openGraph: { title, description: desc, url: `/guide/${slug}` },
  };
}

const BAND_LABEL: Record<FiberBand, string> = {
  low: "Low concern",
  moderate: "Moderate concern",
  high: "High concern",
};

function Section({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="guide-detail-card">
      <div
        className="eyebrow"
        style={{ color: "var(--ink-3)", marginBottom: 12 }}
      >
        {heading}
      </div>
      <p className="guide-detail-card__body">
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

  // Up to 4 cleaner sibling fibers (lowest score first) for internal linking.
  const related = FIBER_GUIDE.map(withScore)
    .filter((x) => x.slug !== f.slug)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  const pageUrl = `${SITE}/guide/${slug}`;
  const lower = f.name.toLowerCase();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Fabric Guide", item: `${SITE}/guide` },
          { "@type": "ListItem", position: 3, name: f.name, item: pageUrl },
        ],
      },
      {
        "@type": "Article",
        headline: `${f.name}: fiber safety and health score`,
        description: plain(f.whatItIs).slice(0, 200),
        about: f.name,
        inLanguage: "en",
        mainEntityOfPage: pageUrl,
        author: { "@type": "Organization", name: "Toxome", url: SITE },
        publisher: {
          "@type": "Organization",
          name: "Toxome",
          url: SITE,
          logo: { "@type": "ImageObject", url: `${SITE}/icon.png` },
        },
        citation: f.sources.map((s) => ({
          "@type": "CreativeWork",
          name: s.title,
          url: s.url,
        })),
      },
      {
        // Answers are the section prose rendered visibly below.
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Is ${lower} safe to wear?`,
            acceptedAnswer: { "@type": "Answer", text: plain(f.healthStory) },
          },
          {
            "@type": "Question",
            name: `What should you look for when buying ${lower}?`,
            acceptedAnswer: { "@type": "Answer", text: plain(f.whatToLookFor) },
          },
          {
            "@type": "Question",
            name: `Is ${lower} better for the environment?`,
            acceptedAnswer: { "@type": "Answer", text: plain(f.environment) },
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
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
                fontFamily: "var(--sans)",
                fontWeight: 500,
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
          <div className="guide-detail-grid">
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

          {/* Related fibers — internal linking + crawl paths */}
          {related.length > 0 && (
            <div
              style={{
                marginTop: 40,
                paddingTop: 24,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  marginBottom: 14,
                }}
              >
                Related fibers
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/guide/${r.slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: "1px solid var(--hairline-strong)",
                      fontSize: 13,
                      color: "var(--ink-2)",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: r.color,
                      }}
                    />
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
