import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

const APP_STORE = "https://apps.apple.com/us/app/toxome/id6748622034";

export const metadata: Metadata = {
  title: "Toxome | Get the App",
  description:
    "Scan any clothing label and Toxome reads it back to you — a health rating, the full fiber breakdown, and what each material does to your body. Free on iPhone.",
  alternates: { canonical: "/app" },
  openGraph: {
    title: "The Toxome App",
    description:
      "Scan any clothing label for a health rating, the full fiber breakdown, and what each material does to your body. Free on iPhone.",
    url: "/app",
    siteName: "Toxome",
  },
};

const STEPS = [
  {
    n: "01",
    title: "Snap the label",
    body: "Point your camera at any care or composition label. Toxome reads the fibers for you — even the fine print.",
  },
  {
    n: "02",
    title: "Get the rating",
    body: "A hazard score out of 100 with the verdict, the full composition, and the health impact — endocrine disruption, breathability, skin irritation, and more.",
  },
  {
    n: "03",
    title: "Build your closet",
    body: "Save what you own to your closet and see your whole wardrobe scored. When a piece rates poorly, get cleaner alternatives.",
  },
];

const FEATURES = [
  {
    label: "A hazard score you can trust",
    body: "Every garment rated 0–100 on what it does to your body — the same rubric across the app, the website, and the extension.",
  },
  {
    label: "The full composition",
    body: "Every fiber by percentage, with a clear read on what's plastic and what grew — acrylic, nylon, wool, and the rest.",
  },
  {
    label: "Health impact, decoded",
    body: "Endocrine disruption, breathability, skin irritation, chemical exposure — each one flagged in plain English, never jargon.",
  },
  {
    label: "Your closet, scored",
    body: "Track what you already own, spot the worst offenders, and find cleaner pieces that love you back.",
  },
];

export default async function AppPage() {
  const taxonomy = await getShopTaxonomy();

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav taxonomy={taxonomy} />

      {/* Hero */}
      <header className="shell" style={{ paddingTop: 132 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 20px" }}>
            The Toxome App
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
            Know what&rsquo;s in your clothes.
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
            Scan any clothing label and Toxome reads it back to you — a health
            rating, the full fiber breakdown, and exactly what each material does
            to your body.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
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
            <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
              Free on iPhone.
            </p>
          </div>
        </div>
      </header>

      {/* Phone screenshot — the proof shot, framed as an iPhone */}
      <section className="shell" style={{ paddingTop: 56 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 300,
            margin: "0 auto",
            background: "var(--ink)",
            borderRadius: 56,
            padding: 11,
            boxShadow:
              "0 42px 80px -34px rgba(59,60,58,0.42), 0 14px 30px -18px rgba(59,60,58,0.22)",
          }}
        >
          <div
            style={{
              position: "relative",
              borderRadius: 46,
              overflow: "hidden",
              background: "var(--ink)",
            }}
          >
            <Image
              src="/app-screenshot.png"
              alt="The Toxome app showing a scanned garment: a 72 'High' hazard level, a composition breakdown of 50% acrylic, 30% nylon, and 20% wool, and a health-impact list flagging endocrine disruption, breathability, and skin irritation."
              width={1125}
              height={2436}
              sizes="(max-width: 360px) 100vw, 280px"
              style={{ display: "block", width: "100%", height: "auto" }}
              priority
            />
            {/* Dynamic Island */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                width: 82,
                height: 23,
                borderRadius: 999,
                background: "#1d1e1c",
              }}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="shell" style={{ paddingTop: 110 }}>
        <div style={{ maxWidth: 720, margin: "0 auto 48px", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 16px" }}>
            How it works
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
            One scan, the whole story.
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

      {/* What you get */}
      <section className="shell" style={{ paddingTop: 110 }}>
        <div style={{ maxWidth: 720, margin: "0 auto 48px", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 16px" }}>
            In your pocket
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
            Everything your label won&rsquo;t tell you.
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

      {/* Closing CTA — badge + scan-to-download QR */}
      <section className="shell" style={{ paddingTop: 110, paddingBottom: 130 }}>
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
            Start with what&rsquo;s already in your closet.
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Image
              src="/app-store-qr.svg"
              alt="QR code to download the Toxome app"
              width={148}
              height={148}
              style={{ display: "block", height: 148, width: 148 }}
            />
            <span
              style={{
                fontSize: 12,
                letterSpacing: "0.04em",
                color: "var(--ink-3)",
              }}
            >
              Scan to download
            </span>
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
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
