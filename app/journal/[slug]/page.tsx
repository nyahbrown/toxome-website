import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ShareBar from "@/components/ShareBar";
import ArticleCta from "@/components/ArticleCta";
import JournalNewsletterCard from "@/components/JournalNewsletterCard";
import ShopTheEdit from "@/components/ShopTheEdit";
import TrendEditSections from "@/components/TrendEditSections";
import InlineMediaPlay from "@/components/InlineMediaPlay";
import { getShopTaxonomy } from "@/lib/supabase";
import { getAllSlugs, getArticle, formatDate } from "@/lib/journal";

const SITE = "https://toxome.app";
// Site-wide share image (the shepherd/wool photo). Articles point og:image,
// twitter:image, and JSON-LD at this so shared links show it too.
const OG_IMAGE = `${SITE}/opengraph-image.png`;

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
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.dek,
      images: [OG_IMAGE],
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

  // One end-of-article CTA, chosen by article type. Honors the frontmatter
  // `cta` (app | shop | guide | newsletter); falls back to a sensible default
  // derived from the article's mode/pillar when it isn't set.
  const bottomCta = resolveBottomCta(article);

  // Goop-style shoppable trend layout: only articles that ship a structured
  // `sections` array render TrendEditSections in place of the .j-prose body +
  // ShopTheEdit rail. Every other article keeps the exact original render.
  const isTrendEdit = (article.sections?.length ?? 0) > 0;

  const taxonomy = await getShopTaxonomy();
  const shareUrl = `${SITE}/journal/${slug}`;
  const shareImage = OG_IMAGE;
  // Pin media for a reader-initiated save: photo 0 of the article's pin pool
  // (the hero), rendered bare at 2:3. Same image the auto-pin cron uses.
  const pinImage = `${SITE}/journal/${slug}/pin/0`;
  const pinDescription = `${article.title}: ${article.dek}`;

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
            style={
              isTrendEdit
                ? {
                    // Cormorant, the single serif element on this page (the
                    // article title), per the locked type rule.
                    fontFamily: "var(--serif)",
                    fontWeight: 500,
                    fontSize: "clamp(38px, 5.4vw, 66px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    textTransform: "none",
                    color: "var(--ink)",
                    margin: "0 0 22px",
                  }
                : {
                    fontFamily: "var(--sans)",
                    fontWeight: 600,
                    fontSize: "clamp(30px, 4.1vw, 50px)",
                    lineHeight: 1.12,
                    letterSpacing: "-0.02em",
                    textTransform: "none",
                    color: "var(--ink)",
                    margin: "0 0 22px",
                  }
            }
          >
            {article.title}
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.5,
              textTransform: "none",
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
            {isTrendEdit
              ? article.readingTime
              : `${formatDate(article.date)} · ${article.readingTime}`}
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
            <ShareBar
              url={shareUrl}
              title={article.title}
              description={article.dek}
              image={pinImage}
            />
          </div>
        </div>
      </header>

      {/* Lead image, leads the essay, magazine-style. The trend-edit layout
          renders its own product-photography lead image inside
          TrendEditSections, so the shared hero figure is skipped there. */}
      {article.hero && !isTrendEdit && (
        <figure className="shell" style={{ margin: 0, paddingTop: 56 }}>
          <div
            className="j-article j-rise"
            style={{
              position: "relative",
              overflow: "hidden",
              border: "1px solid var(--hairline)",
              animationDelay: "120ms",
            }}
          >
            {article.heroVideo ? (
              <video
                src={article.heroVideo}
                poster={article.hero}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={article.heroAlt || article.title}
                style={{ display: "block", width: "100%", height: "auto" }}
                // Pinterest browser extension: pin the poster card, not the video.
                data-pin-media={pinImage}
                data-pin-description={pinDescription}
              />
            ) : (
              <Image
                src={article.hero}
                alt={article.heroAlt || article.dek || article.title}
                width={735}
                height={887}
                sizes="(max-width: 1000px) 100vw, 960px"
                style={{ display: "block", width: "100%", height: "auto" }}
                priority
                // Pinterest browser extension: pin the tall hero+title card, not the raw photo.
                data-pin-media={pinImage}
                data-pin-description={pinDescription}
              />
            )}
          </div>
        </figure>
      )}

      {/* Body. Trend-edit articles render the Goop-style shoppable layout;
          everything else keeps the original prose body + Shop the edit rail. */}
      {isTrendEdit ? (
        <TrendEditSections article={article} />
      ) : (
        <>
          <article className="shell" style={{ paddingTop: 56, paddingBottom: 64 }}>
            <div
              className="j-article j-prose"
              dangerouslySetInnerHTML={{ __html: article.html }}
            />
            <InlineMediaPlay />
            {/* In-body CTA. Skipped for "shop" articles: the end-of-article
                "Shop the edit" product rail is the single, stronger shop moment,
                so we don't double up on shopping prompts. */}
            {bottomCta !== "shop" && (
              <div className="j-article">
                {bottomCta === "newsletter" ? (
                  <JournalNewsletterCard />
                ) : (
                  <ArticleCta variant={bottomCta} />
                )}
              </div>
            )}
          </article>

          {/* Shop the edit — non-toxic women's pieces, right after the read */}
          <ShopTheEdit article={article} />
        </>
      )}

      {/* Sources + share + back, the de-emphasized reference tail */}
      <section className="shell" style={{ paddingBottom: 96 }}>
        <div className="j-article">
          {article.sources.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginBottom: 16 }}>
                Sources
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
              marginTop: 56,
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
              image={pinImage}
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

type BottomCta = "app" | "shop" | "guide" | "newsletter";

// Pick the single end-of-article CTA from the article's type. An explicit
// frontmatter `cta` always wins; otherwise we default by mode/pillar:
// news drives installs (app), shoppable pillars send to the edit (shop),
// fabric/explainer pieces send to the guide, brand/manifesto capture email.
function resolveBottomCta(article: {
  cta?: string;
  mode?: string;
  pillar?: string;
}): BottomCta {
  const explicit = (article.cta || "").toLowerCase();
  if (
    explicit === "app" ||
    explicit === "shop" ||
    explicit === "guide" ||
    explicit === "newsletter"
  ) {
    return explicit;
  }

  const pillar = (article.pillar || "").toLowerCase();
  if (article.mode === "news") return "app";
  if (pillar.includes("clean edit") || pillar.includes("brand")) return "shop";
  if (pillar.includes("fabric") || pillar.includes("scan")) return "guide";
  if (pillar.includes("manifesto") || pillar.includes("fashion wellness"))
    return "newsletter";
  return "app";
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
