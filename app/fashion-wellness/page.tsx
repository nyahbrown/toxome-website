import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "What Is Fashion Wellness? | Toxome",
  description:
    "Fashion Wellness is the practice of choosing clothing by what it does to your body, not just how it looks. Toxome coined the category and scores garments for endocrine disruptors, PFAS, and microplastics.",
  keywords: [
    "fashion wellness",
    "what is fashion wellness",
    "non-toxic clothing",
    "non-toxic fashion",
    "endocrine disruptors in textiles",
    "PFAS in clothing",
    "microplastics in fabric",
  ],
  alternates: { canonical: "/fashion-wellness" },
  openGraph: {
    type: "article",
    title: "What Is Fashion Wellness?",
    description:
      "Fashion Wellness is the practice of choosing clothing by what it does to your body, not just how it looks. Toxome coined the category and scores garments for endocrine disruptors, PFAS, and microplastics.",
    url: "/fashion-wellness",
    siteName: "Toxome",
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is Fashion Wellness?",
    description:
      "Fashion Wellness is the practice of choosing clothing by what it does to your body, not just how it looks. Toxome coined the category and scores garments for endocrine disruptors, PFAS, and microplastics.",
  },
};

export const revalidate = 86400;

// The four exposures Fashion Wellness measures. Colons, never dashes, per the
// standing brand rule.
const MEASURES = [
  {
    term: "Endocrine disruptors",
    body: "hormone-active chemicals such as BPA and phthalates found in many synthetic fabrics.",
  },
  {
    term: "PFAS",
    body: "the forever chemicals used in water and stain resistant finishes.",
  },
  {
    term: "Microplastics",
    body: "shed by polyester, nylon, and other plastic-based fibers.",
  },
  {
    term: "Finishing chemicals",
    body: "the dyes, softeners, and treatments applied to the fabric.",
  },
];

// The proprietary vocabulary of the category, its definition list.
const GLOSSARY = [
  {
    term: "Toxome Score",
    body: "the measure of a garment's safety.",
  },
  {
    term: "Fabric Fingerprint",
    body: "a garment's full fiber and chemical profile.",
  },
  {
    term: "Endocrine Load",
    body: "the cumulative hormone-disrupting exposure from what you wear.",
  },
  {
    term: "Closet Detox",
    body: "the practice of auditing your wardrobe for what it is made of.",
  },
];

const definedTermSchema = {
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  name: "Fashion Wellness",
  description:
    "Fashion Wellness is the practice of choosing clothing by what it does to your body, not just how it looks or what it costs. It treats clothing as a health decision, evaluating garments for endocrine disruptors, PFAS, microplastics, and finishing chemicals.",
  url: "https://toxome.app/fashion-wellness",
  inDefinedTermSet: {
    "@type": "DefinedTermSet",
    name: "The Toxome Glossary",
    url: "https://toxome.app/fashion-wellness",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Fashion Wellness?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fashion Wellness is the practice of choosing clothing by what it does to your body, not just how it looks or what it costs. It treats the clothes on your skin all day as a health decision.",
      },
    },
    {
      "@type": "Question",
      name: "Who created the term Fashion Wellness?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Toxome coined Fashion Wellness to name the shift toward treating clothing as a health decision. Toxome is the curated directory and scoring standard for the category.",
      },
    },
    {
      "@type": "Question",
      name: "What does Fashion Wellness measure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It evaluates clothing for endocrine disruptors, PFAS, microplastics, and synthetic finishing chemicals, the exposures that come from the fabric against your skin.",
      },
    },
  ],
};

export default async function FashionWellnessPage() {
  const taxonomy = await getShopTaxonomy();

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <JsonLd data={definedTermSchema} />
      <JsonLd data={faqSchema} />
      <Nav taxonomy={taxonomy} />

      {/* Hero + the definition, made prominent because it is the definition */}
      <header className="shell" style={{ paddingTop: 132 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 20px" }}>
            The category
          </p>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 600,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 0 28px",
            }}
          >
            Fashion Wellness
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(20px, 2.6vw, 28px)",
              lineHeight: 1.4,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
              margin: "0 auto",
              maxWidth: 660,
            }}
          >
            Fashion Wellness is the practice of choosing clothing by what it does
            to your body, not just how it looks or what it costs. It treats the
            clothes on your skin all day as a health decision.
          </p>
        </div>
      </header>

      {/* The third question */}
      <Section eyebrow="The third question" title="A question we never asked.">
        <Prose>
          For most of fashion&rsquo;s history we judged clothes on two questions:
          do they look good, and can I afford them? Fashion Wellness adds a third.
          What is this doing to my body? The fabric against your skin can carry
          hormone-active chemicals, and unlike the food you eat, none of it is
          labeled.
        </Prose>
      </Section>

      {/* The shift that created it */}
      <Section eyebrow="The shift that created it" title="First food, then beauty, now clothing.">
        <Prose>
          First we learned to read our food. Nutrition labels made ingredients
          legible and clean eating became normal. Then we learned to read our
          skincare, and Clean Beauty went from a fringe worry to a default aisle.
          Clothing is next, and for women&rsquo;s health it may be the biggest
          shift of all. Fashion Wellness is that correction.
        </Prose>
      </Section>

      {/* What Fashion Wellness measures */}
      <Section
        eyebrow="What Fashion Wellness measures"
        title="Four exposures, all from the fabric."
      >
        <dl
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "grid",
            gap: 22,
          }}
        >
          {MEASURES.map((m) => (
            <div key={m.term}>
              <dt
                style={{
                  fontFamily: "var(--sans)",
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  margin: "0 0 4px",
                }}
              >
                {m.term}
              </dt>
              <dd
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {m.body}
              </dd>
            </div>
          ))}
        </dl>
        <p
          style={{
            maxWidth: 600,
            margin: "40px auto 0",
            textAlign: "center",
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--ink-2)",
          }}
        >
          Every one of these feeds a single number, the Toxome Score. The full{" "}
          <Link
            href="/methodology"
            style={{
              color: "var(--ink)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              textDecorationColor: "var(--hairline-strong)",
            }}
          >
            methodology
          </Link>{" "}
          explains how it is built.
        </p>
      </Section>

      {/* The language of Fashion Wellness */}
      <Section
        eyebrow="The language of Fashion Wellness"
        title="The vocabulary of the category."
      >
        <dl
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "grid",
            gap: 22,
          }}
        >
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt
                style={{
                  fontFamily: "var(--sans)",
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  margin: "0 0 4px",
                }}
              >
                {g.term}
              </dt>
              <dd
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {g.body}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Where the term comes from */}
      <Section eyebrow="Where the term comes from" title="Toxome coined it.">
        <Prose>
          Toxome coined Fashion Wellness to name a shift already underway in
          women&rsquo;s health. Toxome is the curated directory and scoring
          standard for the category, built by a founder who went looking for these
          answers about her own body and could not find them. Everything Toxome
          publishes is framed as reducing exposure, never treating or curing.
        </Prose>
      </Section>

      {/* Closing CTAs + the tagline */}
      <section
        className="shell"
        style={{ paddingTop: 110, paddingBottom: 130 }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Link
              href="/journal/fashion-wellness-next-clean-beauty"
              className="pill-cta"
            >
              Read the manifesto: Fashion Wellness Is the Next Clean Beauty
            </Link>
            <Link href="/shop" className="pill-cta ghost">
              Browse the directory
            </Link>
          </div>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(20px, 2.6vw, 26px)",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              color: "var(--ink)",
              margin: "56px 0 0",
            }}
          >
            know what&rsquo;s in your clothes.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// A centered editorial section: eyebrow + headline + optional intro, matching
// the /methodology rhythm (shell wrapper, 110px top padding, 720-wide header).
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
      <div style={{ maxWidth: 720, margin: "0 auto 40px", textAlign: "center" }}>
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
