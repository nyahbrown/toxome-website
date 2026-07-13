import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import FaqAccordion from "@/app/verify/FaqAccordion";
import ExtensionWaitlist from "@/components/ExtensionWaitlist";
import { getShopTaxonomy } from "@/lib/supabase";

// Flip the extension page from "coming soon / waitlist" to a live "Add to
// Chrome" button by pasting the Chrome Web Store URL here the day it ships.
// Empty string = pre-launch (waitlist mode).
const CHROME_STORE_URL = "";
const IS_LIVE = CHROME_STORE_URL.length > 0;

const APP_STORE = "https://apps.apple.com/us/app/toxome/id6748622034";
const SITE = "https://toxome.app";
const PAGE_URL = `${SITE}/extension`;

export const metadata: Metadata = {
  title: "Chrome Extension to Check Clothes for Toxic Chemicals | Toxome",
  description:
    "A free Chrome extension that checks clothes for toxic chemicals while you shop. See the fiber breakdown and a health rating out of 100 on any product page.",
  alternates: { canonical: "/extension" },
  openGraph: {
    title: "Check clothes for toxic chemicals, while you shop",
    description:
      "The Toxome Chrome extension reads the fiber composition on any product page, rates it out of 100, and tells you what those materials do to your body.",
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
    body: "Open any clothing product page. The Toxome card appears on its own, no copy-paste, no searching.",
  },
];

const FEATURES: {
  label: string;
  body: string;
  link?: { href: string; label: string };
}[] = [
  {
    label: "A rating, not a guess",
    body: "The same wearer-health rubric as the Toxome app, scored out of 100 with a plain verdict: great, good, okay, or bad.",
    link: { href: "/methodology", label: "How we score" },
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

// What the extension actually surfaces. This section exists because the
// specifics (PFAS, formaldehyde, disperse dyes) are what people search for
// when they're worried about a garment, and they belong on the page anyway.
const CATCHES = [
  {
    label: "Plastic fibers",
    body: "Polyester, nylon, acrylic, and elastane are plastics. They trap heat and sweat against your skin, and they shed microplastics every wash. The extension names them by percentage instead of letting them hide behind the word 'blend'.",
  },
  {
    label: "PFAS and finishes",
    body: "Stain-resistant, wrinkle-free, and water-repellent finishes are the ones most likely to carry PFAS. Toxome flags the language a brand uses to describe them.",
  },
  {
    label: "Formaldehyde and dyes",
    body: "Wrinkle-resistant cotton is often treated with formaldehyde resin, and disperse dyes on synthetics are a common cause of contact dermatitis. Both get called out in the score.",
  },
  {
    label: "The vague ones",
    body: "'Viscose', 'bamboo', and 'plant-based' cover a wide range, from a closed-loop lyocell to a generic viscose with a dirty process. Toxome grades the fiber you got.",
  },
];

// The SAME array feeds the visible accordion and the FAQPage schema, so the
// two can never drift apart.
const FAQ = [
  {
    q: "What does the Toxome extension do?",
    a: "It reads the fiber composition on any clothing product page and shows you a health rating out of 100, the full material breakdown by percentage, and a plain-English explanation of what those materials do to your body. It appears on the product page automatically, before you add anything to cart.",
  },
  {
    q: "How do you check if clothes contain harmful chemicals?",
    a: "Start with the composition label. The fiber is most of the story. Plastic fibers like polyester, nylon, acrylic, and elastane shed microplastics and trap sweat. Performance finishes like stain-resistant, wrinkle-free, and water-repellent are the ones most likely to carry PFAS. Wrinkle-resistant cotton is often treated with formaldehyde resin. The Toxome extension does this read for you on the page, and the Toxome app does it from a photo of a physical label.",
  },
  {
    q: "Which stores does it work on?",
    a: "Any clothing product page on the web. It isn't a list of partner retailers, it reads the composition wherever the brand publishes it, including the fine print inside collapsed accordions and tabs.",
  },
  {
    q: "Is the extension free?",
    a: "Yes. Installing it and seeing the rating, the composition, and the reasoning costs nothing.",
  },
  {
    q: "How is the rating calculated?",
    a: "On the same wearer-health rubric the Toxome app uses. It scores what the garment does to the person wearing it, starting from the fiber and then applying penalties for the chemistry a fiber usually brings with it.",
    link: { href: "/methodology", label: "Read the full method." },
  },
  {
    q: "Does it track my browsing?",
    a: "No. It looks at the clothing product page you're on to read the composition, and that's all. It isn't building a profile of where you shop.",
  },
  {
    q: "Does it work in Safari or Firefox?",
    a: "Not yet. It's launching on Chrome first. If you want it somewhere else, get on the list and tell us where.",
  },
  {
    q: "Do I need the app as well?",
    a: "No, they do different jobs. The extension checks clothes you're about to buy online. The app checks clothes you already own, by scanning the physical label. They share one Closet, so a piece saved in either place shows up in both.",
  },
];

export default async function ExtensionPage() {
  const taxonomy = await getShopTaxonomy();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Extension", item: PAGE_URL },
        ],
      },
      {
        "@type": "SoftwareApplication",
        name: "Toxome for Chrome",
        applicationCategory: "BrowserApplication",
        applicationSubCategory: "Shopping",
        operatingSystem: "Chrome",
        url: PAGE_URL,
        description:
          "A free Chrome extension that checks clothes for toxic chemicals while you shop. It reads the fiber composition on any product page, rates the garment out of 100 on a wearer-health rubric, and explains what each material does to your body.",
        // No aggregateRating: the extension has no reviews yet, and inventing
        // them is both a lie and a manual action waiting to happen.
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: {
          "@type": "Organization",
          name: "Toxome",
          url: SITE,
          logo: { "@type": "ImageObject", url: `${SITE}/icon.png` },
        },
        screenshot: `${SITE}/extension/preview.jpg`,
      },
      {
        // Synced to the visible FAQ (same FAQ array rendered below).
        "@type": "FAQPage",
        mainEntity: FAQ.map((x) => ({
          "@type": "Question",
          name: x.q,
          acceptedAnswer: { "@type": "Answer", text: x.a },
        })),
      },
    ],
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <JsonLd data={schema} />
      <Nav taxonomy={taxonomy} />

      {/* Hero */}
      <header className="shell" style={{ paddingTop: 132 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 20px" }}>
            The Toxome Chrome Extension
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
            Check clothes for toxic chemicals, while you shop.
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--ink-2)",
              margin: "0 auto 34px",
              maxWidth: 580,
            }}
          >
            A free Chrome extension that reads the fiber composition on any
            product page, rates the garment out of 100, and tells you what those
            materials do to your body. You see it before you add to cart,
            instead of after it arrives.
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
            alt="The Toxome Chrome extension open on a DISSH clothing product page, showing a 67/100 'Okay' health rating, a 57% cupro / 43% viscose fiber composition breakdown, why-this-score notes, and Save to Wishlist and Add to Closet buttons."
            width={2000}
            height={1294}
            sizes="(max-width: 1100px) 100vw, 1040px"
            style={{ display: "block", width: "100%", height: "auto" }}
            priority
          />
        </div>
      </section>

      {/* What it catches */}
      <section className="shell" style={{ paddingTop: 110 }}>
        <div style={{ maxWidth: 720, margin: "0 auto 48px", textAlign: "center" }}>
          <p className="eyebrow" style={{ margin: "0 0 16px" }}>
            What it catches
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
            The things a brand would rather you skimmed.
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
          {CATCHES.map((c) => (
            <div key={c.label}>
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
                {c.label}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "var(--ink-2)",
                  margin: 0,
                }}
              >
                {c.body}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--ink-2)",
            maxWidth: 880,
            margin: "36px auto 0",
            textAlign: "center",
          }}
        >
          Want the long version on any single fiber? Read the{" "}
          <Link href="/guide" style={{ color: "var(--ink)" }}>
            fabric guide
          </Link>
          , or see{" "}
          <Link href="/methodology" style={{ color: "var(--ink)" }}>
            how we score
          </Link>
          .
        </p>
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
                {f.link && (
                  <>
                    {" "}
                    <Link className="inline-link" href={f.link.href}>
                      {f.link.label}
                    </Link>
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ, synced to the FAQPage schema above */}
      <section className="shell" style={{ paddingTop: 110 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p className="eyebrow" style={{ margin: "0 0 16px" }}>
            Questions
          </p>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(26px, 3.2vw, 38px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 0 36px",
            }}
          >
            The extension, answered.
          </h2>
          <FaqAccordion items={FAQ} />
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
