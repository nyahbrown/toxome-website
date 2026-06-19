import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";
import VerifyForm from "./VerifyForm";

export const metadata: Metadata = {
  title: "Get Verified | Toxome",
  description:
    "Brands can earn a Verified rung by sending their own documentation. No paid certification required.",
  alternates: { canonical: "/verify" },
};

export default async function VerifyPage() {
  const taxonomy = await getShopTaxonomy();
  return (
    <>
      <Nav taxonomy={taxonomy} />
      <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
        <section
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "140px 32px 96px",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: 18 }}>
            For brands
          </p>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 500,
              fontSize: "clamp(30px, 4vw, 46px)",
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              margin: "0 0 20px",
            }}
          >
            get verified for free.
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              margin: "0 0 8px",
              maxWidth: 560,
            }}
          >
            Send us your real documents and we will move your score to a Verified
            rung. We accept lab reports, supplier and dye-house disclosures, and
            test results.
          </p>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              margin: "0 0 40px",
              maxWidth: 560,
            }}
          >
            You do not need to buy OEKO-TEX or any paid certification. The files
            you already have are enough for us to review.
          </p>

          <VerifyForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
