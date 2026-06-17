import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ExtensionWaitlist from "@/components/ExtensionWaitlist";
import { getShopTaxonomy } from "@/lib/supabase";

// Flip the extension page from "coming soon / waitlist" to a live "Add to
// Chrome" button by pasting the Chrome Web Store URL here the day it ships.
// Empty string = pre-launch (waitlist mode).
const CHROME_STORE_URL = "";
const IS_LIVE = CHROME_STORE_URL.length > 0;

const APP_STORE = "https://apps.apple.com/us/app/toxome/id6748622034";

export const metadata: Metadata = {
  title: "Toxic Fashion Detector for Chrome | Toxome",
  description:
    "Toxome is a toxic fashion detector for your browser. See how healthy any garment is while you shop, with the rating, fiber breakdown, and why it matters, right on the product page. Coming soon to Chrome.",
  alternates: { canonical: "/extension" },
  openGraph: {
    title: "The Toxome Extension",
    description:
      "A fabric-health check that follows you to every store. The Toxome rating, full fiber breakdown, and why it matters, right on the product page.",
    url: "/extension",
    siteName: "Toxome",
  },
};

const STEPS = [
  {
    n: "01",
    title: "Add it to Chrome",
    body: "Install the Toxome extension from the Chrome Web Store. It's free, and it takes one click.",
  },
  {
    n: "02",
    title: "Pin the eye",
    body: "Click the puzzle icon in your toolbar and pin Toxome, so it's always one glance away.",
  },
  {
    n: "03",
    title: "Shop anywhere",
    body: "Open any product page. The Toxome card appears on its own, no copy-paste, no searching.",
  },
];

const FEATURES = [
  {
    label: "A rating, not a guess",
    body: "The same wearer-health rubric as the Toxome app, scored out of 100 with a plain verdict: great, good, okay, or bad.",
  },
  {
    label: "The full composition",
    body: "Every fiber by percentage, pulled straight from the label, even the fine print tucked inside collapsed accordions.",
  },
  {
    label: "Why this score",
    body: "Plain English, never jargon. Polyester is a plastic fiber; elastane is occlusive and disperse-dyed. You see what each material does to your body.",
  },
  {
    label: "Save it for later",
    body: "Add a piece to your Wishlist while you decide, or to your Closet once it's yours. Your closet score follows you across the web and the app.",
  },
];

export default async function ExtensionPage() {
  const taxonomy = await getShopTaxonomy();

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav taxonomy={taxonomy} />

      {/* Hero */}
      <header className="shell" style={{ paddingTop: 132 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 20px" }}>
            The Toxome Extension
          </p>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(36px, 5vw, 60px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              margin: "0 0 22px",
            }}
          >
            Toxome, while you shop.
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
            A fabric-health check that follows you to every store. The Toxome
            rating, the full fiber breakdown, and why it matters, right on the
            product page before you buy.
          </p>

          {/* CTA, live store button, or pre-launch waitlist */}
          {IS_LIVE ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <a
                className="pill-cta"
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Add to Chrome, free
                <ArrowIcon />
              </a>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
                Works in Chrome on desktop.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 30,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: "1px solid var(--hairline-strong)",
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase",
                  color: "var(--ink-2)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--risk-low)",
                  }}
                />
                Coming soon to Chrome
              </span>
              <ExtensionWaitlist />
            </div>
          )}
        </div>
      </header>

      {/* Product screenshot, the proof shot */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow:
              "0 30px 70px -34px rgba(59,60,58,0.30), 0 10px 24px -14px rgba(59,60,58,0.14)",
          }}
        >
          <Image
            src="/extension/preview.jpg"
            alt="The Toxome extension card open on a DISSH product page, showing a 67/100 'Okay' rating, a 57% cupro / 43% viscose composition breakdown, why-this-score notes, and Save to Wishlist and Add to Closet buttons."
            width={2000}
            height={1294}
            sizes="(max-width: 1100px) 100vw, 1040px"
            style={{ display: "block", width: "100%", height: "auto" }}
            priority
          />
        </div>
      </section>

      {/* How it works */}
      <section className="shell" style={{ paddingTop: 110 }}>
        <div style={{ maxWidth: 720, margin: "0 auto 48px", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 16px" }}>
            Getting started
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
            Up and running in under a minute.
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 28,
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
      </section>

      {/* What you see */}
      <section className="shell" style={{ paddingTop: 110 }}>
        <div style={{ maxWidth: 720, margin: "0 auto 48px", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 16px" }}>
            On every product page
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
            Everything worth knowing, before &ldquo;add to cart.&rdquo;
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "40px 48px",
            maxWidth: 880,
            margin: "0 auto",
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.label}>
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
                {f.label}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing, app cross-sell while the extension is pre-launch */}
      <section className="shell" style={{ paddingTop: 110, paddingBottom: 130 }}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 16px" }}>
            In the meantime
          </p>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(24px, 3vw, 34px)",
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 0 16px",
            }}
          >
            Start with what&apos;s already in your closet.
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              margin: "0 auto 28px",
              maxWidth: 480,
            }}
          >
            The Toxome app does the same thing for the clothes you already own.
            Scan a label, get the rating, and see what your wardrobe is made of.
          </p>
          <a
            className="pill-cta"
            href={APP_STORE}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get the app
            <ArrowIcon />
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
