import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShareBar from "@/components/ShareBar";
import { getShopTaxonomy } from "@/lib/supabase";
import { getAllArticles, formatDate } from "@/lib/journal";

const SITE = "https://toxome.app";

export const metadata: Metadata = {
  title: "Toxome | Journal",
  description:
    "Fiber science, slow fashion, and the invisible chemistry in your wardrobe — in plain English.",
  alternates: { canonical: "/journal" },
};

export default async function JournalPage() {
  const taxonomy = await getShopTaxonomy();
  const articles = getAllArticles();
  // The pinned piece stays the standing cover; everything else flows into Latest
  // (newest first). Falls back to the newest article if nothing is pinned.
  const featured = articles.find((a) => a.pinned) ?? articles[0];
  const rest = articles.filter((a) => a.slug !== featured?.slug);

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav taxonomy={taxonomy} />

      {/* Masthead */}
      <div className="shell" style={{ paddingTop: 120 }}>
        <div
          className="j-rise"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p className="eyebrow" style={{ margin: 0 }}>
            Toxome Journal
          </p>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              margin: 0,
            }}
          >
            Fiber science, plain English
          </p>
        </div>
        <hr className="soft-divider" style={{ margin: "28px 0 0" }} />
      </div>

      {/* Featured editorial — text-led cover */}
      {featured ? (
        <section className="shell" style={{ paddingTop: 72, paddingBottom: rest.length ? 64 : 120 }}>
          <article style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <p className="eyebrow j-rise" style={{ margin: "0 0 20px" }}>
              {featured.pillar}
            </p>

            <Link
              href={`/journal/${featured.slug}`}
              className="j-headline-link j-rise"
              style={{ animationDelay: "80ms" }}
            >
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 400,
                  fontSize: "clamp(32px, 4.2vw, 54px)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.025em",
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                {featured.title}
              </h1>
            </Link>

            <p
              className="j-rise"
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: "clamp(17px, 1.8vw, 20px)",
                lineHeight: 1.55,
                color: "var(--ink-2)",
                maxWidth: 540,
                margin: "22px auto 0",
                animationDelay: "160ms",
              }}
            >
              {featured.dek}
            </p>

            <div
              className="j-rise"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                marginTop: 32,
                flexWrap: "wrap",
                animationDelay: "240ms",
              }}
            >
              <Link href={`/journal/${featured.slug}`} className="pill-cta ghost">
                Read the essay
                <ArrowIcon />
              </Link>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                {featured.pillar === "The Manifesto" ? "Essay" : featured.pillar} ·{" "}
                {featured.readingTime}
              </span>
            </div>

            <div
              className="j-rise"
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 40,
                animationDelay: "300ms",
              }}
            >
              <ShareBar
                url={`${SITE}/journal/${featured.slug}`}
                title={featured.title}
                description={featured.dek}
                image={`${SITE}/journal/${featured.slug}/opengraph-image`}
              />
            </div>
          </article>
        </section>
      ) : (
        <section className="shell" style={{ paddingTop: 72, paddingBottom: 130 }}>
          <p style={{ fontSize: 16, color: "var(--ink-3)", maxWidth: 420, lineHeight: 1.6 }}>
            The first pieces are on their way. Check back shortly.
          </p>
        </section>
      )}

      {/* Latest — appears once there is more than one article */}
      {rest.length > 0 && (
        <section className="shell" style={{ paddingBottom: 130 }}>
          <p className="eyebrow" style={{ marginBottom: 24 }}>
            Latest
          </p>
          <div className="j-upnext">
            {rest.map((a) => (
              <Link
                key={a.slug}
                href={`/journal/${a.slug}`}
                className="j-upnext__row j-upnext__row--link"
              >
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ink-3)",
                    margin: "0 0 6px",
                  }}
                >
                  {a.pillar} · {formatDate(a.date)}
                </p>
                <h2
                  style={{
                    fontFamily: "var(--serif)",
                    fontWeight: 400,
                    fontSize: "clamp(20px, 2.4vw, 27px)",
                    lineHeight: 1.18,
                    letterSpacing: "-0.02em",
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  {a.title}
                </h2>
              </Link>
            ))}
          </div>
        </section>
      )}

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
