import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { VARIANTS, VariantContent } from "@/components/CertLab";
import { availableLogos } from "@/lib/certLogos";
import { getShopTaxonomy } from "@/lib/supabase";

// Internal design exploration — keep it out of search.
export const metadata: Metadata = {
  title: "Certifications · All Variations",
  robots: { index: false, follow: false },
};

export default async function AllVariationsPage() {
  const taxonomy = await getShopTaxonomy();
  const logos = availableLogos();

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <main
        style={{
          background: "var(--linen)",
          minHeight: "100vh",
          paddingTop: 64,
          paddingBottom: 120,
        }}
      >
        <div
          className="shell"
          style={{ textAlign: "center", paddingTop: 48, paddingBottom: 8 }}
        >
          <div
            className="eyebrow"
            style={{ color: "var(--ink-3)", marginBottom: 18 }}
          >
            Design lab · certifications
          </div>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(26px, 3.6vw, 40px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              margin: "0 auto 10px",
            }}
          >
            All five, stacked.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--ink-2)",
              margin: "0 auto",
              maxWidth: 460,
            }}
          >
            Every variation on one page. Same circular badge, five treatments.
          </p>
        </div>

        {VARIANTS.map((v) => (
          <section key={v.id} style={{ paddingTop: 8 }}>
            <div className="shell">
              <div className="cl-band">
                <span className="cl-band__id">{v.id}</span>
                <span className="cl-band__name">{v.name}</span>
                <span className="cl-band__desc">{v.desc}</span>
              </div>
            </div>
            <VariantContent variant={v.id} logos={logos} />
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
