import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import RichText from "@/components/RichText";
import JsonLd from "@/components/JsonLd";
import { getShopTaxonomy } from "@/lib/supabase";
import { getFiber, type GuideFiber } from "@/lib/fiberGuide";
import { COMPARE_PAIRS, compareSlug, parseCompareSlug } from "@/lib/comparisons";

export const revalidate = 86400;

const SITE = "https://toxome.app";
const plain = (s: string) => s.replace(/\*/g, "").trim();

export function generateStaticParams() {
  return COMPARE_PAIRS.map(([a, b]) => ({ slug: compareSlug(a, b) }));
}

function resolve(slug: string): { a: GuideFiber; b: GuideFiber } | null {
  const parsed = parseCompareSlug(slug);
  if (!parsed) return null;
  const a = getFiber(parsed[0]);
  const b = getFiber(parsed[1]);
  if (!a || !b) return null;
  return { a, b };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) return { title: "Toxome | Compare fibers" };
  const title = `${r.a.name} vs ${r.b.name}: which is safer to wear?`;
  const description = `${r.a.name} scores ${r.a.score} and ${r.b.name} scores ${r.b.score} on the Toxome health scale. Here is how the two fibers compare for your skin and the planet.`;
  return {
    title: `Toxome | ${r.a.name} vs ${r.b.name}`,
    description,
    alternates: { canonical: `/compare/${slug}` },
    openGraph: { title, description, url: `/compare/${slug}` },
  };
}

function FiberColumn({ f }: { f: GuideFiber }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 260,
        border: "1px solid var(--hairline-strong)",
        borderRadius: 12,
        padding: "24px",
        background: "var(--white)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: 999,
            border: `2.5px solid ${f.color}`,
            fontFamily: "var(--sans)",
            fontSize: 19,
            fontWeight: 600,
            color: "var(--ink)",
            flexShrink: 0,
          }}
        >
          {f.score}
        </span>
        <div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: 24,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {f.name}
          </h2>
          <div style={{ fontSize: 13, color: f.color, marginTop: 2 }}>
            Health score {f.score} of 100
          </div>
        </div>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink)", margin: "0 0 16px" }}>
        <RichText text={f.healthStory} />
      </p>
      <Link
        href={`/guide/${f.slug}`}
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--ink-2)",
        }}
      >
        Full {f.name.toLowerCase()} guide →
      </Link>
    </div>
  );
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) notFound();
  const { a, b } = r;
  const taxonomy = await getShopTaxonomy();

  // Lower score = cleaner / safer for the wearer.
  const cleaner = a.score === b.score ? null : a.score < b.score ? a : b;
  const verdict =
    cleaner === null
      ? `${a.name} and ${b.name} score the same on the Toxome health scale, so neither is clearly safer. What matters most is the dyes and finishes on the specific garment.`
      : `${cleaner.name} is the cleaner choice. It scores ${cleaner.score} versus ${
          (cleaner === a ? b : a).name
        }'s ${(cleaner === a ? b : a).score} on the Toxome health scale, where lower is safer for your skin.`;

  const pageUrl = `${SITE}/compare/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Compare fibers", item: `${SITE}/compare` },
          { "@type": "ListItem", position: 3, name: `${a.name} vs ${b.name}`, item: pageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Is ${a.name.toLowerCase()} or ${b.name.toLowerCase()} safer to wear?`,
            acceptedAnswer: { "@type": "Answer", text: plain(verdict) },
          },
          {
            "@type": "Question",
            name: `What should you look for when buying ${a.name.toLowerCase()}?`,
            acceptedAnswer: { "@type": "Answer", text: plain(a.whatToLookFor) },
          },
          {
            "@type": "Question",
            name: `What should you look for when buying ${b.name.toLowerCase()}?`,
            acceptedAnswer: { "@type": "Answer", text: plain(b.whatToLookFor) },
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
      <Nav taxonomy={taxonomy} />
      <main style={{ background: "var(--linen)", minHeight: "100vh", paddingTop: 64, paddingBottom: 120 }}>
        <article style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ paddingTop: 48, paddingBottom: 24 }}>
            <Link
              href="/compare"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                textDecoration: "none",
              }}
            >
              ← Compare fibers
            </Link>
          </div>

          <h1
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(30px, 5vw, 46px)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 0 18px",
            }}
          >
            {a.name} vs {b.name}
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "var(--ink)",
              margin: "0 0 36px",
              maxWidth: 640,
            }}
          >
            {verdict}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 36 }}>
            <FiberColumn f={a} />
            <FiberColumn f={b} />
          </div>

          {/* Environmental note */}
          <section style={{ paddingTop: 24, borderTop: "1px solid var(--hairline)" }}>
            <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
              For the planet
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", margin: "0 0 10px" }}>
              <b>{a.name}.</b> <RichText text={a.environment} />
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink)", margin: 0 }}>
              <b>{b.name}.</b> <RichText text={b.environment} />
            </p>
          </section>

          <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/shop" className="pill-cta">
              Shop cleaner fibers
            </Link>
            <Link href="/guide" className="pill-cta ghost">
              See all fibers, scored
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
