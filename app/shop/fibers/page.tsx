import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getShopTaxonomy } from "@/lib/supabase";

const SITE = "https://toxome.app";

export const metadata: Metadata = {
  title: "Shop by Natural Fiber: Non-Toxic Clothing by Material | Toxome",
  description:
    "Shop non-toxic clothing by natural fiber. Organic cotton, linen, hemp, wool, merino, silk, cashmere, alpaca, ramie, and TENCEL lyocell, each scored by Toxome for what it does to your body.",
  alternates: { canonical: "/shop/fibers" },
};

// The fibers featured on the hub. `guide` is the fiber-guide slug (also the image
// name at /fibers/guide/<guide>.jpg); `collection` is the shop collection page.
// TENCEL lyocell is placed last as the one clean regenerated (not natural) fiber.
type FiberCard = {
  name: string;
  guide: string;
  collection: string;
  note: string;
};

const FIBERS: FiberCard[] = [
  {
    name: "organic cotton",
    guide: "organic_cotton",
    collection: "non-toxic-organic-cotton-clothing",
    note: "grown without synthetic pesticides, a soft, breathable everyday plant fiber.",
  },
  {
    name: "linen",
    guide: "linen",
    collection: "non-toxic-linen-clothing",
    note: "flax that breathes, runs cool, and softens with every wash.",
  },
  {
    name: "hemp",
    guide: "hemp",
    collection: "non-toxic-hemp-clothing",
    note: "a durable plant fiber grown with little water and no need for pesticides.",
  },
  {
    name: "wool",
    guide: "wool",
    collection: "non-toxic-wool-clothing",
    note: "a natural animal fiber that insulates and resists odor; favor untreated.",
  },
  {
    name: "merino wool",
    guide: "merino_wool",
    collection: "non-toxic-merino-wool-clothing",
    note: "fine enough to feel soft, regulates temperature without synthetic finishes.",
  },
  {
    name: "silk",
    guide: "silk",
    collection: "non-toxic-silk-clothing",
    note: "a natural protein fiber that breathes and regulates temperature on its own.",
  },
  {
    name: "cashmere",
    guide: "cashmere",
    collection: "non-toxic-cashmere-clothing",
    note: "soft goat down that insulates without the plastic of acrylic knits.",
  },
  {
    name: "alpaca",
    guide: "alpaca",
    collection: "non-toxic-alpaca-clothing",
    note: "no lanolin and a smooth surface, often gentler on skin than sheep wool.",
  },
  {
    name: "ramie",
    guide: "ramie",
    collection: "non-toxic-ramie-clothing",
    note: "a strong, linen-like plant fiber that breathes and resists mildew.",
  },
  {
    name: "tencel lyocell",
    guide: "tencel_lyocell",
    collection: "non-toxic-tencel-lyocell-clothing",
    note: "a clean fiber regenerated from wood in a closed loop that reuses its solvent.",
  },
];

// Hub page for shopping by material. Mirrors /shop/collections styling, but each
// card leads with the fiber's guide image and links into both the shop
// collection (buy) and the fiber guide (learn), closing the shop <-> guide loop.
export default async function FibersHub() {
  const taxonomy = await getShopTaxonomy();

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Shop by Natural Fiber",
    url: `${SITE}/shop/fibers`,
    hasPart: FIBERS.map((f) => ({
      "@type": "WebPage",
      name: f.name,
      url: `${SITE}/shop/collection/${f.collection}`,
    })),
  };

  return (
    <>
      <Nav taxonomy={taxonomy} />
      <JsonLd data={schema} />

      <main className="shell" style={{ padding: "120px 21px 96px" }}>
        <div className="eyebrow" style={{ color: "var(--ink-3)", marginBottom: 14, textAlign: "center" }}>
          Shop by fiber
        </div>
        <h1
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 500,
            fontSize: "clamp(34px, 5vw, 56px)",
            lineHeight: 1.05,
            color: "var(--ink)",
            margin: "0 auto 20px",
            maxWidth: 720,
            textAlign: "center",
          }}
        >
          shop by natural fiber
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)", maxWidth: "60ch", margin: "0 auto 56px", textAlign: "center" }}>
          the natural fibers humans have worn for thousands of years, each scored for what it does to
          your body. start with the fiber, then buy the safe one.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {FIBERS.map((f) => (
            <div
              key={f.guide}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "var(--white)",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <Link
                href={`/shop/collection/${f.collection}`}
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5" }}>
                  <Image
                    src={`/fibers/guide/${f.guide}.jpg`}
                    alt={`${f.name} fiber`}
                    fill
                    sizes="(max-width: 720px) 50vw, 260px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: "16px 18px 6px" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6, lineHeight: 1.3 }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-3)" }}>{f.note}</div>
                </div>
              </Link>
              <Link
                href={`/guide/${f.guide}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  margin: "8px 18px 18px",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  color: "var(--ink-2)",
                  textDecoration: "none",
                }}
              >
                read the guide
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
