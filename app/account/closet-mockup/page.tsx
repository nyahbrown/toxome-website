"use client";

// Closet dashboard MOCKUP — populated with 4 real garments Nyah scanned
// (label photos in /public/mockup-closet). Scores are computed live from each
// piece's actual fiber composition + care keywords via calcToxomeScore, so the
// numbers are the real Toxome Score, not hand-picked. Dev/preview route, not in nav.
import {
  calcToxomeScore,
  scoreToRiskLevel,
  scoreColor,
  hazardColor,
  prettyFiber,
  fiberScore,
  fiberKey,
} from "@/lib/fabricScores";
import { computeClosetStats, type ClosetScan } from "@/lib/closet";

const CARD_SHADOW =
  "0 1px 2px rgba(59, 60, 58, 0.04), 0 14px 32px rgba(59, 60, 58, 0.07)";

/* ── The 4 real scanned garments ─────────────────────────────────── */
type RawItem = {
  image: string;
  itemDescription: string;
  brandName: string;
  category: string;
  composition: { fiber: string; percentage: number }[];
  careKeywords: string[];
  origin: string;
};

const RAW_ITEMS: RawItem[] = [
  {
    image: "/mockup-closet/rayon-nylon.jpg",
    itemDescription: "Textured white top",
    brandName: "Unbranded",
    category: "Tops",
    composition: [
      { fiber: "rayon", percentage: 74 },
      { fiber: "nylon", percentage: 26 },
    ],
    careKeywords: ["wash by hand", "do not bleach", "do not tumble dry", "line dry"],
    origin: "Made in China",
  },
  {
    image: "/mockup-closet/organic-cotton.jpg",
    itemDescription: "Embroidered white blouse",
    brandName: "Unbranded",
    category: "Tops",
    composition: [{ fiber: "organic cotton", percentage: 100 }],
    careKeywords: ["fair grown organic"],
    origin: "Organic cotton",
  },
  {
    image: "/mockup-closet/wool-cashmere.jpg",
    itemDescription: "Taupe knit sweater",
    brandName: "Unbranded",
    category: "Sweaters",
    composition: [
      { fiber: "wool", percentage: 70 },
      { fiber: "cashmere", percentage: 30 },
    ],
    careKeywords: ["hand wash cold", "do not bleach", "dry flat", "dry clean"],
    origin: "Made in China",
  },
  {
    image: "/mockup-closet/indigo-luna.jpg",
    itemDescription: "Brown ribbed top — “you are loved”",
    brandName: "Indigo Luna Store",
    category: "Tops",
    composition: [
      { fiber: "viscose", percentage: 90 },
      { fiber: "spandex", percentage: 10 },
    ],
    careKeywords: ["gentle cold wash", "do not wring"],
    origin: "Ethically made in Indonesia",
  },
];

// Turn each raw item into a scored ClosetScan, computing the real Toxome Score.
const SCANS: (ClosetScan & { image: string; origin: string })[] = RAW_ITEMS.map(
  (it, i) => {
    const compMap: Record<string, number> = {};
    for (const c of it.composition) compMap[c.fiber] = c.percentage;
    const score =
      calcToxomeScore(compMap, { careKeywords: it.careKeywords }) ?? 0;
    const level = scoreToRiskLevel(score) ?? "moderate";
    const natural = it.composition
      .filter((c) => fiberScore(c.fiber) >= 60)
      .reduce((s, c) => s + c.percentage, 0);
    return {
      id: `real-${i + 1}`,
      itemDescription: it.itemDescription,
      brandName: it.brandName,
      category: it.category,
      scanImageUrl: it.image,
      image: it.image,
      origin: it.origin,
      scanDate: null,
      overallHazardScore: score,
      overallHazardLevel: level,
      naturalFiberPercentage: natural,
      composition: it.composition,
    };
  }
);

const RISK = {
  low: { color: "var(--risk-low)", label: "low" },
  moderate: { color: "var(--orange)", label: "moderate" },
  high: { color: "var(--red)", label: "high" },
} as const;

/* ── Shared shells ───────────────────────────────────────────────── */
function CardShell({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--white)",
        border: "1px solid var(--hairline)",
        borderRadius: 18,
        padding: 26,
        boxShadow: CARD_SHADOW,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span className="eyebrow" style={{ display: "block", marginBottom: 18 }}>
        {eyebrow}
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {children}
      </div>
    </section>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--mono)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

/* ── Stats from the real scans ───────────────────────────────────── */
const stats = computeClosetStats(SCANS);

function segments() {
  const b = stats.riskBreakdown;
  const total = b.low + b.moderate + b.high || 1;
  return [
    { key: "low", count: b.low, ...RISK.low },
    { key: "moderate", count: b.moderate, ...RISK.moderate },
    { key: "high", count: b.high, ...RISK.high },
  ].map((s) => ({ ...s, pct: (s.count / total) * 100 }));
}

function fiberSlices() {
  const top = stats.fiberDistribution.slice(0, 5);
  const otherShare = 1 - top.reduce((s, f) => s + f.share, 0);
  return otherShare > 0.005
    ? [...top, { fiber: "other", share: otherShare, hazardScore: 50 }]
    : top;
}

function FiberRing({ size = 132, stroke = 16 }: { size?: number; stroke?: number }) {
  const slices = fiberSlices();
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = slices.map((s) => {
    const len = s.share * circ;
    const a = { ...s, len, offset };
    offset += len;
    return a;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={stroke} />
      {arcs.map((a, i) => (
        <circle
          key={a.fiber + i}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={a.fiber === "other" ? "var(--ink-3)" : hazardColor(a.hazardScore)}
          strokeWidth={stroke}
          strokeDasharray={`${a.len} ${circ}`}
          strokeDashoffset={-a.offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

function FiberLegend({ fontSize = 13 }: { fontSize?: number }) {
  const slices = fiberSlices();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 130 }}>
      {slices.map((s) => (
        <div key={s.fiber} style={{ display: "flex", alignItems: "center", gap: 12, fontSize, color: "var(--ink)" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: s.fiber === "other" ? "var(--ink-3)" : hazardColor(s.hazardScore),
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1 }}>{s.fiber === "other" ? "Other" : prettyFiber(s.fiber)}</span>
          <span style={{ color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(s.share * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function RiskBar() {
  const segs = segments();
  return (
    <div
      style={{
        display: "flex",
        height: 12,
        borderRadius: 999,
        overflow: "hidden",
        background: "var(--tan)",
        boxShadow: "inset 0 1px 2px rgba(59,60,58,0.08)",
      }}
    >
      {segs.map((s) => (s.count > 0 ? <div key={s.key} style={{ width: `${s.pct}%`, background: s.color }} /> : null))}
    </div>
  );
}

function RiskLegend() {
  const segs = segments();
  return (
    <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--ink-2)" }}>
      {segs.map((s) => (
        <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: s.color }} />
          <strong style={{ fontWeight: 600, color: "var(--ink)" }}>{s.count}</strong> {s.label}
        </span>
      ))}
    </div>
  );
}

/* ── Merged closet card (M3 nested bento — the shipped direction) ── */
function ClosetCard() {
  const tray: React.CSSProperties = {
    background: "var(--cream)",
    borderRadius: 14,
    padding: "20px 22px",
    border: "1px solid var(--hairline)",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
  };
  return (
    <CardShell eyebrow="your closet">
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 14 }}>
        <div style={{ ...tray, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 56, lineHeight: 1, letterSpacing: "-0.04em", color: "var(--ink)", marginBottom: 6 }}>
            {stats.avgToxomeScore}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 18 }}>
            avg score · {stats.totalCount} items
          </div>
          <div style={{ marginBottom: 12 }}><RiskBar /></div>
          <RiskLegend />
        </div>
        <div style={{ ...tray }}>
          <MiniLabel>what you own</MiniLabel>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <FiberRing size={132} stroke={16} />
            <FiberLegend fontSize={13} />
          </div>
        </div>
      </div>
    </CardShell>
  );
}

/* ── Item card for the grid ──────────────────────────────────────── */
function ItemCard({ scan }: { scan: ClosetScan & { image: string; origin: string } }) {
  const color = scoreColor(scan.overallHazardScore);
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--hairline)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: CARD_SHADOW,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--tan)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scan.image}
          alt={scan.itemDescription}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "var(--white)",
            borderRadius: 12,
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 2px 10px rgba(59,60,58,0.14)",
            minWidth: 52,
          }}
        >
          <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 22, lineHeight: 1, color }}>
            {scan.overallHazardScore}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 3 }}>
            score
          </span>
        </div>
      </div>
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
          {scan.brandName} · {scan.category}
        </div>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: 16, color: "var(--ink)", marginBottom: 12, lineHeight: 1.3 }}>
          {scan.itemDescription}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scan.composition.map((c) => (
            <div key={c.fiber} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-2)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: hazardColor(fiberScore(c.fiber)), flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{prettyFiber(fiberKey(c.fiber))}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{c.percentage}%</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-3)" }}>{scan.origin}</div>
      </div>
    </div>
  );
}

export default function ClosetMockupPage() {
  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", padding: "80px clamp(20px, 5vw, 64px) 120px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>
          your closet
        </span>
        <h1 style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 40, letterSpacing: "-0.02em", color: "var(--ink)", margin: "0 0 8px" }}>
          know what&rsquo;s in your clothes.
        </h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 40px", maxWidth: 520 }}>
          Four pieces scanned from your own closet, scored on the Toxome rubric.
        </p>

        <ClosetCard />

        <h2 style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)", margin: "48px 0 22px" }}>
          recent scans
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {SCANS.map((s) => (
            <ItemCard key={s.id} scan={s} />
          ))}
        </div>
      </div>
    </main>
  );
}
