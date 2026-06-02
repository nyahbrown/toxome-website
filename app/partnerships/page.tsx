import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Toxome | Partnerships",
  description:
    "Partner with Toxome — editorial features, the Clean Edit, and Editor's Picks for brands that take what touches the skin seriously.",
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
            let&apos;s work together.
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "var(--ink-2)",
              maxWidth: 560,
              margin: "24px auto 0",
            }}
          >
            Toxome partners with brands that take what touches the skin
            seriously — through editorial features in the Journal, the Clean
            Edit, and Editor&apos;s Picks. If your label belongs in the Fashion
            Wellness conversation, we&apos;d love to hear from you.
          </p>
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
