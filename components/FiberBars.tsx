import Link from "next/link";
// Single source of truth for the fiber-composition bars so the product detail
// page and the Quick Shop sheet render an identical treatment: labeled row
// (fiber name left, percentage right) over a thin hazard-colored bar.
import { fiberHazardColor, prettyFiber } from "@/lib/fabricScores";
import { fiberGuideHref } from "@/lib/fiberGuide";
import { collectionSlugForFiber } from "@/lib/shopPages";

// A named fiber goes to its guide page: the reader looking at a composition is
// asking what the fiber IS, not what else is made of it. Fibers with no guide
// page fall back to their collection page, then to the filtered shop.
function fiberHref(fiber: string): string {
  const guide = fiberGuideHref(fiber);
  if (guide) return guide;
  const slug = collectionSlugForFiber(fiber);
  return slug
    ? `/shop/collection/${slug}`
    : `/shop?fiber=${encodeURIComponent(fiber.toLowerCase())}`;
}

export default function FiberBars({
  entries,
  style,
  onNavigate,
}: {
  entries: [string, number][];
  style?: React.CSSProperties;
  onNavigate?: () => void;
}) {
  if (entries.length === 0) return null;
  // Render each fiber as its share of the row's own total, which is what the
  // scorer does (calcToxomeScore divides by the same sum), so a bar can never
  // disagree with the score it sits next to. Stored composition is canonically
  // percent — the normalize_product_write trigger scales any fraction-convention
  // write by 100 — so the total is normally 100 and this is an identity.
  //
  // It replaces a per-value guess, `pct > 1 ? pct : pct * 100`, which read any
  // value <= 1 as a fraction and multiplied it. A 1% fiber is <= 1, so five live
  // products rendered one as 100%: the Sézane Will Jacket (95 organic cotton /
  // 4 polyester / 1 elastane) and Warp + Weft's jeans (99 cotton / 1 elastane)
  // all claimed "elastane 100%". Never infer a row's convention from one value.
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, ...style }}>
      {entries.map(([fiber, pct]) => {
        const percent = total > 0 ? (pct / total) * 100 : 0;
        return (
          <div key={fiber}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: 14,
                color: "var(--ink)",
                letterSpacing: "-0.005em",
                marginBottom: 5,
              }}
            >
              <Link
                href={fiberHref(fiber)}
                onClick={onNavigate}
                style={{
                  color: "inherit",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  textDecorationColor: "var(--hairline-strong)",
                }}
              >
                {prettyFiber(fiber)}
              </Link>
              <span style={{ color: "var(--ink-2)" }}>
                {Math.round(percent)}%
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: "var(--hairline)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, percent))}%`,
                  height: "100%",
                  background: fiberHazardColor(fiber),
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
