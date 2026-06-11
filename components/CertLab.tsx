import Link from "next/link";
import CertBadge from "@/components/CertBadge";
import { availableLogos } from "@/lib/certLogos";
import {
  CATEGORIES,
  CERTIFICATIONS,
  getCertsByCategory,
  type Certification,
} from "@/lib/certifications";

export const VARIANTS = [
  { id: "v1", name: "Roster", desc: "Badge-led cards in a two-up grid." },
  { id: "v2", name: "Medallion", desc: "Centered seals, award-style." },
  { id: "v3", name: "Directory", desc: "Full-width reference rows." },
  { id: "v4", name: "Badge wall", desc: "A wall of logos, then detail." },
  { id: "v5", name: "Editorial", desc: "Alternating magazine spread." },
] as const;

export type VariantId = (typeof VARIANTS)[number]["id"];

export function isVariant(v: string): v is VariantId {
  return VARIANTS.some((x) => x.id === v);
}

// ── Shared content blocks ─────────────────────────────────────────────────
function VerifiesBlock({ cert }: { cert: Certification }) {
  return (
    <div className="cert-card__block">
      <p className="cert-card__label cert-card__label--yes">What it verifies</p>
      <ul className="cert-card__list">
        {cert.verifies.map((v, i) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
    </div>
  );
}

function LeavesOutBlock({ cert }: { cert: Certification }) {
  return (
    <div className="cert-card__block">
      <p className="cert-card__label cert-card__label--no">What it leaves out</p>
      <p className="cert-card__blindspot">{cert.blindSpot}</p>
    </div>
  );
}

function TakeBlock({ cert }: { cert: Certification }) {
  return (
    <p className="cert-card__take">
      <span className="cert-card__take-mark">Toxome read</span>
      {cert.take}
    </p>
  );
}

export type LogoMap = Map<string, string>;

// ── V1 — Roster ───────────────────────────────────────────────────────────
function Roster({ logos }: { logos: LogoMap }) {
  return (
    <>
      {CATEGORIES.map((cat) => (
        <section
          key={cat.id}
          className="shell"
          style={{ paddingTop: 48, paddingBottom: 8 }}
        >
          <div style={{ maxWidth: 760, marginBottom: 26 }}>
            <h2 className="cert-section__title">{cat.label}</h2>
            <p className="cert-section__blurb">{cat.blurb}</p>
          </div>
          <div className="cert-grid">
            {getCertsByCategory(cat.id).map((cert) => (
              <article key={cert.slug} className="cert-card">
                <header className="cl-head">
                  <CertBadge
                    slug={cert.slug}
                    name={cert.name}
                    abbr={cert.abbr}
                    size={54}
                    logoSrc={logos.get(cert.slug)}
                  />
                  <div>
                    <p className="cert-card__issuer">{cert.issuer}</p>
                    <h3 className="cert-card__name">
                      {cert.name}
                      {cert.abbr && (
                        <span className="cert-card__abbr">{cert.abbr}</span>
                      )}
                    </h3>
                  </div>
                </header>
                <p className="cert-card__summary">{cert.summary}</p>
                <VerifiesBlock cert={cert} />
                <LeavesOutBlock cert={cert} />
                <TakeBlock cert={cert} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

// ── V2 — Medallion ────────────────────────────────────────────────────────
function Medallion({ logos }: { logos: LogoMap }) {
  return (
    <>
      {CATEGORIES.map((cat) => (
        <section
          key={cat.id}
          className="shell"
          style={{ paddingTop: 48, paddingBottom: 8 }}
        >
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 28px" }}>
            <h2 className="cert-section__title">{cat.label}</h2>
            <p className="cert-section__blurb">{cat.blurb}</p>
          </div>
          <div className="cl-medallion-grid">
            {getCertsByCategory(cat.id).map((cert) => (
              <article key={cert.slug} className="cl-medallion">
                <CertBadge
                  slug={cert.slug}
                  name={cert.name}
                  abbr={cert.abbr}
                  size={76}
                  logoSrc={logos.get(cert.slug)}
                />
                <p className="cert-card__issuer" style={{ marginTop: 16 }}>
                  {cert.issuer}
                </p>
                <h3 className="cl-medallion__name">{cert.name}</h3>
                <p className="cert-card__summary" style={{ marginBottom: 18 }}>
                  {cert.summary}
                </p>
                <div className="cl-medallion__body">
                  <VerifiesBlock cert={cert} />
                  <LeavesOutBlock cert={cert} />
                  <TakeBlock cert={cert} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

// ── V3 — Directory ────────────────────────────────────────────────────────
function DirectoryRow({ cert, logos }: { cert: Certification; logos: LogoMap }) {
  return (
    <article className="cl-row">
      <div className="cl-row__id">
        <CertBadge
          slug={cert.slug}
          name={cert.name}
          abbr={cert.abbr}
          size={72}
          logoSrc={logos.get(cert.slug)}
        />
        <div>
          <p className="cert-card__issuer">{cert.issuer}</p>
          <h3 className="cert-card__name">
            {cert.name}
            {cert.abbr && <span className="cert-card__abbr">{cert.abbr}</span>}
          </h3>
        </div>
      </div>
      <div className="cl-row__body">
        <p className="cert-card__summary">{cert.summary}</p>
        <div className="cl-row__cols">
          <VerifiesBlock cert={cert} />
          <LeavesOutBlock cert={cert} />
        </div>
        <TakeBlock cert={cert} />
      </div>
    </article>
  );
}

function Directory({ logos }: { logos: LogoMap }) {
  return (
    <>
      {CATEGORIES.map((cat) => (
        <section
          key={cat.id}
          className="shell"
          style={{ paddingTop: 48, paddingBottom: 8 }}
        >
          <div style={{ maxWidth: 760, marginBottom: 22 }}>
            <h2 className="cert-section__title">{cat.label}</h2>
            <p className="cert-section__blurb">{cat.blurb}</p>
          </div>
          <div className="cl-rows">
            {getCertsByCategory(cat.id).map((cert) => (
              <DirectoryRow key={cert.slug} cert={cert} logos={logos} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

// ── V4 — Badge wall ───────────────────────────────────────────────────────
function BadgeWall({ logos }: { logos: LogoMap }) {
  return (
    <>
      <section className="shell" style={{ paddingTop: 40, paddingBottom: 24 }}>
        <div className="cl-wall">
          {CERTIFICATIONS.map((cert) => (
            <a key={cert.slug} href={`#${cert.slug}`} className="cl-wall-item">
              <CertBadge
                slug={cert.slug}
                name={cert.name}
                abbr={cert.abbr}
                size={84}
                logoSrc={logos.get(cert.slug)}
              />
              <span className="cl-wall-item__name">{cert.abbr ?? cert.name}</span>
            </a>
          ))}
        </div>
      </section>
      {CATEGORIES.map((cat) => (
        <section
          key={cat.id}
          className="shell"
          style={{ paddingTop: 40, paddingBottom: 8 }}
        >
          <div style={{ maxWidth: 760, marginBottom: 18 }}>
            <h2 className="cert-section__title">{cat.label}</h2>
          </div>
          <div className="cl-rows">
            {getCertsByCategory(cat.id).map((cert) => (
              <article key={cert.slug} id={cert.slug} className="cl-row cl-row--anchor">
                <div className="cl-row__id">
                  <CertBadge
                    slug={cert.slug}
                    name={cert.name}
                    abbr={cert.abbr}
                    size={64}
                    logoSrc={logos.get(cert.slug)}
                  />
                  <div>
                    <p className="cert-card__issuer">{cert.issuer}</p>
                    <h3 className="cert-card__name">
                      {cert.name}
                      {cert.abbr && (
                        <span className="cert-card__abbr">{cert.abbr}</span>
                      )}
                    </h3>
                  </div>
                </div>
                <div className="cl-row__body">
                  <p className="cert-card__summary">{cert.summary}</p>
                  <div className="cl-row__cols">
                    <VerifiesBlock cert={cert} />
                    <LeavesOutBlock cert={cert} />
                  </div>
                  <TakeBlock cert={cert} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

// ── V5 — Editorial spread ─────────────────────────────────────────────────
function Editorial({ logos }: { logos: LogoMap }) {
  return (
    <section className="shell" style={{ paddingTop: 32 }}>
      <div className="cl-spread">
        {CERTIFICATIONS.map((cert, i) => (
          <article
            key={cert.slug}
            className="cl-spread__item"
            data-flip={i % 2 === 1}
          >
            <div className="cl-spread__badge">
              <CertBadge
                slug={cert.slug}
                name={cert.name}
                abbr={cert.abbr}
                size={120}
                logoSrc={logos.get(cert.slug)}
              />
              <p className="cert-card__issuer" style={{ marginTop: 16 }}>
                {cert.issuer}
              </p>
            </div>
            <div className="cl-spread__content">
              <h3 className="cl-spread__name">{cert.name}</h3>
              <p className="cert-card__summary" style={{ fontSize: 16 }}>
                {cert.summary}
              </p>
              <div className="cl-row__cols">
                <VerifiesBlock cert={cert} />
                <LeavesOutBlock cert={cert} />
              </div>
              <TakeBlock cert={cert} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// Renders just the body of one variation (no page shell), so an "all on one
// page" view can stack every treatment.
export function VariantContent({
  variant,
  logos,
}: {
  variant: VariantId;
  logos: LogoMap;
}) {
  if (variant === "v1") return <Roster logos={logos} />;
  if (variant === "v2") return <Medallion logos={logos} />;
  if (variant === "v3") return <Directory logos={logos} />;
  if (variant === "v4") return <BadgeWall logos={logos} />;
  return <Editorial logos={logos} />;
}

// ── Shell ─────────────────────────────────────────────────────────────────
export default function CertLab({ variant }: { variant: VariantId }) {
  const logos = availableLogos();
  const meta = VARIANTS.find((v) => v.id === variant)!;

  return (
    <main
      style={{
        background: "var(--linen)",
        minHeight: "100vh",
        paddingTop: 64,
        paddingBottom: 120,
      }}
    >
      <div
        className="shell"
        style={{ textAlign: "center", paddingTop: 48, paddingBottom: 30 }}
      >
        <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 18 }}>
          Design lab · certifications
        </div>
        <h1
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 500,
            fontSize: "clamp(26px, 3.6vw, 40px)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            margin: "0 auto 10px",
          }}
        >
          {meta.name}
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--ink-2)",
            margin: "0 auto 26px",
            maxWidth: 460,
          }}
        >
          {meta.desc}
        </p>
        <nav className="cl-switch" aria-label="Variations">
          {VARIANTS.map((v) => (
            <Link
              key={v.id}
              href={`/cert-lab/${v.id}`}
              data-active={v.id === variant}
            >
              {v.id} · {v.name}
            </Link>
          ))}
        </nav>
      </div>

      <VariantContent variant={variant} logos={logos} />
    </main>
  );
}
