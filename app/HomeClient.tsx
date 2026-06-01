"use client";

import { useState } from "react";
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

      <NewsletterPopup />
      <Footer />
    </div>
  );
}
