import Link from "next/link";
import type { Product } from "@/types/product";

// Minimal product card, image card with info below (locked Flamingo style).
// Shared by the homepage Editor's Picks and the Journal "Shop the edit" rail so
// score/image/price/styling stay consistent. Pass `showScore` to surface the
// Toxome score as a pill on the image (used in the Journal rail).
export default function MiniProductCard({
  p,
  showScore = false,
}: {
  p: Product;
  showScore?: boolean;
}) {
  return (
    <Link
      href={`/shop/${p.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          position: "relative",
          paddingBottom: "125.56%",
          borderRadius: 10,
          overflow: "hidden",
          background: "var(--tan)",
        }}
      >
        {p.item_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.item_image}
            alt={p.item_name}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {showScore && p.toxome_score != null && (
          <span
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--ink)",
              background: "rgba(252,251,247,0.9)",
              backdropFilter: "blur(8px) saturate(150%)",
              WebkitBackdropFilter: "blur(8px) saturate(150%)",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background:
                  p.toxome_score >= 68
                    ? "var(--risk-low)"
                    : p.toxome_score >= 40
                      ? "var(--orange)"
                      : "var(--red)",
              }}
            />
            {p.toxome_score}
          </span>
        )}
      </div>
      <div style={{ paddingTop: 16 }}>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            color: "var(--ink)",
          }}
        >
          {p.item_name}
        </div>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            color: "var(--ink-2)",
            marginTop: 5,
          }}
        >
          {p.brand}
          {p.item_price != null && <> · ${p.item_price.toLocaleString()}</>}
        </div>
      </div>
    </Link>
  );
}
