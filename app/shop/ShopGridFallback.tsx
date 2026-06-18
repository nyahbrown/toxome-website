import Link from "next/link";
import type { Product } from "@/lib/supabase";
import type { ShopSection } from "./ShopClient";

// Server-rendered product grid used as the <Suspense> fallback for the
// client-only ShopClient (which de-opts to client rendering via
// useSearchParams). This guarantees real, crawlable <a href="/shop/{id}">
// links land in the static HTML so products are never orphaned, Google can
// discover and pass link equity to them. On the client, ShopClient hydrates
// and replaces this with the interactive, filterable grid.
//
// Critical for CLS: this must reserve the same height as the hydrated grid.
// We mirror ShopClient's section filter (gender) so the fallback renders the
// exact same product set the client will, leaving the layout unchanged when
// ShopClient takes over. Routes that instead pass `fallback={null}` get a
// zero-height server render, then a full-grid pop-in that shoves everything
// below it down (measured CLS up to ~1.0 on collection pages).
export default function ShopGridFallback({
  products,
  section = null,
  heading,
}: {
  products: Product[];
  section?: ShopSection;
  heading?: string;
}) {
  // Same gender constraint ShopClient applies (see ShopClient `filtered`).
  const sectionGender =
    section === "women" ? "Women"
    : section === "men" ? "Men"
    : section === "kids" ? "Kids"
    : section === "home" ? "Home"
    : null;
  const items = sectionGender
    ? products.filter((p) => p.gender === sectionGender)
    : products;
  const title = heading ?? "Shop non-toxic clothing by fiber";

  return (
    <div className="shell" style={{ paddingTop: 24, paddingBottom: 64 }}>
      {/* Crawlable heading + intro (client ShopClient replaces this on hydration). */}
      <header style={{ maxWidth: 640, marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 600,
            fontSize: "clamp(26px, 3vw, 38px)",
            lineHeight: 1.15,
            letterSpacing: "-0.018em",
            color: "var(--ink)",
            margin: "0 0 14px",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--ink-2)",
            margin: 0,
          }}
        >
          Every piece is hand-curated by Toxome and made from cleaner, lower-toxin
          natural fibers. Browse by fiber to find clothing that is kinder to your
          skin and the planet.
        </p>
      </header>
      <div className="product-grid">
      {items.map((p) => {
        const img = p.item_image || p.images?.[0] || null;
        return (
          <Link
            key={p.id}
            href={`/shop/${p.id}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              style={{
                position: "relative",
                paddingBottom: "125.56%",
                background: "var(--tan)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt={p.item_name}
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
            <div style={{ paddingTop: 20 }}>
              <div
                style={{
                  fontFamily: "var(--sans)",
                  fontWeight: 500,
                  fontSize: 20,
                  lineHeight: 1.2,
                  color: "var(--ink)",
                }}
              >
                {p.item_name}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 4 }}>
                {p.brand}
                {p.item_price != null && (
                  <>
                    <span style={{ color: "var(--ink-3)", margin: "0 6px" }}>·</span>
                    ${p.item_price.toLocaleString()}
                  </>
                )}
              </div>
            </div>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
