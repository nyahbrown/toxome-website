import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

const APP_STORE = "https://apps.apple.com/us/app/toxome/id6748622034";

export const metadata: Metadata = {
  title: "How We Score: The Toxome Methodology | Toxome",
  description:
    "How Toxome scores clothing for what it does to your body. The five things we measure, how the 0–100 wearer-hazard number is built, and why a brand can never buy a better score.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    title: "How We Score",
    description:
      "How Toxome rates clothing for what it does to your body, and why a brand can never buy a better score.",
    url: "/methodology",
    siteName: "Toxome",
  },
};

export const revalidate = 86400;

const PILLARS = [
  {
    n: "01",
    name: "Microplastic load",
    group: "Body burden",
    body: "Synthetic fibers shed plastic that ends up inside you. Researchers have found microplastics in nearly 60% of artery plaques.",
  },
  {
    n: "02",
    name: "Hormone safety",
    group: "Body burden",
    body: "Endocrine disruptors carried by synthetics and their processing: antimony, BPA in recycled polyester, phthalates in prints and coatings.",
  },
  {
    n: "03",
    name: "Chemical finishes",
    group: "Body burden",
    body: "What gets sprayed or bonded onto the fabric: PFAS for water and stain resistance, formaldehyde for wrinkle-free, flame retardants, antimicrobial treatments.",
  },
  {
    n: "04",
    name: "Dye & colorant safety",
    group: "Skin contact",
    body: "Azo dyes that can release carcinogenic amines, disperse dyes that trigger allergies, and heavy metals like chromium and lead.",
  },
  {
    n: "05",
    name: "Skin & breathability",
    group: "Skin contact",
    body: "Fabrics that trap heat and moisture against the skin, disrupting the microbiome and provoking irritation.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "The fiber sets the baseline",
    body: "Organic cotton starts low. Recycled polyester starts high. What your clothes are made of does most of the work.",
  },
  {
    n: "02",
    title: "Treatments add risk",
    body: "A water-resistant finish or a synthetic dye raises the score, because each one puts something real against your skin.",
  },
  {
    n: "03",
    title: "Certifications earn it back",
    body: "Credible marks like OEKO-TEX and GOTS bring the score down, because they prove the risk was tested for and limited.",
  },
  {
    n: "04",
    title: "A red flag caps it",
    body: "If a banned or carcinogenic chemical is confirmed in the garment, the score is held in the high band, whatever else is going on.",
  },
];

const RUNGS = [
  {
    n: "0",
    name: "Unverified",
    meta: "Today",
    body: "An algorithmic score built from the fibers, plus conservative estimates for anything a brand hasn't disclosed. Where most clothing sits today.",
  },
  {
    n: "1",
    name: "Brand-disclosed",
    meta: "Free",
    body: "The brand submits its composition, finishes, dye class, and certifications. Estimates get replaced by facts, and the score can move up or down.",
  },
  {
    n: "2",
    name: "Verified documents",
    meta: "Free",
    body: "The brand sends OEKO-TEX, GOTS, or lab reports, and we check them. The score moves up or down on real evidence.",
  },
];

export default async function MethodologyPage() {
  const taxonomy = await getShopTaxonomy();

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav taxonomy={taxonomy} />

      {/* Hero */}
      <header className="shell" style={{ paddingTop: 132 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 20px" }}>
            Methodology
          </p>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(34px, 5vw, 58px)",
              lineHeight: 1.06,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              margin: "0 0 22px",
            }}
          >
            How we score.
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--ink-2)",
              margin: "0 auto",
              maxWidth: 600,
            }}
          >
            Every garment on Toxome carries one number, from 0 to 100. Lower is
            better. It answers one question: what is this piece doing to your
            body? We build it the same way for every brand, whether or not they
            ask us to.
          </p>
          <BandScale />
        </div>
      </header>

      {/* The principle */}
      <Section eyebrow="The principle" title="The number is about your body.">
        <Prose>
          A piece of clothing can harm the planet, the people who made it, and
          the person who wears it. Those are three separate questions, and the
          Toxome score answers the last one. Microplastic pollution, water use,
          and labor conditions matter, and we report on them, but they never move
          the number. The number is about <em>your body</em>, so it stays about
          your body.
        </Prose>
      </Section>

      {/* Five pillars */}
      <Section
        eyebrow="What we measure"
        title="The five things the score tracks."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "36px 40px",
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          {PILLARS.map((p) => (
            <div key={p.n}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 10,
                  margin: "0 0 12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "var(--ink-3)",
                  }}
                >
                  {p.n}
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--ink-3)",
                  }}
                >
                  {p.group}
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "var(--sans)",
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  margin: "0 0 8px",
                }}
              >
                {p.name}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            maxWidth: 600,
            margin: "44px auto 0",
            textAlign: "center",
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--ink-2)",
          }}
        >
          The first three are <em>body burden</em>: they get into you. The last
          two are <em>skin contact</em>: they touch you.
        </p>
      </Section>

      {/* How the number is built */}
      <Section eyebrow="How it works" title="How the number is built.">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32,
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          {STEPS.map((s) => (
            <div key={s.n}>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "var(--ink-3)",
                  margin: "0 0 14px",
                }}
              >
                {s.n}
              </p>
              <h3
                style={{
                  fontFamily: "var(--sans)",
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  margin: "0 0 8px",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            maxWidth: 600,
            margin: "44px auto 0",
            textAlign: "center",
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--ink-2)",
          }}
        >
          A composition label alone gives a real, defensible score. The more we
          know, a care label, the product page, a certificate, the sharper it
          gets.
        </p>
      </Section>

      {/* Firewall */}
      <section className="shell" style={{ paddingTop: 110 }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            background: "var(--white)",
            border: "1px solid var(--hairline)",
            borderRadius: 22,
            padding: "40px 40px 42px",
            boxShadow: "0 22px 56px -30px rgba(59,60,58,0.24)",
          }}
        >
          <p className="eyebrow" style={{ margin: "0 0 14px" }}>
            The firewall
          </p>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(24px, 3vw, 32px)",
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 0 16px",
            }}
          >
            Can a brand pay for a better score? No.
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.62,
              color: "var(--ink-2)",
              margin: 0,
              maxWidth: 600,
            }}
          >
            This is the line that makes the score worth trusting. Disclosure and
            verification buy a brand <em>accuracy</em>, never points. The math is
            identical for every brand, and a verified score can go down as easily
            as up. The methodology is public, on this page. A brand can show us
            exactly what is in its clothes and have the score reflect it. It can{" "}
            <em>never buy a better number</em>.
          </p>
        </div>
      </section>

      {/* Verification ladder */}
      <Section
        eyebrow="Verification"
        title="The verification ladder."
        intro="When a brand stays quiet about its dyes, finishes, or treatments, the score fills the gap with conservative, category-based estimates. That estimate reflects the genuine risk of an unknown, not a penalty for staying quiet. A brand can move off it two ways: tell us the truth, or prove it. Both are free."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32,
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          {RUNGS.map((r) => (
            <div key={r.n}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 10,
                  margin: "0 0 12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: "var(--ink-3)",
                  }}
                >
                  {r.n}
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--ink-3)",
                  }}
                >
                  {r.meta}
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "var(--sans)",
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  margin: "0 0 8px",
                }}
              >
                {r.name}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {r.body}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            maxWidth: 600,
            margin: "44px auto 0",
            textAlign: "center",
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--ink-2)",
          }}
        >
          Every rung changes how sure we are. None of them changes which way the
          score is allowed to move.
        </p>
      </Section>

      {/* Closing CTA */}
      <section
        className="shell"
        style={{ paddingTop: 110, paddingBottom: 130 }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(24px, 3vw, 34px)",
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 0 28px",
            }}
          >
            See it on your own clothes.
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <a
              href={APP_STORE}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download Toxome on the App Store"
              style={{ display: "inline-flex" }}
            >
              <Image
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                width={150}
                height={50}
                style={{ display: "block", height: 50, width: "auto" }}
              />
            </a>
            <Link href="/guide" className="pill-cta ghost">
              Browse the fabric guide
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// A centered editorial section: eyebrow + headline + optional intro, matching
// the /app page rhythm (shell wrapper, 110px top padding, 720-wide header).
function Section({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="shell" style={{ paddingTop: 110 }}>
      <div style={{ maxWidth: 720, margin: "0 auto 48px", textAlign: "center" }}>
        <p className="eyebrow" style={{ margin: "0 0 16px" }}>
          {eyebrow}
        </p>
        <h2
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 500,
            fontSize: "clamp(26px, 3.2vw, 38px)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {intro && (
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              margin: "20px auto 0",
              maxWidth: 600,
            }}
          >
            {intro}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

// Centered reading block for the short prose sections.
function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        maxWidth: 640,
        margin: "0 auto",
        fontSize: 17,
        lineHeight: 1.62,
        color: "var(--ink-2)",
        textAlign: "center",
      }}
    >
      {children}
    </p>
  );
}

// The 0–100 scale, shown as the three bands so the hero number reads at a
// glance. Uses the scan-result risk palette, which is the one place those
// colors belong, because this is literally about the score.
function BandScale() {
  const bands = [
    { label: "low", range: "0–36", color: "var(--risk-low)" },
    { label: "moderate", range: "37–60", color: "var(--orange)" },
    { label: "high", range: "61–100", color: "var(--red)" },
  ];
  return (
    <div style={{ maxWidth: 420, margin: "40px auto 0" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {bands.map((b) => (
          <div key={b.label} style={{ flex: 1, textAlign: "left" }}>
            <div
              style={{ height: 6, borderRadius: 999, background: b.color }}
            />
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink)",
                  letterSpacing: "-0.005em",
                }}
              >
                {b.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  color: "var(--ink-3)",
                }}
              >
                {b.range}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
