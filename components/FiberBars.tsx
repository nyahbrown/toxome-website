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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, ...style }}>
      {entries.map(([fiber, pct]) => {
        const percent = pct > 1 ? pct : pct * 100;
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
