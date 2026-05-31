import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";
import { getAllArticles, formatDate } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Toxome | Journal",
  description:
    "Fiber science, slow fashion, and the invisible chemistry in your wardrobe — in plain English.",
  alternates: { canonical: "/journal" },
};

export default async function JournalPage() {
  const taxonomy = await getShopTaxonomy();
  const articles = getAllArticles();
  // The pinned piece stays the standing cover; everything else flows into the
  // grid (newest first). Falls back to the newest article if nothing is pinned.
  const featured = articles.find((a) => a.pinned) ?? articles[0];
  const rest = articles.filter((a) => a.slug !== featured?.slug);

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav taxonomy={taxonomy} />

      {/* Featured editorial — text-led cover (title lowercased on the index) */}
      {featured && (
        <section
          className="shell"
          style={{ paddingTop: 132, paddingBottom: rest.length ? 80 : 130 }}
        >
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
                  textTransform: "lowercase",
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
                {featured.readingTime}
              </span>
            </div>
          </article>
        </section>
      )}

      {/* Photo grid — the rest of the Journal */}
      {rest.length > 0 && (
        <section className="shell" style={{ paddingBottom: 130 }}>
          <div className="j-grid">
            {rest.map((a) => (
              <Link key={a.slug} href={`/journal/${a.slug}`} className="j-card">
                <div className="j-card__media">
                  <Image
                    src={a.hero}
                    alt={a.title}
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                  />
                </div>
                <p className="j-card__kicker">
                  {a.pillar} · {formatDate(a.date)}
                </p>
                <h2 className="j-card__title">{a.title}</h2>
                <p className="j-card__sub">{a.dek}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!featured && (
        <div className="shell" style={{ paddingTop: 132, paddingBottom: 130 }}>
          <p style={{ fontSize: 16, color: "var(--ink-3)", maxWidth: 420, lineHeight: 1.6 }}>
            The first pieces are on their way. Check back shortly.
          </p>
        </div>
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
