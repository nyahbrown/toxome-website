import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Toxome | Partnerships",
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
          paddingTop: 88,
          paddingBottom: 130,
        }}
      >
        <section
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "56px 32px 0",
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
