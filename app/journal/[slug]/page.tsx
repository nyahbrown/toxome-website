import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ShareBar from "@/components/ShareBar";
import ArticleCta, { type CtaVariant } from "@/components/ArticleCta";
import { getShopTaxonomy } from "@/lib/supabase";
import { getAllSlugs, getArticle, formatDate } from "@/lib/journal";

const SITE = "https://toxome.app";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Toxome`,
    description: article.dek,
    keywords: article.keywords.length ? article.keywords : undefined,
    authors: [{ name: "Toxome Editors" }],
    alternates: { canonical: `/journal/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.dek,
      url: `/journal/${slug}`,
      siteName: "Toxome",
      publishedTime: article.date,
      modifiedTime: article.date,
      section: article.pillar,
      tags: article.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.dek,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const taxonomy = await getShopTaxonomy();
  const shareUrl = `${SITE}/journal/${slug}`;
  const shareImage = `${SITE}/journal/${slug}/opengraph-image`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.dek,
    image: shareImage,
    datePublished: article.date,
    dateModified: article.date,
    articleSection: article.pillar,
    inLanguage: "en-US",
    keywords: article.keywords.join(", "),
    author: { "@type": "Organization", name: "Toxome", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "Toxome",
      logo: { "@type": "ImageObject", url: `${SITE}/icon.png` },
    },
    mainEntityOfPage: shareUrl,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE}/journal` },
      { "@type": "ListItem", position: 3, name: article.title, item: shareUrl },
    ],
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Nav taxonomy={taxonomy} />

      {/* Header */}
      <header className="shell" style={{ paddingTop: 124 }}>
        <div className="j-article j-rise" style={{ textAlign: "center" }}>
          <Link
            href="/journal"
            className="eyebrow"
            style={{ display: "inline-block", marginBottom: 22 }}
          >
            {article.pillar} · Fashion Wellness
          </Link>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 300,
              fontSize: "clamp(32px, 4.4vw, 54px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              margin: "0 0 22px",
            }}
          >
            {article.title}
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(18px, 2.4vw, 23px)",
              lineHeight: 1.5,
              color: "var(--ink-2)",
              margin: "0 auto 26px",
              maxWidth: 560,
            }}
          >
            {article.dek}
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
            Toxome Editors · {formatDate(article.date)} · {article.readingTime}
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
            <ShareBar
              url={shareUrl}
              title={article.title}
              description={article.dek}
              image={shareImage}
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <article className="shell" style={{ paddingTop: 56, paddingBottom: 40 }}>
        <hr
          className="soft-divider j-rise"
          style={{ maxWidth: 80, margin: "8px auto 56px", animationDelay: "120ms" }}
        />
        <div
          className="j-article j-prose"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
        <div className="j-article">
          <ArticleCta variant={(article.cta as CtaVariant) || "app"} />
        </div>
      </article>

      {/* Sources + share + back */}
      <section className="shell" style={{ paddingBottom: 120 }}>
        <div className="j-article">
          {article.sources.length > 0 && (
            <>
              <hr className="soft-divider" style={{ margin: "8px 0 28px" }} />
              <p className="eyebrow" style={{ marginBottom: 16 }}>
                Further reading
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {article.sources.map((s) => (
                  <li key={s.href} style={{ marginBottom: 14 }}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: "var(--ink-2)",
                        textDecoration: "underline",
                        textUnderlineOffset: 4,
                        textDecorationColor: "var(--hairline-strong)",
                      }}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
              marginTop: 44,
              paddingTop: 32,
              borderTop: "1px solid var(--hairline)",
            }}
          >
            <Link href="/journal" className="pill-cta ghost">
              <ArrowLeftIcon />
              Back to the Journal
            </Link>
            <ShareBar
              url={shareUrl}
              title={article.title}
              description={article.dek}
              image={shareImage}
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13 8H3M7 4 3 8l4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
