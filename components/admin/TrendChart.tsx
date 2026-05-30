"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Animated, interactive daily-trend chart. Dependency-free SVG so it stays
// fast and fully on-brand. Lines draw themselves in on load / range change, a
// soft gradient fills under the primary series, and hovering anywhere shows a
// crosshair + per-series dots + a tooltip with the exact numbers for that day.
// Series (Clicks / Views / Likes) can be toggled on and off.

export type DailyPoint = { day: string; clicks: number; views: number; likes: number };

type SeriesKey = "clicks" | "views" | "likes";
const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "clicks", label: "Clicks", color: "var(--ink)" },
  { key: "views", label: "Views", color: "var(--blue)" },
  { key: "likes", label: "Likes", color: "var(--honey)" },
];

const H = 240;
const PAD = { l: 34, r: 14, t: 14, b: 26 };

function fmtDay(iso: string): string {
  // iso = YYYY-MM-DD → M/D, avoiding timezone shifts from new Date(iso).
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function TrendChart({
  daily,
  rangeKey,
}: {
  daily: DailyPoint[];
  rangeKey: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [enabled, setEnabled] = useState<Record<SeriesKey, boolean>>({
    clicks: true,
    views: true,
    likes: false,
  });
  const [drawn, setDrawn] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  // Measure the container so the SVG renders crisp at real pixel width.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(320, Math.floor(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Replay the draw animation whenever the data, range, width, or toggles change.
  // Resetting drawn→false then →true on the next frame retriggers the CSS
  // line-draw transition; this is animation state, not derived render state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawn(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, [rangeKey, daily, width, enabled]);

  const n = daily.length;
  const innerW = width - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const activeSeries = SERIES.filter((s) => enabled[s.key]);
  const primary = activeSeries[0]?.key ?? null;

  const maxY = useMemo(() => {
    let m = 1;
    for (const p of daily) {
      for (const s of activeSeries) m = Math.max(m, p[s.key]);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily, enabled]);

  const xFor = (i: number) =>
    PAD.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yFor = (v: number) => PAD.t + innerH - (v / maxY) * innerH;

  const linePath = (key: SeriesKey) =>
    daily.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p[key])}`).join(" ");
  const areaPath = (key: SeriesKey) => {
    if (n === 0) return "";
    const top = daily.map((p, i) => `L ${xFor(i)} ${yFor(p[key])}`).join(" ");
    return `M ${xFor(0)} ${yFor(0)} ${top} L ${xFor(n - 1)} ${yFor(0)} Z`;
  };

  // Up to ~6 evenly spaced x labels so dates never crowd.
  const labelEvery = Math.max(1, Math.ceil(n / 6));
  // 3 horizontal gridlines: 0, mid, max.
  const gridVals = [0, maxY / 2, maxY];

  if (n === 0) {
    return (
      <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
        No activity in this range yet.
      </div>
    );
  }

  return (
    <div>
      {/* Legend / series toggles */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {SERIES.map((s) => {
          const on = enabled[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setEnabled((e) => ({ ...e, [s.key]: !e[s.key] }))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "var(--sans)",
                fontSize: 12,
                padding: "5px 11px",
                borderRadius: 999,
                border: "1px solid var(--hairline-strong)",
                background: on ? "var(--white)" : "transparent",
                color: on ? "var(--ink)" : "var(--ink-3)",
                cursor: "pointer",
                opacity: on ? 1 : 0.55,
                transition: "opacity 160ms ease, color 160ms ease",
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: s.color,
                  display: "inline-block",
                }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
        <svg
          width={width}
          height={H}
          onMouseMove={(e) => {
            const x = e.nativeEvent.offsetX;
            const ratio = (x - PAD.l) / innerW;
            const idx = Math.round(ratio * (n - 1));
            setHover(Math.min(n - 1, Math.max(0, idx)));
          }}
          onMouseLeave={() => setHover(null)}
          style={{ display: "block" }}
        >
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {/* gridlines + y labels */}
          {gridVals.map((v, i) => {
            const y = yFor(v);
            return (
              <g key={i}>
                <line
                  x1={PAD.l}
                  x2={width - PAD.r}
                  y1={y}
                  y2={y}
                  stroke="var(--hairline)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.l - 8}
                  y={y + 3}
                  textAnchor="end"
                  style={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--ink-3)" }}
                >
                  {Math.round(v)}
                </text>
              </g>
            );
          })}

          {/* primary series gets a soft animated fill */}
          {primary && (
            <path
              d={areaPath(primary)}
              fill={`url(#area-${primary})`}
              opacity={drawn ? 1 : 0}
              style={{ transition: "opacity 700ms ease 250ms" }}
            />
          )}

          {/* animated lines (draw-in via normalized pathLength) */}
          {activeSeries.map((s, si) => (
            <path
              key={s.key}
              d={linePath(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.key === "clicks" ? 2.4 : 1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={drawn ? 0 : 1}
              style={{
                transition: `stroke-dashoffset 900ms cubic-bezier(.22,.61,.36,1) ${si * 120}ms`,
              }}
            />
          ))}

          {/* x-axis date labels */}
          {daily.map((p, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <text
                key={p.day}
                x={xFor(i)}
                y={H - 8}
                textAnchor="middle"
                style={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--ink-3)" }}
              >
                {fmtDay(p.day)}
              </text>
            ) : null
          )}

          {/* hover crosshair + dots */}
          {hover !== null && (
            <g>
              <line
                x1={xFor(hover)}
                x2={xFor(hover)}
                y1={PAD.t}
                y2={PAD.t + innerH}
                stroke="var(--hairline-strong)"
                strokeWidth={1}
              />
              {activeSeries.map((s) => (
                <circle
                  key={s.key}
                  cx={xFor(hover)}
                  cy={yFor(daily[hover][s.key])}
                  r={4}
                  fill="var(--white)"
                  stroke={s.color}
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>

        {/* tooltip */}
        {hover !== null && (
          <div
            style={{
              position: "absolute",
              top: 4,
              left: Math.min(
                Math.max(xFor(hover) + 10, 0),
                Math.max(0, width - 150)
              ),
              pointerEvents: "none",
              background: "var(--white)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: 10,
              padding: "8px 10px",
              boxShadow: "0 6px 20px rgba(59,60,58,0.10)",
              minWidth: 120,
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 6,
              }}
            >
              {fmtDay(daily[hover].day)}
            </div>
            {activeSeries.map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  color: "var(--ink-2)",
                  marginTop: 2,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: s.color,
                      display: "inline-block",
                    }}
                  />
                  {s.label}
                </span>
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                  {daily[hover][s.key]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
