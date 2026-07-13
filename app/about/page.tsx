import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

const APP_STORE = "https://apps.apple.com/us/app/toxome/id6748622034";

export const metadata: Metadata = {
  title: "About Toxome | Fashion Wellness",
  description:
    "Toxome scores clothing for what it does to your body. Why we started, what we make, how we make money, and why a brand can never buy a better score.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Toxome",
    description:
      "What you wear is a health decision. Why we started, and why a brand can never buy a better score.",
    url: "/about",
    siteName: "Toxome",
  },
};

export const revalidate = 86400;

const WORK = [
  {
    n: "01",
    name: "The Standard",
    body: "One number, 0 to 100, for what a garment is doing to your body. Built the same way for every brand, whether or not they ask us to.",
    href: "/methodology",
    cta: "How we score",
  },
  {
    n: "02",
    name: "The Shop",
    body: "Hundreds of pieces, each one scored before it was listed. If it does not clear the bar, it does not go in, however much we like the brand.",
    href: "/shop",
    cta: "Shop the edit",
  },
  {
    n: "03",
    name: "The Journal",
    body: "Fabric, chemistry, and health, written to be read. Polyester over eight hours against skin. The certifications that mean something, and the ones that are decoration.",
    href: "/journal",
    cta: "Read the Journal",
  },
  {
    n: "04",
    name: "The scanner",
    body: "Photograph a care label in a store and get the score before you buy it. On iPhone, and in your browser while you shop.",
    href: "/app",
    cta: "Get the app",
  },
];

export default async function AboutPage() {
  const taxonomy = await getShopTaxonomy();

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav taxonomy={taxonomy} />

      {/* Hero */}
      <header className="shell" style={{ paddingTop: 132 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 20px" }}>
            About
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
            What you wear is a health decision.
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--ink-2)",
              margin: "0 auto",
              maxWidth: 620,
            }}
          >
            About 60% of the clothing made today is plastic, and nobody tells you
            which 60%. Toxome reads the label, scores what is in it, and points
            you at the pieces worth buying.
          </p>
        </div>
      </header>

      {/* The reason */}
      <Section eyebrow="Why we exist" title="It started with a diagnosis.">
        <Prose>
          Nyah Brown started Toxome after a PCOS and endometriosis diagnosis.
          Both are hormone conditions, and both sent her down the same road: fix
          the food, fix the skincare, read every ingredient list in the house.
        </Prose>
        <Prose>
          It worked, until she reached the one category that has no ingredient
          list at all. Your clothes sit against your skin for sixteen hours a
          day. Clothing is the largest surface of contact in your life and the
          least examined one, so we started examining it.
        </Prose>
        <Prose>
          Toxome does not diagnose or treat anything, and it never will. It tells
          you what is in the fabric, and what the research says that fabric does,
          so you can decide <em>what you want touching you</em>.
        </Prose>
      </Section>

      {/* What we make */}
      <Section eyebrow="What we make" title="Four things, one question.">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "36px 40px",
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          {WORK.map((w) => (
            <div key={w.n}>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "var(--ink-3)",
                  display: "block",
                  margin: "0 0 12px",
                }}
              >
                {w.n}
              </span>
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
                {w.name}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: "0 0 12px",
                }}
              >
                {w.body}
              </p>
              <Link
                href={w.href}
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--ink)",
                  borderBottom: "1px solid var(--hairline-strong)",
                  paddingBottom: 2,
                }}
              >
                {w.cta}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* The firewall */}
      <Section
        eyebrow="How we make money"
        title="A brand can never buy a better score."
      >
        <Prose>
          Toxome earns in three ways. We take a commission when you buy through
          our links, at no extra cost to you. We charge for a paid tier in the
          app. And we work with brands on features and partnerships.
        </Prose>
        <Prose>
          One rule governs all three, and it is not negotiable. Every product is
          scored <em>before</em> any commercial conversation happens, by the same
          method, whether the brand has heard of us or not. A score is not for
          sale. A placement does not move a number. If a brand asks us for a
          better one, the answer is no, and we will probably write about it.
        </Prose>
        <Prose>
          The moment a brand can buy the number, it is worth nothing, and so are
          we.
        </Prose>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            href="/methodology"
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "var(--ink)",
              borderBottom: "1px solid var(--hairline-strong)",
              paddingBottom: 2,
            }}
          >
            Read the methodology
          </Link>
        </div>
      </Section>

      {/* Close */}
      <Section eyebrow="The point" title="Know what’s in your clothes.">
        <Prose>
          Cotton, linen, hemp, wool. Four fibers that have been against human
          skin for ten thousand years. Everything else is an experiment, and you
          were enrolled in it without being asked. Toxome is how you read the
          fine print.
        </Prose>
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 34,
          }}
        >
          <Link
            href="/shop"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--cream)",
              background: "var(--ink)",
              padding: "13px 26px",
              borderRadius: 999,
            }}
          >
            Shop the edit
          </Link>
          <a
            href={APP_STORE}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ink)",
              border: "1px solid var(--hairline-strong)",
              padding: "13px 26px",
              borderRadius: 999,
            }}
          >
            Scan your closet
          </a>
        </div>
      </Section>

      <div style={{ height: 120 }} />
      <Footer />
    </main>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
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
      </div>
      {children}
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        maxWidth: 640,
        margin: "0 auto 20px",
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
