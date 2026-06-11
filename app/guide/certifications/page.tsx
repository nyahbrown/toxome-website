import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import GuideTabs from "@/components/GuideTabs";
import CertBadge from "@/components/CertBadge";
import CertWall from "@/components/CertWall";
import { availableLogos } from "@/lib/certLogos";
import { getShopTaxonomy } from "@/lib/supabase";
import {
  CATEGORIES,
  CERTIFICATIONS,
  getCertsByCategory,
  type Certification,
} from "@/lib/certifications";

export const metadata: Metadata = {
  title: "Clothing Certifications, Decoded | Toxome",
  description:
    "OEKO-TEX, GOTS, GRS, bluesign and more. What each clothing certification verifies, and the one thing it leaves out.",
  keywords: [
    "clothing certifications",
    "what does OEKO-TEX mean",
    "GOTS certified",
    "textile certifications explained",
    "is OEKO-TEX safe",
    "GRS recycled standard",
    "bluesign meaning",
    "sustainable fashion labels",
  ],
  alternates: { canonical: "/guide/certifications" },
  openGraph: {
    type: "article",
    title: "Clothing Certifications, Decoded",
    description:
      "What every clothing label verifies, and the one thing it leaves out.",
    url: "/guide/certifications",
    siteName: "Toxome",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clothing Certifications, Decoded",
    description:
      "What every clothing label verifies, and the one thing it leaves out.",
  },
};

export default async function CertificationsPage() {
  const taxonomy = await getShopTaxonomy();
  const logos = availableLogos();

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <main
        style={{
          background: "var(--linen)",
          minHeight: "100vh",
          paddingTop: 64,
          paddingBottom: 120,
        }}
      >
        {/* Header — matches the fabric guide so the tabs read as siblings */}
        <div
          className="shell"
          style={{ textAlign: "center", paddingTop: 56, paddingBottom: 36 }}
        >
          <div
            className="eyebrow"
            style={{ color: "var(--ink-3)", marginBottom: 22 }}
          >
            The fabric guide
          </div>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(28px, 4vw, 46px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 auto 20px",
              maxWidth: 640,
            }}
          >
            What certifications actually mean.
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              margin: "0 auto 28px",
              maxWidth: 560,
            }}
          >
            Every certification is a promise about one thing. The gap between what
            it covers and what you assume it covers is where most clothing hides.
          </p>
          <GuideTabs active="certifications" />
        </div>

        {/* Badge wall — every mark at a glance; tap one to scroll to its card */}
        <section className="shell" style={{ paddingTop: 8, paddingBottom: 16 }}>
          <CertWall
            items={CERTIFICATIONS.map((cert) => ({
              slug: cert.slug,
              name: cert.name,
              abbr: cert.abbr,
              logoSrc: logos.get(cert.slug),
            }))}
          />
        </section>

        {/* Decoder intro + how-to-read legend */}
        <section className="shell" style={{ paddingTop: 28, paddingBottom: 8 }}>
          <div className="cert-intro">
            <p className="cert-intro__body">
              A label on a hangtag feels like a verdict. It rarely is. One seal
              tests for harmful chemicals but ignores what the fabric is made of.
              Another certifies the cotton was grown organically, then says nothing
              about the dye. A third proves the down is humane, but not the jacket
              it fills.
            </p>
            <p className="cert-intro__body">
              None of them are lying. Each one answers a single, narrow question,
              and shoppers fill the silence with everything the badge never
              claimed. Below is what each one verifies, and the one thing it leaves
              out.
            </p>
            <div className="cert-legend">
              <span>
                <i className="cert-legend__dot cert-legend__dot--yes" />
                what it verifies
              </span>
              <span>
                <i className="cert-legend__dot cert-legend__dot--no" />
                what it leaves out
              </span>
            </div>
          </div>
        </section>

        {/* Category sections */}
        {CATEGORIES.map((cat) => (
          <section
            key={cat.id}
            id={cat.id}
            className="shell"
            style={{ paddingTop: 52, paddingBottom: 8, scrollMarginTop: 96 }}
          >
            <div style={{ maxWidth: 760, marginBottom: 26 }}>
              <h2 className="cert-section__title">{cat.label}</h2>
              <p className="cert-section__blurb">{cat.blurb}</p>
            </div>
            <div className="cert-grid">
              {getCertsByCategory(cat.id).map((cert) => (
                <CertCard
                  key={cert.slug}
                  cert={cert}
                  logoSrc={logos.get(cert.slug)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Closing CTA */}
        <section className="shell" style={{ paddingTop: 72 }}>
          <div className="cert-cta">
            <p className="cert-cta__eyebrow">The bigger picture</p>
            <h2 className="cert-cta__headline">
              A certification is a floor, not a guarantee.
            </h2>
            <p className="cert-cta__body">
              No badge reads the whole garment the way it touches your body: the
              fiber, the finishes, the chemistry, all at once. And brands pay to
              wear one, so the cleanest piece on the rack often carries no label at
              all. That&rsquo;s the gap Toxome closes, with a single score that
              reads what you&rsquo;re wearing, certified or not.
            </p>
            <div className="cert-cta__actions">
              <a
                href="https://apps.apple.com/us/app/toxome/id6748622034"
                className="pill-cta"
              >
                Score your closet
                <ArrowIcon />
              </a>
              <Link href="/guide" className="pill-cta ghost">
                Browse the fibers
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function CertCard({
  cert,
  logoSrc,
}: {
  cert: Certification;
  logoSrc?: string;
}) {
  return (
    <article
      id={cert.slug}
      className="cert-card"
      style={{ scrollMarginTop: 90 }}
    >
      <header className="cl-head">
        <CertBadge
          slug={cert.slug}
          name={cert.name}
          abbr={cert.abbr}
          size={54}
          logoSrc={logoSrc}
        />
        <div>
          <p className="cert-card__issuer">{cert.issuer}</p>
          <h3 className="cert-card__name">
            {cert.name}
            {cert.abbr && <span className="cert-card__abbr">{cert.abbr}</span>}
          </h3>
        </div>
      </header>

      <p className="cert-card__summary">{cert.summary}</p>

      <div className="cert-card__block">
        <p className="cert-card__label cert-card__label--yes">What it verifies</p>
        <ul className="cert-card__list">
          {cert.verifies.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      </div>

      <div className="cert-card__block">
        <p className="cert-card__label cert-card__label--no">What it leaves out</p>
        <p className="cert-card__blindspot">{cert.blindSpot}</p>
      </div>

      <p className="cert-card__take">
        <span className="cert-card__take-mark">Toxome read</span>
        {cert.take}
      </p>
    </article>
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
