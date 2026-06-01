"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TrendChart from "@/components/admin/TrendChart";

// Brand-traffic dashboard. Reads the consolidated /api/admin/analytics endpoint
// (one round-trip → get_brand_dashboard) and renders KPIs with period deltas, a
// daily trend, and top brands / products / searches. Built for pulling a pitch
// number fast while also showing what's resonating.

type Kpis = {
  clicks: number;
  unique_shoppers: number;
  views: number;
  likes: number;
  searches: number;
  prev_clicks: number;
  has_prev: boolean;
};
type DailyPoint = { day: string; clicks: number; views: number; likes: number };
type BrandRow = {
  brand: string;
  clicks: number;
  unique_shoppers: number;
  views: number;
  likes: number;
  last_click: string | null;
};
type ProductRow = { product_name: string; brand: string; clicks: number; views: number };
type SearchRow = { q: string; count: number };

type Dashboard = {
  kpis: Kpis;
  daily: DailyPoint[];
  top_brands: BrandRow[];
  top_products: ProductRow[];
  top_searches: SearchRow[];
};

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "all", label: "All time" },
] as const;

function rangeWord(days: string): string {
  return days === "all" ? "to date" : `in the last ${days} days`;
}

// ---- small presentational helpers ----------------------------------------

const card: React.CSSProperties = {
  background: "var(--white)",
  border: "1px solid var(--hairline-strong)",
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};
const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  margin: "0 0 14px",
};
const cell: React.CSSProperties = {
  padding: "10px 12px",
  fontFamily: "var(--sans)",
  fontSize: 13,
  color: "var(--ink-2)",
  letterSpacing: "-0.005em",
  whiteSpace: "nowrap",
};
const headCell: React.CSSProperties = {
  ...cell,
  color: "var(--ink-3)",
  fontFamily: "var(--sans)",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span
      style={{
        fontFamily: "var(--sans)",
        fontSize: 12,
        color: up ? "#5c7a47" : "var(--red)",
        marginLeft: 8,
      }}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  suffix,
}: {
  label: string;
  value: string | number;
  delta?: number | null;
  suffix?: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 150px",
        minWidth: 140,
        background: "var(--white)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <div style={sectionLabel}>{label}</div>
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 26,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
        {suffix ? (
          <span style={{ fontSize: 14, color: "var(--ink-3)" }}> {suffix}</span>
        ) : null}
        {delta !== undefined && <Delta pct={delta ?? null} />}
      </div>
    </div>
  );
}

// ---- main -----------------------------------------------------------------

export default function BrandTrafficPanel({
  getToken,
}: {
  getToken: () => Promise<string>;
}) {
  const [days, setDays] = useState<string>("30");
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const t = await getToken();
      const res = await fetch(`/api/admin/analytics?days=${days}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load brand traffic");
    } finally {
      setLoading(false);
    }
  }, [days, getToken]);

  useEffect(() => {
    // Fetches from an external API (Supabase), not synchronous derived state,
    // so the cascading-render rule does not apply — same pattern as /admin.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const k = data?.kpis;
  const clickDelta = useMemo<number | null>(() => {
    if (!k || !k.has_prev) return null;
    if (k.prev_clicks === 0) return k.clicks > 0 ? 100 : 0;
    return ((k.clicks - k.prev_clicks) / k.prev_clicks) * 100;
  }, [k]);
  const ctr = k && k.views > 0 ? (k.clicks / k.views) * 100 : null;

  const copyPitch = (r: BrandRow) => {
    const line = `Toxome sent ${r.brand} ${r.clicks} click${
      r.clicks === 1 ? "" : "s"
    } from ${r.unique_shoppers} clean-fabric shopper${
      r.unique_shoppers === 1 ? "" : "s"
    } ${rangeWord(days)} (plus ${r.views} product views) — verify it in your own analytics (utm_source=toxome.app).`;
    void navigator.clipboard?.writeText(line);
    setCopied(r.brand);
    window.setTimeout(() => setCopied((c) => (c === r.brand ? null : c)), 1800);
  };

  const exportCsv = () => {
    const rows = data?.top_brands ?? [];
    const header = ["brand", "clicks", "unique_shoppers", "views", "likes", "last_click"];
    const body = rows.map((r) =>
      [r.brand, r.clicks, r.unique_shoppers, r.views, r.likes, r.last_click ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `toxome-brand-traffic-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header + range pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ ...sectionLabel, margin: 0 }}>Brand traffic</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RANGES.map((r) => {
            const on = days === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setDays(r.key)}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "var(--ink)" : "var(--hairline-strong)"}`,
                  background: on ? "var(--ink)" : "var(--white)",
                  color: on ? "var(--white)" : "var(--ink-2)",
                  cursor: "pointer",
                  letterSpacing: "-0.005em",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ ...card, color: "var(--red)", fontFamily: "var(--sans)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {!error && !data && loading && (
        <div style={{ ...card, color: "var(--ink-3)", fontFamily: "var(--sans)", fontSize: 13 }}>
          Loading…
        </div>
      )}

      {!error && data && k && (
        <div style={{ opacity: loading ? 0.6 : 1 }}>
          {/* KPI cards */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <KpiCard label="Outbound clicks" value={k.clicks} delta={clickDelta} />
            <KpiCard label="Unique shoppers" value={k.unique_shoppers} />
            <KpiCard label="Product views" value={k.views} />
            <KpiCard label="Likes" value={k.likes} />
            <KpiCard
              label="Click rate"
              value={ctr === null ? "—" : ctr.toFixed(0)}
              suffix={ctr === null ? "" : "%"}
            />
          </div>

          {/* Daily trend — animated, interactive SVG */}
          <div style={card}>
            <div style={sectionLabel}>Daily trend</div>
            <TrendChart daily={data.daily} rangeKey={days} />
          </div>

          {/* Top brands */}
          <div style={card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={sectionLabel}>Top brands</div>
              <button
                onClick={exportCsv}
                disabled={!data.top_brands.length}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--hairline-strong)",
                  background: "var(--white)",
                  color: "var(--ink-2)",
                  cursor: data.top_brands.length ? "pointer" : "not-allowed",
                }}
              >
                Export CSV
              </button>
            </div>
            {data.top_brands.length === 0 ? (
              <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
                No brand activity yet {rangeWord(days)}. Once shoppers click “Buy at
                [brand]”, brands show up here.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ ...headCell, textAlign: "left" }}>Brand</th>
                      <th style={{ ...headCell, textAlign: "right" }}>Clicks</th>
                      <th style={{ ...headCell, textAlign: "right" }}>Shoppers</th>
                      <th style={{ ...headCell, textAlign: "right" }}>Views</th>
                      <th style={{ ...headCell, textAlign: "right" }}>Likes</th>
                      <th style={{ ...headCell, textAlign: "right" }}>CTR</th>
                      <th style={{ ...headCell, textAlign: "right" }}>Last click</th>
                      <th style={{ ...headCell, textAlign: "right" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_brands.map((r) => {
                      const brandCtr = r.views > 0 ? (r.clicks / r.views) * 100 : null;
                      return (
                        <tr key={r.brand}>
                          <td style={{ ...cell, color: "var(--ink)", fontWeight: 500 }}>
                            {r.brand}
                          </td>
                          <td style={{ ...cell, textAlign: "right" }}>{r.clicks}</td>
                          <td style={{ ...cell, textAlign: "right" }}>{r.unique_shoppers}</td>
                          <td style={{ ...cell, textAlign: "right" }}>{r.views}</td>
                          <td style={{ ...cell, textAlign: "right" }}>{r.likes}</td>
                          <td style={{ ...cell, textAlign: "right", color: "var(--ink-3)" }}>
                            {brandCtr === null ? "—" : `${brandCtr.toFixed(0)}%`}
                          </td>
                          <td style={{ ...cell, textAlign: "right", color: "var(--ink-3)" }}>
                            {r.last_click
                              ? new Date(r.last_click).toLocaleDateString()
                              : "—"}
                          </td>
                          <td style={{ ...cell, textAlign: "right" }}>
                            <button
                              onClick={() => copyPitch(r)}
                              style={{
                                fontFamily: "var(--sans)",
                                fontSize: 12,
                                padding: "4px 10px",
                                borderRadius: 999,
                                border: "1px solid var(--hairline-strong)",
                                background:
                                  copied === r.brand ? "var(--ink)" : "var(--white)",
                                color: copied === r.brand ? "var(--white)" : "var(--ink-2)",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {copied === r.brand ? "Copied" : "Copy pitch"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top products + Top searches, side by side */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ ...card, flex: "1 1 360px" }}>
              <div style={sectionLabel}>Top products</div>
              {data.top_products.length === 0 ? (
                <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
                  No product activity yet.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...headCell, textAlign: "left" }}>Product</th>
                        <th style={{ ...headCell, textAlign: "left" }}>Brand</th>
                        <th style={{ ...headCell, textAlign: "right" }}>Clicks</th>
                        <th style={{ ...headCell, textAlign: "right" }}>Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_products.map((p, i) => (
                        <tr key={`${p.product_name}-${p.brand}-${i}`}>
                          <td style={{ ...cell, color: "var(--ink)" }}>{p.product_name}</td>
                          <td style={{ ...cell }}>{p.brand}</td>
                          <td style={{ ...cell, textAlign: "right" }}>{p.clicks}</td>
                          <td style={{ ...cell, textAlign: "right" }}>{p.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ ...card, flex: "1 1 240px" }}>
              <div style={sectionLabel}>Top searches</div>
              {data.top_searches.length === 0 ? (
                <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
                  No searches yet — these show what shoppers want.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.top_searches.map((s) => (
                    <div
                      key={s.q}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        color: "var(--ink-2)",
                        paddingBottom: 6,
                      }}
                    >
                      <span style={{ color: "var(--ink)" }}>{s.q}</span>
                      <span style={{ color: "var(--ink-3)" }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
