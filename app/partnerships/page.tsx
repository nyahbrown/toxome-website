import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Brand Partnerships | Toxome",
  description:
    "Partner with Toxome to reach an audience that reads the label.",
  alternates: { canonical: "/partnerships" },
};

export default async function PartnershipsPage() {
  const taxonomy = await getShopTaxonomy();
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <main
        style={{
          background: "var(--cream)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 0",
        }}
      >
        <section
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 32px",
            textAlign: "center",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: 20 }}>
            Partnerships
          </p>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(32px, 4vw, 54px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            the audience that reads the label.
          </h1>
          <div style={{ marginTop: 32 }}>
            <a href="mailto:nyah@toxome.app" className="pill-cta ghost">
              Get in touch
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
