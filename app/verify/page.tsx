import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy, getVerifiedBrands } from "@/lib/supabase";
import {
  RUNG_META,
  VERIFICATION_FIREWALL_LINE,
  type VerificationRung,
} from "@/lib/verification";
import { availableLogos } from "@/lib/certLogos";
import CertBadge from "@/components/CertBadge";
import VerifyForm from "./VerifyForm";
import SmoothScrollLink from "./SmoothScrollLink";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "Get Verified | Toxome",
  description:
    "Brands can earn a Verified rung by sending their own documentation. No paid certification required.",
  alternates: { canonical: "/verify" },
};

// Publicly shown rungs (lab-verified is intentionally internal — never list it).
const LADDER: VerificationRung[] = ["undisclosed", "self_disclosed", "verified"];

const bodyStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontSize: 16,
  lineHeight: 1.6,
  color: "var(--ink-2)",
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontWeight: 500,
  fontSize: "clamp(24px, 3vw, 32px)",
  lineHeight: 1.15,
  letterSpacing: "-0.02em",
  color: "var(--ink)",
  margin: "10px 0 0",
};

const FULL = { maxWidth: "none", margin: "0 auto", padding: "0 32px" } as const;

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow" style={{ color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>
      {children}
    </p>
  );
}

const STEPS = [
  { n: "01", t: "Send your files", b: "Lab reports, supplier and dye-house disclosures, or test results. Whatever you already have on hand." },
  { n: "02", t: "We review them", b: "We check your documents against the same evidence standard we use for OEKO-TEX and GOTS." },
  { n: "03", t: "Your score updates", b: "Your products move to a verified rung. Verification changes how sure we are, never the score itself." },
];

const NEXT = [
  { t: "Submit your documents", b: "Lab reports, supplier or dye-house disclosures, or existing certifications. No paid cert required." },
  { t: "We review the evidence", b: "Checked against the same standard we hold OEKO-TEX and GOTS to." },
  { t: "Your score is verified", b: "Verification changes how sure we are about a score. It never changes the score itself." },
];

const FAQ = [
  { q: "How much does it cost?", a: "$0. Verification is completely free. There is no fee to submit your documents or to earn a verified rung, and you never need to buy OEKO-TEX or any paid certification." },
  { q: "Will this change my score?", a: "Verification can move a score up, down, or leave it unchanged. It improves how accurate and confident the score is. It never buys points." },
  { q: "What documents do you accept?", a: "We accept proof about the chemicals in the fabric against your skin. The most common is an OEKO-TEX STANDARD 100 certificate, which tests the finished product for hundreds of harmful substances. We also accept GOTS and bluesign certificates, and third-party lab reports from accredited labs like SGS, Bureau Veritas, Intertek, or Hohenstein covering formaldehyde, banned azo dyes, PFAS, and extractable heavy metals. Supplier and dye-house disclosures that name the dyes and finishes you used help too." },
  { q: "What if I don't have lab reports?", a: "Send what you have. A supplier or dye-house disclosure, or the safety data sheets (SDS) for the dyes and finishes you used, shows us what went into the fabric and lets us screen it. That earns a self-disclosed rung and tells us what to test for. A confirmed certification or a finished-product lab report is what moves you to Verified." },
  { q: "What about B Corp or Fair Trade?", a: "Those are meaningful, but they speak to ethics and labor, not wearer chemical safety. They do not change a verification rung on their own." },
  { q: "How long does review take?", a: "We work through submissions in the order we receive them, and we email you if we need anything else." },
];

export default async function VerifyPage() {
  const [taxonomy, verifiedBrands] = await Promise.all([
    getShopTaxonomy(),
    getVerifiedBrands(),
  ]);
  const logos = availableLogos();

  // Unique set of health certs across all verified brands, for the marquee.
  const certMap = new Map<string, { slug: string; label: string }>();
  for (const b of verifiedBrands) for (const c of b.certs) certMap.set(c.slug, c);
  const recognized = [...certMap.values()].sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
        {/* HERO — text + 60 stat on the left, demo video on the right */}
        <section
          className="vf-hero"
          style={{
            ...FULL,
            paddingTop: 150,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.08fr)",
            gap: 56,
            alignItems: "start",
          }}
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 20 }}>
              For brands
            </p>
            <h1
              style={{
                fontFamily: "var(--sans)",
                fontWeight: 500,
                fontSize: "clamp(40px, 5.2vw, 64px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                margin: "0 0 16px",
              }}
            >
              get verified
            </h1>
            <p style={{ ...bodyStyle, fontSize: 18, margin: "0 0 32px", maxWidth: 480 }}>
              Send us your real documents and we move your score to a verified
              rung. No paid certification required. The files you already have
              are enough.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
              <SmoothScrollLink targetId="submit" className="pill-cta">
                Submit your documents
              </SmoothScrollLink>
              <SmoothScrollLink
                targetId="verified"
                className="verify-proof-link"
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 15,
                  color: "var(--ink-2)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                see who&rsquo;s verified
              </SmoothScrollLink>
            </div>
          </div>

          {/* Demo video */}
          <div
            style={{
              border: "1px solid var(--hairline-strong)",
              borderRadius: 20,
              overflow: "hidden",
              background: "var(--white)",
              boxShadow: "0 18px 50px rgba(59,60,58,.08)",
              lineHeight: 0,
            }}
          >
            <video
              src="/verified-demo.mp4?v=2"
              poster="/verified-demo-poster.jpg?v=2"
              autoPlay
              muted
              loop
              playsInline
              aria-label="A Toxome product page showing the Verified badge and the verification note shoppers can read."
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </section>

        {/* CERTIFICATIONS WE RECOGNIZE — rotating marquee */}
        <section style={{ ...FULL, paddingTop: 72 }}>
          <p
            className="eyebrow"
            style={{ color: "var(--ink-3)", marginBottom: 24, textAlign: "center" }}
          >
            Certifications we recognize
          </p>
          <div className="cert-marquee">
            <div className="cert-marquee__track">
              {[...Array(8)].flatMap(() => recognized).map((c, i) => (
                <span key={i} className="cert-marquee__item">
                  <CertBadge
                    slug={c.slug}
                    name={c.label}
                    size={46}
                    logoSrc={logos.get(c.slug)}
                  />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS + WHERE YOUR SCORE LANDS — side by side, bar between */}
        <section
          className="vf-two"
          style={{ ...FULL, paddingTop: 96, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 1px minmax(0, 1fr)", gap: 44, alignItems: "stretch" }}
        >
          <div style={{ order: 3 }}>
            <RailLabel>How it works</RailLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 26 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: "flex", gap: 22 }}>
                <span
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 24,
                    fontWeight: 500,
                    color: "var(--ink-3)",
                    lineHeight: 1.1,
                    flexShrink: 0,
                    width: 44,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.n}
                </span>
                <div>
                  <p
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 20,
                      fontWeight: 500,
                      color: "var(--ink)",
                      margin: "0 0 6px",
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {s.t}
                  </p>
                  <p style={{ ...bodyStyle, margin: 0, maxWidth: 520 }}>{s.b}</p>
                </div>
              </div>
            ))}
            </div>
          </div>

          <div className="vf-two-bar" style={{ order: 2, background: "var(--hairline-strong)" }} />

          <div style={{ order: 1 }}>
            <RailLabel>How we score</RailLabel>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
              {LADDER.map((rung, i) => {
                const meta = RUNG_META[rung];
                const isGoal = rung === "verified";
                const last = i === LADDER.length - 1;
                return (
                  <div key={rung} style={{ display: "flex", gap: 22 }}>
                    <div
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          background: meta.dotColor,
                          marginTop: 6,
                          boxShadow: isGoal
                            ? `0 0 0 5px color-mix(in srgb, ${meta.dotColor} 20%, transparent)`
                            : "none",
                        }}
                      />
                      {!last && (
                        <span style={{ width: 2, flex: 1, minHeight: 46, background: "var(--hairline-strong)" }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: last ? 0 : 30 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span className="eyebrow" style={{ color: "var(--ink-2)" }}>
                          {meta.label}
                        </span>
                        {isGoal && (
                          <span className="eyebrow" style={{ fontSize: 9.5, color: "var(--ink-3)", letterSpacing: "0.1em" }}>
                            Your goal
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontFamily: "var(--sans)",
                          fontSize: 18,
                          fontWeight: 500,
                          color: "var(--ink)",
                          margin: "6px 0 5px",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {meta.title}
                      </p>
                      <p style={{ ...bodyStyle, fontSize: 15, margin: 0, maxWidth: 520 }}>{meta.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p
              style={{
                fontFamily: "var(--sans)",
                fontStyle: "italic",
                fontSize: 15,
                color: "var(--ink-3)",
                margin: "22px 0 0",
              }}
            >
              {VERIFICATION_FIREWALL_LINE}
            </p>
            <a
              href="/methodology"
              className="verify-proof-link"
              style={{
                display: "inline-block",
                marginTop: 14,
                fontFamily: "var(--sans)",
                fontSize: 15,
                color: "var(--ink-2)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              see the full methodology
            </a>
          </div>
        </section>

        {/* SEND YOUR DOCUMENTS + WHAT HAPPENS NEXT */}
        <section
          id="submit"
          className="vf-split"
          style={{
            ...FULL,
            paddingTop: 96,
            scrollMarginTop: 90,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: 48,
            alignItems: "start",
          }}
        >
          {/* form card */}
          <div
            style={{
              border: "1px solid var(--hairline-strong)",
              borderRadius: 22,
              background: "var(--white)",
              padding: "34px 32px",
              boxShadow: "0 18px 50px rgba(59,60,58,.07)",
            }}
          >
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              Get verified
            </p>
            <h2 style={{ ...h2Style, margin: "0 0 22px" }}>submit your documents.</h2>
            <VerifyForm />
          </div>

          {/* what happens next */}
          <div style={{ paddingTop: 8 }}>
            <p className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 18 }}>
              What happens next
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {NEXT.map((s, i) => (
                <div key={s.t} style={{ display: "flex", gap: 14 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      border: "1px solid var(--hairline-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink-2)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--sans)",
                        fontSize: 16,
                        fontWeight: 500,
                        color: "var(--ink)",
                        margin: "2px 0 4px",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {s.t}
                    </p>
                    <p style={{ ...bodyStyle, fontSize: 15, margin: 0 }}>{s.b}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 26, borderRadius: 16, background: "var(--tan)", padding: "16px 18px" }}>
              <p
                style={{
                  fontFamily: "var(--sans)",
                  fontStyle: "italic",
                  fontSize: 15,
                  color: "var(--ink-2)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {VERIFICATION_FIREWALL_LINE}
              </p>
            </div>
          </div>
        </section>

        {/* BRANDS ALREADY VERIFIED */}
        <section id="verified" style={{ ...FULL, paddingTop: 96, scrollMarginTop: 90 }}>
          <p className="eyebrow" style={{ textAlign: "center" }}>
            Verified brands
          </p>
          <h2 style={{ ...h2Style, textAlign: "center", margin: "10px 0 28px" }}>
            brands already verified.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 14,
            }}
          >
            {verifiedBrands.map((b) => (
              <div
                key={b.brand}
                className="verify-brand-card"
                style={{
                  border: "1px solid var(--hairline-strong)",
                  borderRadius: 16,
                  background: "var(--white)",
                  padding: "16px 18px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "var(--ink)",
                    margin: "0 0 12px",
                    letterSpacing: "-0.01em",
                    textTransform: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {b.brand}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {b.certs.map((c) => (
                    <CertBadge
                      key={c.slug}
                      slug={c.slug}
                      name={c.label}
                      size={30}
                      logoSrc={logos.get(c.slug)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COMMON QUESTIONS */}
        <section style={{ ...FULL, paddingTop: 96, paddingBottom: 110 }}>
          <p className="eyebrow" style={{ textAlign: "center" }}>
            Questions
          </p>
          <h2 style={{ ...h2Style, textAlign: "center", margin: "10px 0 30px" }}>
            common questions.
          </h2>
          <FaqAccordion items={FAQ} />
        </section>
      </main>
      <Footer />

      {/* Marquee + responsive splits. */}
      <style>{`
        .cert-marquee {
          overflow: hidden;
          width: 100%;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
        }
        .cert-marquee__track {
          display: flex;
          width: max-content;
          animation: cert-scroll 40s linear infinite;
        }
        .cert-marquee__item { margin-right: 56px; flex-shrink: 0; }
        @keyframes cert-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cert-marquee__track { animation: none; }
        }
        .vf-faq {
          border: 1px solid var(--hairline-strong);
          border-radius: 14px;
          background: var(--white);
          overflow: hidden;
        }
        .vf-faq__q {
          width: 100%;
          background: none;
          border: 0;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          font-family: var(--sans);
          font-size: 16px;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: -0.01em;
          text-transform: none;
        }
        .vf-faq__caret {
          flex-shrink: 0;
          color: var(--ink-3);
          transition: transform 280ms var(--ease-out-strong);
        }
        .vf-faq[data-open="true"] .vf-faq__caret { transform: rotate(180deg); }
        .vf-faq__panel {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 300ms var(--ease-out-strong);
        }
        .vf-faq[data-open="true"] .vf-faq__panel { grid-template-rows: 1fr; }
        .vf-faq__panelInner { overflow: hidden; }
        .vf-faq__a {
          margin: 0;
          padding: 0 20px 18px;
          font-family: var(--sans);
          font-size: 15px;
          line-height: 1.6;
          color: var(--ink-2);
          max-width: 640px;
          text-transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .vf-faq__caret, .vf-faq__panel { transition: none; }
        }
        @media (max-width: 900px) {
          .vf-hero { grid-template-columns: 1fr !important; gap: 36px !important; padding-top: 130px !important; }
          .vf-split { grid-template-columns: 1fr !important; gap: 32px !important; }
          .vf-two { grid-template-columns: 1fr !important; gap: 40px !important; }
          .vf-two-bar { display: none !important; }
        }
        @media (max-width: 760px) {
          .vf-rail { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>
    </>
  );
}
