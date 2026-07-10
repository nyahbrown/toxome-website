"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import ScoreBadge from "@/components/ScoreBadge";
import { useQuickShop } from "@/components/QuickShopProvider";

// Grid card used inside a QuickShopProvider. Visually identical to
// MiniProductCard (image + score pill + name/brand below), but adds a hover-
// reveal "Quick Shop" button over the image. A normal click on the image or the
// meta still navigates to the full product page; the button is a sibling of the
// links (never nested inside an anchor), so it opens the quick-view sheet
// instead of navigating.
export default function QuickShopCard({ p }: { p: Product }) {
  const { open } = useQuickShop();
  const href = `/shop/${p.id}`;

  return (
    <div className="qs-card">
      <div className="qs-card__media">
        <Link href={href} className="qs-card__media-link" aria-label={p.item_name}>
          {p.item_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.item_image}
              alt={p.item_name}
              loading="lazy"
              decoding="async"
            />
          )}
        </Link>
        {(p.toxome_score != null || p.risk_level) && (
          <ScoreBadge score={p.toxome_score} level={p.risk_level} showScore overlay />
        )}
        <button
          type="button"
          className="qs-trigger"
          onClick={() => open(p)}
          aria-label={`Quick shop ${p.item_name}`}
        >
          Quick Shop
        </button>
      </div>

      <Link href={href} className="qs-card__meta">
        <div className="qs-card__name">{p.item_name}</div>
        <div className="qs-card__brand">
          {p.brand}
          {p.item_price != null && <> · ${p.item_price.toLocaleString()}</>}
        </div>
      </Link>
    </div>
  );
}
