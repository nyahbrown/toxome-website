import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";
import { getFiber } from "@/lib/fiberGuide";
import { COMPARE_PAIRS, compareSlug } from "@/lib/comparisons";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Toxome | Compare fibers",
  description:
    "Side-by-side fiber comparisons, scored for your health and the planet. See which fabric is safer against your skin before you buy.",
  alternates: { canonical: "/compare" },
};

export default async function CompareIndexPage() {
  const taxonomy = await getShopTaxonomy();
  const pairs = COMPARE_PAIRS.map(([a, b]) => {
    const fa = getFiber(a);
    const fb = getFiber(b);
    return fa && fb ? { slug: compareSlug(a, b), a: fa, b: fb } : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <main style={{ background: "var(--linen)", minHeight: "100vh", paddingTop: 64, paddingBottom: 120 }}>
        <div className="shell" style={{ textAlign: "center", paddingTop: 56, paddingBottom: 36 }}>
          <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 22 }}>
            Compare fibers
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
            Two fibers, side by side.
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
            Every comparison is scored on what each fiber does to your body and
            the planet, so you can choose the cleaner option with confidence.
          </p>
        </div>

        <div className="shell">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
              maxWidth: 920,
              margin: "0 auto",
            }}
          >
            {pairs.map(({ slug, a, b }) => (
              <Link
                key={slug}
                href={`/compare/${slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "20px 22px",
                  border: "1px solid var(--hairline-strong)",
                  borderRadius: 12,
                  background: "var(--white)",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 19,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {a.name} <span style={{ color: "var(--ink-3)" }}>vs</span> {b.name}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <i style={{ width: 9, height: 9, borderRadius: 999, background: a.color, display: "inline-block" }} />
                  <i style={{ width: 9, height: 9, borderRadius: 999, background: b.color, display: "inline-block" }} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
