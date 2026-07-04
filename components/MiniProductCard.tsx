import Link from "next/link";
import type { Product } from "@/types/product";
import ScoreBadge from "@/components/ScoreBadge";

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
        {showScore && (p.toxome_score != null || p.risk_level) && (
          <ScoreBadge
            score={p.toxome_score}
            level={p.risk_level}
            showScore
            overlay
          />
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
