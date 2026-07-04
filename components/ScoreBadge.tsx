import type { RiskLevel } from "@/types/product";

// Shared Toxome verdict badge — the single source of the GREAT/GOOD/OKAY/BAD
// treatment shown on the product page and the shop-grid cards, so the score
// reads the same everywhere. Higher score = cleaner (matches the browser
// extension): >=85 Great, >=68 Good, >=40 Okay, else Bad. Color follows the
// 3-band ramp. When no score exists we fall back to the coarse risk level.
function verdict(
  score?: number | null,
  level?: RiskLevel | null
): { color: string; label: string } {
  if (score != null) {
    return {
      label:
        score >= 85 ? "Great" : score >= 68 ? "Good" : score >= 40 ? "Okay" : "Bad",
      color:
        score >= 68 ? "var(--risk-low)" : score >= 40 ? "var(--orange)" : "var(--red)",
    };
  }
  const fallback = {
    low: { color: "var(--risk-low)", label: "Good" },
    moderate: { color: "var(--orange)", label: "Okay" },
    high: { color: "var(--red)", label: "Bad" },
  } as const;
  return fallback[level ?? "low"];
}

export default function ScoreBadge({
  score,
  level,
  showScore = false,
  overlay = false,
}: {
  score?: number | null;
  level?: RiskLevel | null;
  // Append the numeric 0–100 score after the verdict word (e.g. "GREAT 96").
  showScore?: boolean;
  // Absolutely-positioned variant for the bottom-left corner of an image card.
  overlay?: boolean;
}) {
  const m = verdict(score, level);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--mono)",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ink)",
        background: m.color,
        padding: "5px 11px",
        borderRadius: 999,
        ...(overlay
          ? ({ position: "absolute", bottom: 14, left: 14, zIndex: 2 } as const)
          : null),
      }}
    >
      {m.label}
      {showScore && score != null && (
        <span style={{ fontWeight: 600 }}>{score}</span>
      )}
    </span>
  );
}
