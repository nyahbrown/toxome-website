import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getShopTaxonomy } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Toxome | Journal",
  description: "Fiber science, slow fashion, and the invisible chemistry in your wardrobe.",
};

export default async function JournalPage() {
  const taxonomy = await getShopTaxonomy();
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Nav taxonomy={taxonomy} />

      <div className="shell" style={{ paddingTop: 80, paddingBottom: 120 }}>
        <div style={{ maxWidth: 720 }}>
          <p className="eyebrow" style={{ marginBottom: 20 }}>Toxome Journal</p>
          <h1 style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 400,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            color: "var(--ink)",
            margin: "0 0 20px",
          }}>
            Fiber science,<br />plain English.
          </h1>
          <p style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "var(--ink-3)",
            maxWidth: 520,
            margin: 0,
          }}>
            What your clothes are actually made of, what that does to your body, and how to think about it without losing your mind.
          </p>
        </div>

        <hr className="soft-divider" style={{ margin: "60px 0" }} />

        <p style={{
          fontFamily: "var(--mono)",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          margin: "0 0 8px",
        }}>
          First posts coming soon
        </p>
        <p style={{ fontSize: 15, color: "var(--ink-3)", margin: 0, maxWidth: 400, lineHeight: 1.55 }}>
          We are writing about endocrine disruptors, the polyester problem, and what "natural fiber" actually means. Check back shortly.
        </p>
      </div>

      <Footer />
    </main>
  );
}
