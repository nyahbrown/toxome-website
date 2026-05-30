"use client";

import { useCallback, useEffect, useState } from "react";

// Internal "Brand traffic" panel for the admin. Shows per-brand outbound
// clicks so Nyah can grab a pitch line ("we sent {brand} N shoppers to your
// site this month") in one click. Reads from /api/admin/analytics, which is
// gated by verifyAdmin and queries the service-role-only get_brand_report fn.

type BrandRow = {
  brand: string;
  clicks: number;
  unique_shoppers: number;
  logged_in_clicks: number;
  last_click: string | null;
};

type Report = {
  rows: BrandRow[];
  totals: { clicks: number; shoppers: number };
  brandCount: number;
};

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "all", label: "All time" },
] as const;

function rangeWord(days: string): string {
  if (days === "all") return "to date";
  return `in the last ${days} days`;
}

export default function BrandTrafficPanel({
  getToken,
}: {
  getToken: () => Promise<string>;
}) {
  const [days, setDays] = useState<string>("30");
  const [report, setReport] = useState<Report | null>(null);
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
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load brand traffic");
    } finally {
      setLoading(false);
    }
  }, [days, getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyPitch = (r: BrandRow) => {
    const line = `Toxome sent ${r.brand} ${r.clicks} click${
      r.clicks === 1 ? "" : "s"
    } from ${r.unique_shoppers} clean-fabric shopper${
      r.unique_shoppers === 1 ? "" : "s"
    } ${rangeWord(days)} — verify it in your own analytics (utm_source=toxome.app).`;
    void navigator.clipboard?.writeText(line);
    setCopied(r.brand);
    window.setTimeout(() => setCopied((c) => (c === r.brand ? null : c)), 1800);
  };

  const cell: React.CSSProperties = {
    padding: "10px 12px",
    fontFamily: "var(--sans)",
    fontSize: 13,
    color: "var(--ink-2)",
    letterSpacing: "-0.005em",
    borderBottom: "1px solid var(--hairline)",
    whiteSpace: "nowrap",
  };
  const head: React.CSSProperties = {
    ...cell,
    color: "var(--ink-3)",
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderBottom: "1px solid var(--hairline-strong)",
  };

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 16,
        padding: 20,
        marginBottom: 28,
      }}
    >
      {/* Header: title + headline number + range pills */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              margin: "0 0 6px",
            }}
          >
            Brand traffic
          </h2>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 22,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {report
              ? `${report.totals.clicks} clicks · ${report.totals.shoppers} shoppers · ${report.brandCount} brands`
              : "—"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RANGES.map((r) => {
            const active = days === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setDays(r.key)}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 999,
                  border: `1px solid ${
                    active ? "var(--ink)" : "var(--hairline-strong)"
                  }`,
                  background: active ? "var(--ink)" : "var(--white)",
                  color: active ? "var(--white)" : "var(--ink-2)",
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
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}

      {!error && loading && !report && (
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
          Loading…
        </div>
      )}

      {!error && report && report.rows.length === 0 && (
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
          No outbound clicks yet {rangeWord(days)}. Once shoppers start clicking
          “Buy at [brand]”, brands show up here.
        </div>
      )}

      {!error && report && report.rows.length > 0 && (
        <div style={{ overflowX: "auto", opacity: loading ? 0.6 : 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...head, textAlign: "left" }}>Brand</th>
                <th style={{ ...head, textAlign: "right" }}>Clicks</th>
                <th style={{ ...head, textAlign: "right" }}>Shoppers</th>
                <th style={{ ...head, textAlign: "right" }}>Signed in</th>
                <th style={{ ...head, textAlign: "right" }}>Last click</th>
                <th style={{ ...head, textAlign: "right" }} />
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.brand}>
                  <td style={{ ...cell, color: "var(--ink)", fontWeight: 500 }}>
                    {r.brand}
                  </td>
                  <td style={{ ...cell, textAlign: "right" }}>{r.clicks}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{r.unique_shoppers}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{r.logged_in_clicks}</td>
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
                        background: copied === r.brand ? "var(--ink)" : "var(--white)",
                        color: copied === r.brand ? "var(--white)" : "var(--ink-2)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {copied === r.brand ? "Copied" : "Copy pitch"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
