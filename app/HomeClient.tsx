"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import NewsletterPopup from "@/components/NewsletterPopup";
import type { ShopTaxonomy } from "@/lib/supabase";

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

export default function HomeClient({
  taxonomy,
}: {
  taxonomy: ShopTaxonomy;
}) {
  // The 11MB hero video downloads eagerly and starves the page's JS chunk
  // loads on a real network, which blocked React hydration on the homepage
  // (nav dropdowns dead, no navigation). Defer it until after hydration —
  // this effect only runs once the page is interactive, so the JS loads and
  // hydrates first, then the video mounts and plays. The poster image below
  // shows instantly, so there's no visual change.
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => {
    setShowVideo(true);
  }, []);

  return (
    <div style={{ background: "var(--bg)" }}>
      <Nav taxonomy={taxonomy} />

      {/* Hero — 670px matching Figma */}
      <section
        style={{
          position: "relative",
          height: 670,
          overflow: "hidden",
          background: "var(--espresso)",
        }}
      >
        <picture>
          <source srcSet="/hero-bg.avif" type="image/avif" />
          <source srcSet="/hero-bg.webp" type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-bg.png"
            alt=""
            fetchPriority="high"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </picture>
        {/* Overlay so white headline + CTA stay legible over the video */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(10, 6, 2, 0.42)",
          }}
        />
        {showVideo && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster="/hero-bg.webp"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          >
            <source src="/meditation.mp4" type="video/mp4" />
          </video>
        )}

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
              gap: 24,
              maxWidth: 860,
            }}
          >
            <h1
              style={{
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontSize: "clamp(30px, 5.2vw, 62px)",
                color: "var(--white)",
                textAlign: "center",
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
                margin: 0,
                textWrap: "balance",
              }}
            >
              60% of the average closet is made from plastic.{" "}
              <em style={{ fontStyle: "italic", opacity: 0.94 }}>
                yours doesn&apos;t have to be.
              </em>
            </h1>
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

      {/* Browse by fiber — 50px gap below hero, matching Figma y=720 */}
      <section style={{ paddingTop: 50, paddingBottom: 96 }}>
        <div className="shell">
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Browse by fiber
          </div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
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

      <NewsletterPopup />
      <Footer />
    </div>
  );
}
