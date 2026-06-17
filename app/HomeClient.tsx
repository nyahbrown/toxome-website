"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import NewsletterPopup from "@/components/NewsletterPopup";
import ConsentNote from "@/components/ConsentNote";
import type { ShopTaxonomy } from "@/lib/supabase";
import type { Article } from "@/lib/journal";
import type { Product } from "@/types/product";

// `hover` is the second-view photo that crossfades in on hover.
// To enable a swap for a fiber, drop a "<name>-2.jpg" into /public/fibers
// and add a `hover` path here. Cards without `hover` keep the subtle zoom.
const FIBERS = [
  { name: "organic cotton", image: "/fibers/organic_cotton-1.jpg", hover: "/fibers/organic_cotton-2.jpg" },
  { name: "silk",   image: "/fibers/silk-1.jpg" },
  { name: "wool",   image: "/fibers/wool-1.jpg", hover: "/fibers/wool-2.jpg" },
  { name: "hemp",   image: "/fibers/hemp-1.jpg" },
  { name: "linen",  image: "/fibers/linen-1.jpg", hover: "/fibers/linen-2.jpg" },
];

function FiberTile({
  name,
  image,
  hover,
}: {
  name: string;
  image: string;
  hover?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/shop?fiber=${name}`} style={{ textDecoration: "none" }}>
      <div>
        {/* Portrait ratio matching Figma: 232×289 */}
        <div
          style={{
            position: "relative",
            paddingBottom: "124.5%",
            overflow: "hidden",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 600ms ease, opacity 500ms ease",
              transform: hovered && !hover ? "scale(1.04)" : "scale(1)",
              opacity: hover && hovered ? 0 : 1,
            }}
          />
          {hover && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={hover}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "opacity 500ms ease",
                opacity: hovered ? 1 : 0,
              }}
            />
          )}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: "-0.005em",
            color: "var(--ink)",
            marginTop: 17,
            fontFamily: "var(--sans)",
          }}
        >
          {name}
        </div>
      </div>
    </Link>
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

/* § The Journal, proof that we publish. The loudest authority signal. */
function JournalSection({ articles }: { articles: Article[] }) {
  if (!articles.length) return null;
  return (
    <section className="shell" style={{ paddingBlock: "clamp(56px, 11vw, 104px)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
          marginBottom: 30,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            The Journal
          </div>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(26px, 3vw, 40px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            what we&apos;re reading into.
          </h2>
        </div>
        <Link href="/journal" className="pill-cta ghost">
          Read the journal
          <ArrowIcon />
        </Link>
      </div>
      <div className="j-grid">
        {articles.map((a) => (
          <Link key={a.slug} href={`/journal/${a.slug}`} className="j-card">
            <div className="j-card__media">
              <Image
                src={a.hero}
                alt={a.title}
                fill
                sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
              />
            </div>
            <p className="j-card__kicker">{a.pillar}</p>
            <h3 className="j-card__title">{a.title}</h3>
            <p className="j-card__sub">{a.dek}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* Minimal product card, image card with info below (locked Flamingo style). */
function MiniProductCard({ p }: { p: Product }) {
  return (
    <Link
      href={`/shop/${p.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          position: "relative",
          paddingBottom: "125.56%",
          borderRadius: 10,
          overflow: "hidden",
          background: "var(--tan)",
        }}
      >
        {p.item_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.item_image}
            alt={p.item_name}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </div>
      <div style={{ paddingTop: 16 }}>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            color: "var(--ink)",
          }}
        >
          {p.item_name}
        </div>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            color: "var(--ink-2)",
            marginTop: 5,
          }}
        >
          {p.brand}
          {p.item_price != null && <> · ${p.item_price.toLocaleString()}</>}
        </div>
      </div>
    </Link>
  );
}

/* § Editor's Picks, hand-selected featured products. */
function EditorsPicksSection({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section style={{ background: "var(--bg)" }}>
      <div
        className="shell"
        style={{ paddingBlock: "clamp(56px, 11vw, 104px)" }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto 40px", textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Editor&apos;s Picks
          </div>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(26px, 3vw, 40px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            the pieces we keep reaching for.
          </h2>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: 1.5,
              color: "var(--ink-2)",
              margin: "16px 0 0",
            }}
          >
            every piece rated. every fiber accounted for.
          </p>
        </div>
        <div className="product-grid">
          {products.map((p) => (
            <MiniProductCard key={p.id} p={p} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <Link href="/shop/women" className="pill-cta ghost">
            Shop women&apos;s
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* § Newsletter, photo banner + email capture (merged report band + letter). */
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "submitting") return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setState("submitting");
    setErrorMessage("");
    try {
      // Captures to Supabase AND syncs to beehiiv server-side via /api/newsletter.
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "homepage_newsletter" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong.");
      }
      setState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setState("error");
    }
  }

  return (
    <section
      id="newsletter"
      style={{ position: "relative", overflow: "hidden", background: "var(--ink)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/report-bg.jpg"
        alt=""
        loading="lazy"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />
      {/* Dark overlay so the reversed-out text + form stay legible */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10, 6, 2, 0.58)",
        }}
      />
      <div
        className="shell"
        style={{ position: "relative", paddingBlock: "clamp(64px, 13vw, 120px)" }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <div
            className="eyebrow"
            style={{ color: "rgba(255,255,255,0.6)", marginBottom: 18 }}
          >
            Newsletter
          </div>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 400,
              fontSize: "clamp(28px, 3.4vw, 46px)",
              lineHeight: 1.14,
              letterSpacing: "-0.022em",
              color: "var(--cream)",
              margin: 0,
            }}
          >
            our weekly report on the state of fashion wellness
          </h2>
          {state === "success" ? (
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.85)",
                margin: "20px auto 0",
                maxWidth: 480,
              }}
            >
              You&apos;re in. Look for the next one this week.
            </p>
          ) : (
            <>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.8)",
                  margin: "16px auto 28px",
                  maxWidth: 520,
                }}
              >
                Stay up to date on science, trends, and clean brands.
              </p>
              <form
                onSubmit={handleSubmit}
                className="nl-form"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  maxWidth: 460,
                  margin: "0 auto",
                  height: 52,
                  paddingRight: 5,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.95)",
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="email address"
                  aria-label="email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: "100%",
                    padding: "0 8px 0 20px",
                    border: "none",
                    borderRadius: 999,
                    background: "transparent",
                    color: "var(--ink)",
                    fontFamily: "var(--sans)",
                    fontSize: 15,
                    outline: "none",
                    letterSpacing: "-0.005em",
                  }}
                />
                <button
                  type="submit"
                  className="nl-submit"
                  disabled={state === "submitting"}
                  aria-busy={state === "submitting"}
                  style={{
                    height: 44,
                    // Hugs its label and sits inset inside the capsule.
                    flex: "0 0 auto",
                    padding: "0 22px",
                    borderRadius: 999,
                    border: "none",
                    background: "var(--ink)",
                    color: "var(--cream)",
                    fontFamily: "var(--sans)",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "-0.005em",
                    whiteSpace: "nowrap",
                    cursor: state === "submitting" ? "not-allowed" : "pointer",
                    opacity: state === "submitting" ? 0.6 : 1,
                  }}
                >
                  {state === "submitting" ? "subscribing…" : "subscribe"}
                </button>
              </form>
              {state === "error" && errorMessage && (
                <p
                  role="alert"
                  style={{
                    display: "inline-block",
                    fontSize: 14,
                    color: "var(--cream)",
                    background: "rgba(10,6,2,0.62)",
                    padding: "6px 12px",
                    borderRadius: 999,
                    margin: "12px 0 0",
                  }}
                >
                  {errorMessage}
                </p>
              )}
              <ConsentNote
                lead='By clicking "subscribe," you agree to receive emails from Toxome and accept our'
                color="rgba(255,255,255,0.62)"
                linkColor="rgba(255,255,255,0.85)"
                style={{ margin: "18px auto 0", maxWidth: 480 }}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function HomeClient({
  taxonomy,
  articles,
  products,
}: {
  taxonomy: ShopTaxonomy;
  articles: Article[];
  products: Product[];
}) {
  return (
    <div style={{ background: "var(--bg)" }}>
      <Nav taxonomy={taxonomy} />

      {/* Hero, 670px on desktop; on phones cap to the viewport (svh avoids
          the iOS URL-bar resize jump) so the hero never overflows the screen. */}
      <section
        style={{
          position: "relative",
          height: "min(670px, 92svh)",
          overflow: "hidden",
          background: "var(--ink)",
        }}
      >
        <Image
          src="/hero-wool.jpg"
          alt="A shepherd shearing a sheep by hand in a mountain pasture, wool at its source"
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />
        {/* Overlay so the white headline + CTA stay legible over the photo,             slightly deeper through the middle where the text sits. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,6,2,0.30) 0%, rgba(10,6,2,0.50) 52%, rgba(10,6,2,0.42) 100%)",
          }}
        />
        {/* Film grain, fine fractal noise blended over the photo for an analog,             shot-on-film texture. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "150px 150px",
            mixBlendMode: "normal",
            opacity: 0.14,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 clamp(12px, 4vw, 40px)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(24px, 5vw, 32px)",
              maxWidth: 720,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <h1 className="hero-h1">
                plastic doesn&apos;t belong on your skin.
              </h1>
            </div>
            <Link
              href="/shop"
              className="hero-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                padding: "0 30px",
                borderRadius: 999,
                background: "var(--white)",
                color: "var(--ink)",
                fontFamily: "var(--sans)",
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: "-0.005em",
                textDecoration: "none",
                boxShadow: "0 6px 20px -8px rgba(10, 6, 2, 0.35)",
              }}
            >
              shop now
            </Link>
          </div>
        </div>
      </section>

      <EditorsPicksSection products={products} />

      {/* Browse by fiber, 50px gap below hero, matching Figma y=720 */}
      <section style={{ paddingTop: "clamp(40px, 9vw, 50px)", paddingBottom: "clamp(56px, 11vw, 96px)" }}>
        <div className="shell">
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Browse by fiber
          </div>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(24px, 3vw, 36px)",
              lineHeight: 1.15,
              letterSpacing: "-0.018em",
              color: "var(--ink)",
              margin: "0 0 12px",
              maxWidth: 620,
            }}
          >
            What your clothes are made of changes how they feel on your skin.
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              margin: "0 0 28px",
              maxWidth: 560,
            }}
          >
            Toxome scores every fiber for what it does to your body and the
            planet. Start with one to see the cleaner options and what to avoid.
          </p>
          <div className="fiber-hscroll">
            {FIBERS.map((f) => (
              <div className="fiber-hscroll__item" key={f.name}>
                <FiberTile name={f.name} image={f.image} hover={f.hover} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <JournalSection articles={articles} />
      <NewsletterSection />

      <NewsletterPopup />
      <Footer />
    </div>
  );
}
