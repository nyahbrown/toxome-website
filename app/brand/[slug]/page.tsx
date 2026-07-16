import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getShopTaxonomy } from "@/lib/supabase";
import { getBrandData, getBrandSlugs, type BrandData } from "@/lib/brands";

const BASE_URL = "https://toxome.app";

// Regenerate hourly so newly scored products shift a brand's verdict without a
// full redeploy.
export const revalidate = 604800; // weekly backstop; on-demand revalidation keeps it fresh on change

// Pre-render every brand that clears the scored-product guardrail at build time.
export async function generateStaticParams() {
  const slugs = await getBrandSlugs();
  return slugs.map((slug) => ({ slug }));
}

// One human sentence summarising the verdict, reused in the meta description,
// the on-page answer, and the FAQ schema so all three stay in sync.
function verdictSentence(b: BrandData): string {
  const band = b.band ?? "moderate";
  const label =
    band === "low"
      ? "which lands in the mostly-clean range for fiber safety"
      : band === "moderate"
        ? "which is a mixed bag for fiber safety"
        : "which is high-risk for fiber safety";
  return `Across the ${b.scoredCount} ${b.brand} pieces we've scored, the brand averages a Toxome score of ${b.avgScore} out of 100, ${label}.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBrandData(slug);
  if (!b) return { title: "Brand not found | Toxome" };

  return {
    title: `Is ${b.brand} Non-Toxic? Fiber Scores & Safety | Toxome`,
    description: verdictSentence(b),
    alternates: { canonical: `/brand/${b.slug}` },
    openGraph: {
      title: `Is ${b.brand} Non-Toxic? The Toxome Verdict`,
      description: verdictSentence(b),
      url: `/brand/${b.slug}`,
    },
  };
}

// Higher score = cleaner = greener. Mirrors the app's inverted scale.
function bandColor(band: BrandData["band"]): string {
  if (band === "low") return "#7B9B69";
  if (band === "moderate") return "var(--orange)";
  if (band === "high") return "var(--red)";
  return "var(--ink-3)";
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [b, taxonomy] = await Promise.all([
    getBrandData(slug),
    getShopTaxonomy(),
  ]);
  if (!b) notFound();

  const verdict = verdictSentence(b);

  // FAQPage answers the exact query the page targets; BreadcrumbList gives the
  // Home › Brands › [Brand] trail. Same pattern as the journal + product pages.
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Is ${b.brand} non-toxic?`,
            acceptedAnswer: { "@type": "Answer", text: verdict },
          },
          {
            "@type": "Question",
            name: `What fabrics does ${b.brand} use?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: b.topFibers.length
                ? `${b.brand} leans on ${b.topFibers
                    .map((f) => `${f.fiber} (${Math.round(f.share * 100)}%)`)
                    .join(", ")} across the pieces Toxome has scored.`
                : `Toxome has scored ${b.scoredCount} ${b.brand} pieces.`,
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Brands", item: `${BASE_URL}/brand` },
          {
            "@type": "ListItem",
            position: 3,
            name: b.brand,
            item: `${BASE_URL}/brand/${b.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <JsonLd data={schema} />

      <main className="shell" style={{ padding: "120px 21px 80px" }}>
        {/* Hero — verdict at a glance */}
        <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14 }}>
          Brand Report
        </div>
        <h1
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            fontSize: "clamp(38px, 6vw, 64px)",
            lineHeight: 1.05,
            color: "var(--ink)",
            margin: "0 0 24px",
            maxWidth: 720,
          }}
        >
          is {b.brand} non-toxic?
        </h1>

        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 20 }}>
          <span
            style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: bandColor(b.band),
              lineHeight: 1,
            }}
          >
            {b.avgScore ?? "—"}
          </span>
          <span style={{ fontSize: 16, color: "var(--ink-2)" }}>
            average toxome score across {b.scoredCount} scored pieces
          </span>
        </div>

        <p style={{ fontSize: 18, lineHeight: 1.5, color: "var(--ink)", maxWidth: 640, margin: "0 0 56px" }}>
          {verdict}
        </p>

        {/* What the brand is made of */}
        {b.topFibers.length > 0 && (
          <section style={{ marginBottom: 56, maxWidth: 560 }}>
            <div className="eyebrow" style={{ color: "var(--ink-2)", marginBottom: 18 }}>
              what {b.brand} is made of
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {b.topFibers.map((f) => (
                <div key={f.fiber}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--ink-2)", marginBottom: 5 }}>
                    <span>{f.fiber}</span>
                    <span>{Math.round(f.share * 100)}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--tan)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${Math.round(f.share * 100)}%`, height: "100%", background: "var(--ink-2)" }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cleanest picks */}
        {b.cleanest.length > 0 && (
          <BrandGrid title={`the cleanest ${b.brand} we've found`} products={b.cleanest} />
        )}

        {/* What to skip — only when genuinely high-risk pieces exist */}
        {b.toAvoid.length > 0 && (
          <BrandGrid title="what to skip" products={b.toAvoid} />
        )}

        {/* Cleaner alternatives CTA */}
        <section style={{ margin: "64px 0 0", padding: "40px", background: "var(--white)", borderRadius: 14 }}>
          <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 10 }}>
            keep shopping clean
          </div>
          <p style={{ fontSize: 18, color: "var(--ink)", margin: "0 0 20px", maxWidth: 520 }}>
            see every brand we&rsquo;ve scored, ranked by what they do to your body.
          </p>
          <Link
            href="/shop"
            style={{
              display: "inline-block",
              background: "var(--ink)",
              color: "var(--cream)",
              padding: "12px 22px",
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            shop cleaner alternatives
          </Link>
        </section>

        {/* Methodology + affiliate disclosure */}
        <p style={{ fontSize: 11, lineHeight: 1.6, color: "var(--ink-3)", margin: "40px 0 0", maxWidth: 640 }}>
          scores reflect the {b.scoredCount} {b.brand} pieces toxome has read and rated by fiber
          content; they are not a verdict on the whole catalog and update as we score more. some
          links are affiliate links. if you buy through them toxome may earn a commission at no
          extra cost to you, and it never changes a product&rsquo;s score.
        </p>
      </main>

      <Footer />
    </>
  );
}

// Reusable product rail for the cleanest / skip sections.
function BrandGrid({ title, products }: { title: string; products: BrandData["cleanest"] }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div className="eyebrow" style={{ color: "var(--ink-2)", marginBottom: 18 }}>
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 18,
        }}
      >
        {products.map((p) => (
          <Link key={p.id} href={`/shop/${p.id}`} style={{ display: "block" }}>
            <div style={{ aspectRatio: "3/4", background: "var(--tan)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
              {p.item_image && (
                // Plain <img> like the shop grid: product images come from
                // arbitrary brand CDNs that aren't whitelisted for next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.item_image}
                  alt={p.item_name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.3 }}>{p.item_name}</div>
            {typeof p.toxome_score === "number" && (
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                score {p.toxome_score}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
