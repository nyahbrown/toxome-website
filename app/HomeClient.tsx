"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { ShopTaxonomy } from "@/lib/supabase";

const FIBERS = [
  { name: "cotton", image: "/fibers/cotton.jpg" },
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
          background: "var(--espresso)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-bg.png"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        {/* Subtle overlay so white text stays legible */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(10, 6, 2, 0.28)",
          }}
        />
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-bg.png"
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
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(28px, 5vw, 60px)",
              color: "var(--white)",
              textAlign: "center",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: 0,
              maxWidth: 900,
            }}
          >
            the future of fashion is healthy
          </h1>
        </div>
      </section>

      {/* Browse by fiber — 50px gap below hero, matching Figma y=720 */}
      <section style={{ paddingTop: 50, paddingBottom: 96 }}>
        <div className="shell">
          <div className="eyebrow" style={{ marginBottom: 24 }}>
            Browse by fiber
          </div>
          <div className="fiber-grid">
            {FIBERS.map((f) => (
              <FiberTile key={f.name} name={f.name} image={f.image} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
