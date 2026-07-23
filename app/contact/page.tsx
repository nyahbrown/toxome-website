import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

const EMAIL = "contact@toxome.app";
const PARTNERSHIPS_EMAIL = "partnerships@toxome.app";

export const metadata: Metadata = {
  title: "Contact Toxome",
  description:
    "Reach Toxome. Brand partnerships, getting your brand verified, press enquiries, affiliate and advertising, or a question about a score.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Toxome",
    description: "Partnerships, press, verification, and questions about a score.",
    url: "/contact",
    siteName: "Toxome",
  },
};

export const revalidate = 86400;

type Route = {
  n: string;
  name: string;
  body: string;
  subject: string;
  email?: string;
  link?: { href: string; label: string };
};

const ROUTES: Route[] = [
  {
    n: "01",
    name: "Brands & partnerships",
    body: "You make clothing we should be scoring, or you want to work with us on a feature, an edit, or a partnership. Tell us what you make and what it is made of.",
    subject: "Partnership",
    email: PARTNERSHIPS_EMAIL,
    link: { href: "/partnerships", label: "Partnerships" },
  },
  {
    n: "02",
    name: "Get verified",
    body: "You have chemical-safety documentation, an OEKO-TEX or GOTS certificate, or lab reports, and you want them on your products. Verification is free.",
    subject: "Verification",
    link: { href: "/verify", label: "Get verified" },
  },
  {
    n: "03",
    name: "Press",
    body: "Writing about fabric, chemicals, endocrine disruptors, or the clean-fashion category. We share data, and we answer questions on the record.",
    subject: "Press",
  },
  {
    n: "04",
    name: "A question about a score",
    body: "You think a number is wrong. Send the product and tell us why. We publish the method and we correct the record when we get one wrong.",
    subject: "Score",
    link: { href: "/methodology", label: "How we score" },
  },
];

export default async function ContactPage() {
  const taxonomy = await getShopTaxonomy();

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav taxonomy={taxonomy} />

      {/* Hero */}
      <header className="shell" style={{ paddingTop: 132 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 20px" }}>
            Contact
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
            Get in touch.
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--ink-2)",
              margin: "0 auto 34px",
              maxWidth: 560,
            }}
          >
            One inbox, and a person reads it. Put the reason in the subject line
            and you will hear back.
          </p>
          <a
            href={`mailto:${EMAIL}`}
            style={{
              display: "inline-block",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--cream)",
              background: "var(--ink)",
              padding: "14px 30px",
              borderRadius: 999,
            }}
          >
            {EMAIL}
          </a>
        </div>
      </header>

      {/* Routes */}
      <Section eyebrow="What it is about" title="Say which one, in the subject.">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "36px 40px",
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          {ROUTES.map((r) => (
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
                  {r.subject}
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
                  margin: "0 0 12px",
                }}
              >
                {r.body}
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <a
                  href={`mailto:${r.email ?? EMAIL}?subject=${encodeURIComponent(r.subject)}`}
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "var(--ink)",
                    borderBottom: "1px solid var(--hairline-strong)",
                    paddingBottom: 2,
                  }}
                >
                  Email us
                </a>
                {r.link && (
                  <Link
                    href={r.link.href}
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "var(--ink-2)",
                      borderBottom: "1px solid var(--hairline)",
                      paddingBottom: 2,
                    }}
                  >
                    {r.link.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
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
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="shell" style={{ paddingTop: 110 }}>
      <div style={{ maxWidth: 720, margin: "0 auto 48px", textAlign: "center" }}>
        {eyebrow && (
          <p className="eyebrow" style={{ margin: "0 0 16px" }}>
            {eyebrow}
          </p>
        )}
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
