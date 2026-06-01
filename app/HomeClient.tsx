"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import NewsletterPopup from "@/components/NewsletterPopup";
import type { ShopTaxonomy } from "@/lib/supabase";
import type { Article } from "@/lib/journal";
import type { Product } from "@/types/product";

const FIBERS = [
  { name: "organic cotton", image: "/fibers/cotton.jpg" },
  { name: "silk",   image: "/fibers/silk.jpg" },
  { name: "wool",   image: "/fibers/wool.jpg" },
  { name: "hemp",   image: "/fibers/hemp.jpg" },
  { name: "linen",  image: "/fibers/linen.jpg" },
];

function FiberTile({ name, image }: { name: string; image: string }) {
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
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 400ms ease",
              transform: hovered ? "scale(1.04)" : "scale(1)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 18,
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

/* § The naming moment — plant the category flag. Pure belief, no CTA. */
function NamingSection() {
  return (
    <section style={{ padding: "112px 0 0" }}>
      <div className="shell">
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 20 }}>
            A new category
          </div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 300,
              fontSize: "clamp(30px, 4vw, 52px)",
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            we call it <em style={{ fontStyle: "italic" }}>fashion wellness.</em>
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              color: "var(--ink-2)",
              maxWidth: 580,
              margin: "26px auto 0",
            }}
          >
            The idea that what you wear is a health decision — like what you
            eat, or what you put on your skin. Your food has a label. Your water
            has a watchdog. The fabric against your skin all day has neither.
            That&apos;s the room we built Toxome to fill.
          </p>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fibers/linen.jpg"
        alt="A close weave of natural linen"
        style={{
          display: "block",
          width: "100%",
          height: "min(420px, 40vw)",
          objectFit: "cover",
          objectPosition: "center",
          marginTop: 72,
        }}
      />
    </section>
  );
}

/* § The Journal — proof that we publish. The loudest authority signal. */
function JournalSection({ articles }: { articles: Article[] }) {
  if (!articles.length) return null;
  return (
    <section className="shell" style={{ paddingTop: 104, paddingBottom: 104 }}>
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
              fontFamily: "var(--serif)",
              fontWeight: 300,
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

/* Minimal product card — image card with info below (locked Flamingo style). */
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
            fontFamily: "var(--serif)",
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            textTransform: "lowercase",
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

/* § The Clean Edit — commerce framed as a standard, not a store. */
function CleanEditSection({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section style={{ background: "var(--bg)" }}>
      <div className="shell" style={{ paddingTop: 104, paddingBottom: 104 }}>
        <div style={{ maxWidth: 600, margin: "0 auto 40px", textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            The Clean Edit
          </div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 300,
              fontSize: "clamp(26px, 3vw, 40px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            clothes that earned their place.
          </h2>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: "clamp(16px, 1.8vw, 20px)",
              lineHeight: 1.5,
              color: "var(--ink-2)",
              margin: "16px 0 0",
            }}
          >
            every piece scored. every fiber accounted for.
          </p>
        </div>
        <div className="product-grid">
          {products.map((p) => (
            <MiniProductCard key={p.id} p={p} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <Link href="/shop" className="pill-cta ghost">
            Shop the edit
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* § State of Fashion Wellness — the one dark band. Authority by declaration. */
function ReportSection() {
  return (
    <section style={{ background: "var(--ink)" }}>
      <div className="shell" style={{ paddingTop: 120, paddingBottom: 120 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 1,
              background: "var(--honey)",
              margin: "0 auto 28px",
            }}
          />
          <div
            className="eyebrow"
            style={{ color: "rgba(255,255,255,0.5)", marginBottom: 18 }}
          >
            Coming 2026
          </div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 300,
              fontSize: "clamp(28px, 3.4vw, 46px)",
              lineHeight: 1.14,
              letterSpacing: "-0.022em",
              color: "var(--cream)",
              margin: 0,
            }}
          >
            the first annual report on what we&apos;re all wearing.
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.78)",
              maxWidth: 560,
              margin: "24px auto 0",
            }}
          >
            124 million tonnes of fiber made last year. 60% of it, plastic. Once
            a year, Toxome publishes the cleanest brands, the worst offenders,
            and what&apos;s changing.
          </p>
          <div style={{ marginTop: 36 }}>
            <Link
              href="#newsletter"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                padding: "0 30px",
                borderRadius: 999,
                background: "var(--cream)",
                color: "var(--ink)",
                fontFamily: "var(--sans)",
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: "-0.005em",
                textDecoration: "none",
              }}
            >
              Get early access
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* § The Fashion Wellness Letter — email capture, the growth engine. */
function NewsletterInline() {
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
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase
        .from("newsletter_signups")
        .insert({ email: trimmed, source: "homepage_inline" });
      if (error) {
        // Duplicate = already subscribed; honor it as success.
        if (error.code === "23505") {
          setState("success");
          return;
        }
        throw error;
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
    <section id="newsletter" style={{ background: "var(--bg)" }}>
      <div className="shell" style={{ paddingTop: 104, paddingBottom: 120 }}>
        <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            The Fashion Wellness Letter
          </div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 300,
              fontSize: "clamp(26px, 3vw, 40px)",
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            a sunday letter on what you&apos;re wearing.
          </h2>
          {state === "success" ? (
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                margin: "20px auto 0",
                maxWidth: 460,
              }}
            >
              You&apos;re in. Look for the first letter this Sunday.
            </p>
          ) : (
            <>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "var(--ink-2)",
                  margin: "16px auto 24px",
                  maxWidth: 460,
                }}
              >
                Fibers, dyes, and the science underneath wellness fashion. No
                spam.
              </p>
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  gap: 10,
                  maxWidth: 440,
                  margin: "0 auto",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <input
                  type="email"
                  required
                  placeholder="email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  style={{
                    flex: 1,
                    minWidth: 220,
                    height: 48,
                    padding: "0 18px",
                    border: "1px solid var(--hairline-strong)",
                    borderRadius: 999,
                    background: "var(--white)",
                    color: "var(--ink)",
                    fontFamily: "var(--sans)",
                    fontSize: 15,
                    outline: "none",
                    letterSpacing: "-0.005em",
                  }}
                />
                <button
                  type="submit"
                  disabled={state === "submitting"}
                  style={{
                    height: 48,
                    padding: "0 28px",
                    borderRadius: 999,
                    border: "1px solid var(--ink)",
                    background: "var(--ink)",
                    color: "var(--white)",
                    fontFamily: "var(--sans)",
                    fontSize: 15,
                    fontWeight: 500,
                    letterSpacing: "-0.005em",
                    cursor: state === "submitting" ? "not-allowed" : "pointer",
                    opacity: state === "submitting" ? 0.6 : 1,
                  }}
                >
                  {state === "submitting" ? "..." : "Subscribe"}
                </button>
              </form>
              {state === "error" && errorMessage && (
                <p style={{ fontSize: 12, color: "var(--red)", margin: "10px 0 0" }}>
                  {errorMessage}
                </p>
              )}
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

      {/* Hero — 670px matching Figma */}
      <section
        style={{
          position: "relative",
          height: 670,
          overflow: "hidden",
          background: "var(--ink)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-field.jpg"
          alt="A farmer gathering grasses in a paddy field — natural fiber at its source"
          fetchPriority="high"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />
        {/* Overlay so the white headline + CTA stay legible over the photo —
            slightly deeper through the middle where the text sits. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,6,2,0.30) 0%, rgba(10,6,2,0.50) 52%, rgba(10,6,2,0.42) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 32,
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
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 300,
                  fontSize: "clamp(27px, 4.2vw, 48px)",
                  color: "var(--white)",
                  textAlign: "center",
                  lineHeight: 1.2,
                  letterSpacing: "-0.018em",
                  margin: 0,
                  textWrap: "balance",
                }}
              >
                60% of the average closet is made from plastic.
              </h1>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "clamp(18px, 2.4vw, 26px)",
                  color: "var(--white)",
                  opacity: 0.92,
                  textAlign: "center",
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                yours doesn&apos;t have to be.
              </p>
            </div>
            <Link
              href="/shop"
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

      <NamingSection />

      {/* Browse by fiber — 50px gap below hero, matching Figma y=720 */}
      <section style={{ paddingTop: 50, paddingBottom: 96 }}>
        <div className="shell">
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Browse by fiber
          </div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 300,
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
          <div className="fiber-grid">
            {FIBERS.map((f) => (
              <FiberTile key={f.name} name={f.name} image={f.image} />
            ))}
          </div>
        </div>
      </section>

      <JournalSection articles={articles} />
      <CleanEditSection products={products} />
      <ReportSection />
      <NewsletterInline />

      <NewsletterPopup />
      <Footer />
    </div>
  );
}
