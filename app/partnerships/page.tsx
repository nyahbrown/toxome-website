import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Partner with Toxome",
  description:
    "Feature your brand where Fashion Wellness is defined. Get in touch with the Toxome partnerships team.",
  alternates: { canonical: "/partnerships" },
  openGraph: {
    title: "Partner with Toxome",
    description: "Feature your brand where Fashion Wellness is defined.",
    url: "/partnerships",
    siteName: "Toxome",
  },
};

export const revalidate = 86400;

const CONTACT = "mailto:partnerships@toxome.app?subject=Partnership%20enquiry";

export default async function PartnershipsPage() {
  const taxonomy = await getShopTaxonomy();

  return (
    <main
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Nav taxonomy={taxonomy} />

      <section
        className="shell"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "140px 0 130px",
        }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          {/* Logo lockup */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <Image
              src="/toxome-logo.png"
              alt=""
              width={92}
              height={60}
              priority
              style={{ display: "block" }}
            />
            <span
              style={{
                fontFamily: "var(--sans)",
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                textTransform: "none",
                color: "var(--ink)",
              }}
            >
              Toxome
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 600,
              fontSize: "clamp(34px, 5vw, 56px)",
              lineHeight: 1.06,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              textTransform: "none",
              margin: "0 0 18px",
            }}
          >
            Partner with us.
          </h1>

          <p
            style={{
              fontSize: 19,
              lineHeight: 1.5,
              color: "var(--ink-2)",
              textTransform: "none",
              margin: "0 auto 36px",
              maxWidth: 460,
            }}
          >
            Feature your brand where{" "}
            <span style={{ fontStyle: "italic" }}>Fashion Wellness</span> is
            defined.
          </p>

          <a
            href={CONTACT}
            className="pill-cta"
            style={{
              background: "var(--white)",
              color: "var(--ink)",
              textTransform: "none",
              boxShadow:
                "0 0 0 1px var(--hairline-strong) inset, 0 6px 22px rgba(59,60,58,0.1)",
            }}
          >
            Get in Touch
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
