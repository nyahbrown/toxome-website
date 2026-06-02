"use client";

// ⭐ SAVED DESIGN REFERENCE — do not delete.
// Canonical source of truth for account/dashboard card design (Nyah loves the
// whole UI here). When designing any new data card, pull from this lab first.
// Design lab for the closet card. Two groups:
//   A) each closet-card variation beside the real "what you own" fiber card
//   B) mockups that MERGE the closet + fiber cards into one unified card
// Dev/design tool — not linked in nav. Renders with DEV_SCANS mock data.
import { computeClosetStats, type ClosetStats } from "@/lib/closet";
import { hazardColor, prettyFiber } from "@/lib/fabricScores";
import { DEV_SCANS } from "@/lib/devAccountData";

const CARD_SHADOW =
  "0 1px 2px rgba(59, 60, 58, 0.04), 0 14px 32px rgba(59, 60, 58, 0.07)";

const RISK = {
  low: { color: "var(--risk-low)", label: "low" },
  moderate: { color: "var(--orange)", label: "moderate" },
  high: { color: "var(--red)", label: "high" },
} as const;

function segments(stats: ClosetStats) {
  const b = stats.riskBreakdown;
  const total = b.low + b.moderate + b.high || 1;
  return [
    { key: "low", count: b.low, ...RISK.low },
    { key: "moderate", count: b.moderate, ...RISK.moderate },
    { key: "high", count: b.high, ...RISK.high },
  ].map((s) => ({ ...s, pct: (s.count / total) * 100 }));
}

function fiberSlices(stats: ClosetStats) {
  const top = stats.fiberDistribution.slice(0, 5);
  const otherShare = 1 - top.reduce((s, f) => s + f.share, 0);
  return otherShare > 0.005
    ? [...top, { fiber: "other", share: otherShare, hazardScore: 50 }]
    : top;
}

/* ── Shared bits ─────────────────────────────────────────────────── */
function CardShell({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
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

function Tag({ tag, note }: { tag: string; note: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink)",
        }}
      >
        {tag}
      </span>
      <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{note}</span>
    </div>
  );
}

function FiberRing({ stats, size = 150, stroke = 20 }: { stats: ClosetStats; size?: number; stroke?: number }) {
  const slices = fiberSlices(stats);
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

function FiberLegend({ stats, fontSize = 14 }: { stats: ClosetStats; fontSize?: number }) {
  const slices = fiberSlices(stats);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 140 }}>
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

function ScoreRing({ stats, size = 150, stroke = 15 }: { stats: ClosetStats; size?: number; stroke?: number }) {
  const segs = segments(stats);
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = segs
    .filter((s) => s.count > 0)
    .map((s) => {
      const len = (s.pct / 100) * circ;
      const a = { ...s, len, offset };
      offset += len;
      return a;
    });
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--tan)" strokeWidth={stroke} />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.len} ${circ}`}
            strokeDashoffset={-a.offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 600,
            fontSize: size * 0.27,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "var(--ink)",
          }}
        >
          {stats.avgToxomeScore}
        </span>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginTop: 4,
          }}
        >
          score
        </span>
      </div>
    </div>
  );
}

function RiskBar({ stats }: { stats: ClosetStats }) {
  const segs = segments(stats);
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

function RiskLegend({ stats }: { stats: ClosetStats }) {
  const segs = segments(stats);
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

/* ── The real "what you own" fiber card ──────────────────────────── */
function WhatYouOwn({ stats }: { stats: ClosetStats }) {
  return (
    <CardShell eyebrow="what you own">
      <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
        <FiberRing stats={stats} size={180} stroke={22} />
        <FiberLegend stats={stats} />
      </div>
    </CardShell>
  );
}

/* ── A) Standalone closet-card variations (beside the fiber card) ── */
function VarRefined({ stats }: { stats: ClosetStats }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 26 }}>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 68, lineHeight: 1, letterSpacing: "-0.04em", color: "var(--ink)" }}>
          {stats.avgToxomeScore}
          <span style={{ fontSize: 22, fontWeight: 500, color: "var(--ink-3)", letterSpacing: "-0.02em" }}>/100</span>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ color: "var(--ink-2)" }}>avg toxome score</span>
          <span>{stats.totalCount} items in closet</span>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}><RiskBar stats={stats} /></div>
      <RiskLegend stats={stats} />
    </>
  );
}

function VarRing({ stats }: { stats: ClosetStats }) {
  const segs = segments(stats);
  return (
    <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
      <ScoreRing stats={stats} size={168} stroke={16} />
      <div style={{ flex: 1, minWidth: 150 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>
          {stats.totalCount} items in closet
        </div>
        {segs.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--ink)", marginBottom: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
            <span style={{ flex: 1, textTransform: "capitalize" }}>{s.label}</span>
            <span style={{ color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VarBento({ stats }: { stats: ClosetStats }) {
  const segs = segments(stats);
  const maxCount = Math.max(...segs.map((s) => s.count), 1);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(130px, 0.8fr) 1fr", gap: 14 }}>
      <div style={{ background: "var(--cream)", borderRadius: 14, padding: "22px 20px", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)", border: "1px solid var(--hairline)" }}>
        <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 52, lineHeight: 1, letterSpacing: "-0.04em", color: "var(--ink)" }}>{stats.avgToxomeScore}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 10 }}>avg score · {stats.totalCount} items</span>
      </div>
      <div style={{ background: "var(--cream)", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, justifyContent: "center", border: "1px solid var(--hairline)" }}>
        {segs.map((s) => (
          <div key={s.key}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-2)", marginBottom: 6, textTransform: "capitalize" }}>
              <span>{s.label}</span>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{s.count}</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "var(--tan)", overflow: "hidden" }}>
              <div style={{ width: `${(s.count / maxCount) * 100}%`, height: "100%", background: s.color, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VarMinimal({ stats }: { stats: ClosetStats }) {
  const segs = segments(stats);
  const total = segs.reduce((n, s) => n + s.count, 0) || 1;
  return (
    <>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 92, lineHeight: 0.95, letterSpacing: "-0.05em", color: "var(--ink)", marginBottom: 6 }}>{stats.avgToxomeScore}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 26 }}>avg toxome score · {stats.totalCount} items</div>
      <div style={{ display: "flex", height: 4, borderRadius: 999, overflow: "hidden", marginBottom: 16 }}>
        {segs.map((s) => (s.count > 0 ? <div key={s.key} style={{ width: `${(s.count / total) * 100}%`, background: s.color }} /> : null))}
      </div>
      <div style={{ display: "flex", gap: 20, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>
        {segs.map((s) => (
          <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color }} />
            {s.count} {s.label}
          </span>
        ))}
      </div>
    </>
  );
}

/* ── B) MERGED cards (closet + fiber in one) ─────────────────────── */

// M1 · Unified split — score/risk on the left, fiber donut on the right.
function MergeSplit({ stats }: { stats: ClosetStats }) {
  return (
    <CardShell eyebrow="your closet">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 22 }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 60, lineHeight: 1, letterSpacing: "-0.04em", color: "var(--ink)" }}>
              {stats.avgToxomeScore}
              <span style={{ fontSize: 20, fontWeight: 500, color: "var(--ink-3)" }}>/100</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "var(--ink-2)" }}>avg toxome score</span>
              <span>{stats.totalCount} items</span>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}><RiskBar stats={stats} /></div>
          <RiskLegend stats={stats} />
        </div>
        <div>
          <MiniLabel>what you own</MiniLabel>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <FiberRing stats={stats} size={140} stroke={17} />
            <FiberLegend stats={stats} fontSize={13} />
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// M2 · Twin gauges — score ring + fiber ring, each with its legend.
function MergeTwinRings({ stats }: { stats: ClosetStats }) {
  const segs = segments(stats);
  return (
    <CardShell eyebrow="your closet">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <MiniLabel>toxome score · {stats.totalCount} items</MiniLabel>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <ScoreRing stats={stats} size={140} stroke={14} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 110 }}>
              {segs.map((s) => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--ink)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
                  <span style={{ flex: 1, textTransform: "capitalize" }}>{s.label}</span>
                  <span style={{ color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <MiniLabel>what you own</MiniLabel>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <FiberRing stats={stats} size={140} stroke={17} />
            <FiberLegend stats={stats} fontSize={13} />
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// M3 · Nested bento — score+risk tray beside a fiber tray (double-bezel).
function MergeBento({ stats }: { stats: ClosetStats }) {
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
          <div style={{ marginBottom: 12 }}><RiskBar stats={stats} /></div>
          <RiskLegend stats={stats} />
        </div>
        <div style={{ ...tray }}>
          <MiniLabel>what you own</MiniLabel>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <FiberRing stats={stats} size={132} stroke={16} />
            <FiberLegend stats={stats} fontSize={13} />
          </div>
        </div>
      </div>
    </CardShell>
  );
}

export default function ClosetLabPage() {
  const stats = computeClosetStats(DEV_SCANS);

  const sideBySide = [
    { tag: "01", note: "refined editorial", node: <VarRefined stats={stats} /> },
    { tag: "02", note: "score ring", node: <VarRing stats={stats} /> },
    { tag: "03", note: "nested bento", node: <VarBento stats={stats} /> },
    { tag: "04", note: "minimal hero", node: <VarMinimal stats={stats} /> },
  ];

  const merged = [
    { tag: "M1", note: "unified split — score left, fiber right", node: <MergeSplit stats={stats} /> },
    { tag: "M2", note: "twin gauges — score ring + fiber ring", node: <MergeTwinRings stats={stats} /> },
    { tag: "M3", note: "nested bento — two recessed trays", node: <MergeBento stats={stats} /> },
  ];

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", padding: "80px clamp(20px, 5vw, 64px) 120px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: 24, letterSpacing: "-0.015em", color: "var(--ink)", margin: "0 0 8px" }}>
          closet card — variations
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 8px", maxWidth: 540 }}>
          Group A keeps the cards separate; Group B merges &ldquo;your
          closet&rdquo; and &ldquo;what you own&rdquo; into one card. Pick a
          direction and I&apos;ll wire it in.
        </p>

        {/* Group A */}
        <h2 style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)", margin: "44px 0 24px" }}>
          A · beside the fiber card
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {sideBySide.map((v) => (
            <div key={v.tag}>
              <Tag tag={v.tag} note={v.note} />
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "stretch" }}>
                <CardShell eyebrow="your closet">{v.node}</CardShell>
                <WhatYouOwn stats={stats} />
              </div>
            </div>
          ))}
        </div>

        {/* Group B */}
        <h2 style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)", margin: "64px 0 24px" }}>
          B · merged into one card
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          {merged.map((v) => (
            <div key={v.tag}>
              <Tag tag={v.tag} note={v.note} />
              {v.node}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
