"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AdminTabs from "@/components/admin/AdminTabs";

const ADMIN_EMAIL = "nyah@toxome.app";

// ---- Types -----------------------------------------------------------

type ClosetTotals = {
  total_items: number;
  total_closets: number;
  avg_score: number | null;
  avg_synthetic_pct: number | null;
};

type ScoreBands = {
  good: number;
  okay: number;
  bad: number;
};

type TopBrand = {
  brand: string;
  closets: number;
  items: number;
  avg_score: number | null;
  top_category: string | null;
};

type CategoryRow = {
  category: string;
  items: number;
  avg_score: number | null;
};

type CountryRow = {
  country: string;
  closets: number;
  items: number;
};

type ScannedBrand = {
  brand: string;
  scans: number;
};

type Scans = {
  total: number;
  bySource: {
    app_camera: number;
    app_barcode: number;
    app_url: number;
    extension: number;
  };
  topScannedBrands: ScannedBrand[];
};

type ClosetsData = {
  totals: ClosetTotals;
  scoreBands: ScoreBands;
  topBrands: TopBrand[];
  categories: CategoryRow[];
  byCountry: CountryRow[];
  composition: { avg_synthetic_pct: number | null };
  scans: Scans;
};

// ---- Shared helpers --------------------------------------------------

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {children}
    </main>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontSize: 10,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--ink-2)",
};

const tableHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px 18px",
  fontFamily: "var(--sans)",
  fontSize: 10,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  background: "var(--cream)",
};

const emptyRowStyle: React.CSSProperties = {
  padding: "44px 18px",
  textAlign: "center",
  fontFamily: "var(--sans)",
  fontSize: 13,
  color: "var(--ink-3)",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontSize: 18,
  fontWeight: 500,
  letterSpacing: "-0.018em",
  color: "var(--ink)",
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--hairline-strong)",
  borderRadius: 12,
  overflow: "hidden",
  background: "var(--white)",
};

// ---- Score chip — ≥68 green, 40-67 orange, <40 red --------------------

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 68
      ? "var(--risk-low)"
      : score >= 40
      ? "var(--orange)"
      : "var(--red)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 999,
        border: `1px solid ${color}`,
        fontFamily: "var(--sans)",
        fontSize: 12,
        color: "var(--ink)",
      }}
    >
      <span
        style={{ width: 7, height: 7, borderRadius: 999, background: color, flexShrink: 0 }}
      />
      {score}
    </span>
  );
}

// ---- Stat card -------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number | undefined;
  sub?: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 140px",
        minWidth: 130,
        padding: "14px 18px",
        borderRadius: 12,
        background: "var(--white)",
        border: "1px solid var(--hairline-strong)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 10,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--ink-2)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        {value ?? "—"}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 11,
            color: "var(--ink-3)",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ---- Score band bar --------------------------------------------------

function BandBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 12,
          color: "var(--ink-2)",
          width: 40,
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 999,
          background: "var(--tan)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 12,
          color: "var(--ink)",
          fontWeight: 500,
          width: 36,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 11,
          color: "var(--ink-3)",
          width: 36,
          flexShrink: 0,
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

// ---- Main page -------------------------------------------------------

export default function AdminClosetsPage() {
  const { user, loading, signOut } = useAuth();
  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  const [data, setData] = useState<ClosetsData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [daysFilter, setDaysFilter] = useState(""); // "" = all-time

  const token = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    return user.getIdToken();
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!isAdmin) return;
    setDataLoading(true);
    setDataError("");
    try {
      const t = await token();
      const params = new URLSearchParams();
      if (daysFilter) params.set("days", daysFilter);
      const res = await fetch(
        `/api/admin/closets${params.toString() ? `?${params.toString()}` : ""}`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          (j as { error?: string }).error || `Request failed (${res.status})`
        );
      }
      setData((await res.json()) as ClosetsData);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  }, [isAdmin, token, daysFilter]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ---- Gated states --------------------------------------------------

  if (loading) {
    return (
      <Centered>
        <span style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-3)" }}>
          Loading…
        </span>
      </Centered>
    );
  }

  if (!isAdmin) {
    return (
      <Centered>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ ...eyebrowStyle, marginBottom: 8 }}>Toxome Admin</div>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontSize: 28,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
            }}
          >
            {user ? "Access denied" : "Sign in"}
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              color: "var(--ink-2)",
              margin: "0 0 20px",
            }}
          >
            {user
              ? `Signed in as ${user.email}. This dashboard is private.`
              : "Sign in on the Admin page to continue."}
          </p>
          {user ? (
            <button
              onClick={() => signOut()}
              style={{
                display: "inline-block",
                fontFamily: "var(--sans)",
                fontSize: 13,
                padding: "9px 18px",
                borderRadius: 999,
                border: "1px solid var(--hairline-strong)",
                background: "var(--white)",
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/admin"
              style={{
                display: "inline-block",
                fontFamily: "var(--sans)",
                fontSize: 13,
                padding: "9px 18px",
                borderRadius: 999,
                border: "1px solid var(--ink)",
                background: "var(--ink)",
                color: "var(--white)",
                textDecoration: "none",
              }}
            >
              Go to Admin
            </Link>
          )}
        </div>
      </Centered>
    );
  }

  // ---- Dashboard -----------------------------------------------------

  const totals = data?.totals;
  const bands = data?.scoreBands;
  const bandTotal = bands ? bands.good + bands.okay + bands.bad : 0;
  const scans = data?.scans;

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", color: "var(--ink)" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          background: "var(--cream)",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em" }}>
            Toxome
          </span>
          <span style={{ ...eyebrowStyle, color: "var(--ink-3)" }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
            {user.email}
          </span>
          <button
            onClick={() => signOut()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--ink-2)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px 80px" }}>
        <AdminTabs active="closets" />

        {/* ---- Day filter ---- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h2 style={sectionHeadingStyle}>Closets overview</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {(["", "30", "90", "365"] as const).map((d) => {
              const on = daysFilter === d;
              return (
                <button
                  key={d}
                  onClick={() => setDaysFilter(d)}
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1px solid ${on ? "var(--ink)" : "var(--hairline-strong)"}`,
                    background: on ? "var(--ink)" : "var(--white)",
                    color: on ? "var(--white)" : "var(--ink-2)",
                    cursor: "pointer",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {d === "" ? "All time" : d === "30" ? "30d" : d === "90" ? "90d" : "1yr"}
                </button>
              );
            })}
          </div>
        </div>

        {dataError && (
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--red)",
              marginBottom: 16,
            }}
          >
            {dataError}
          </p>
        )}

        {dataLoading && (
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--ink-3)",
              marginBottom: 16,
            }}
          >
            Loading…
          </p>
        )}

        {/* ---- Totals strip ---- */}
        {totals && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
            <StatCard label="Closets" value={totals.total_closets} />
            <StatCard label="Items saved" value={totals.total_items} />
            <StatCard
              label="Avg score"
              value={totals.avg_score != null ? totals.avg_score : undefined}
            />
            <StatCard
              label="Avg synthetic"
              value={
                totals.avg_synthetic_pct != null
                  ? `${totals.avg_synthetic_pct}%`
                  : undefined
              }
              sub="of items with composition data"
            />
          </div>
        )}

        {/* ---- Score distribution ---- */}
        {bands && (
          <section style={{ marginBottom: 40 }}>
            <h3
              style={{
                ...sectionHeadingStyle,
                fontSize: 15,
                marginBottom: 16,
              }}
            >
              Score distribution
            </h3>
            <div
              style={{
                ...cardStyle,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <BandBar label="Good" count={bands.good} total={bandTotal} color="var(--risk-low)" />
              <BandBar label="Okay" count={bands.okay} total={bandTotal} color="var(--orange)" />
              <BandBar label="Bad" count={bands.bad} total={bandTotal} color="var(--red)" />
              <div
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 11,
                  color: "var(--ink-3)",
                  marginTop: 4,
                }}
              >
                Good = score 68+, Okay = 40–67, Bad = below 40. Items without a score are excluded.
              </div>
            </div>
          </section>
        )}

        {/* ---- Top brands in closets ---- */}
        <section style={{ marginBottom: 40 }}>
          <h3 style={{ ...sectionHeadingStyle, fontSize: 15, marginBottom: 16 }}>
            Top brands in closets
          </h3>
          <div style={cardStyle}>
            <div style={tableHeaderStyle}>
              <div style={{ flex: 1 }}>Brand</div>
              <div style={{ width: 80, textAlign: "right" }}>Closets</div>
              <div style={{ width: 70, textAlign: "right" }}>Items</div>
              <div style={{ width: 100, textAlign: "right" }}>Avg score</div>
              <div style={{ width: 140, paddingLeft: 16 }}>Top category</div>
            </div>

            {!data && !dataLoading && <div style={emptyRowStyle}>No data yet.</div>}
            {data?.topBrands.length === 0 && <div style={emptyRowStyle}>No brands yet.</div>}

            {data?.topBrands.slice(0, 10).map((b, i) => (
              <div
                key={b.brand}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "11px 18px",
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                  background: i % 2 === 0 ? "var(--white)" : "rgba(252,251,247,0.6)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.brand}
                  </div>
                </div>
                <div
                  style={{
                    width: 80,
                    textAlign: "right",
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  {b.closets}
                </div>
                <div style={{ width: 70, textAlign: "right", color: "var(--ink-2)" }}>
                  {b.items}
                </div>
                <div style={{ width: 100, textAlign: "right" }}>
                  {b.avg_score != null ? (
                    <ScoreChip score={b.avg_score} />
                  ) : (
                    <span style={{ color: "var(--ink-3)" }}>—</span>
                  )}
                </div>
                <div style={{ width: 140, paddingLeft: 16, color: "var(--ink-3)" }}>
                  {b.top_category ?? "—"}
                </div>
              </div>
            ))}

            {(data?.topBrands.length ?? 0) > 10 && (
              <div
                style={{
                  borderTop: "1px solid var(--hairline)",
                  padding: "12px 18px",
                  background: "var(--white)",
                }}
              >
                <Link
                  href="/admin/closets/brands"
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    color: "var(--ink-2)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  See more →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ---- Two-column row: Categories + By country ---- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 40,
          }}
        >
          {/* Categories */}
          <section>
            <h3 style={{ ...sectionHeadingStyle, fontSize: 15, marginBottom: 16 }}>
              By category
            </h3>
            <div style={cardStyle}>
              <div style={tableHeaderStyle}>
                <div style={{ flex: 1 }}>Category</div>
                <div style={{ width: 60, textAlign: "right" }}>Items</div>
                <div style={{ width: 90, textAlign: "right" }}>Avg score</div>
              </div>
              {data?.categories.length === 0 && (
                <div style={emptyRowStyle}>No data yet.</div>
              )}
              {data?.categories.map((c, i) => (
                <div
                  key={c.category}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                  }}
                >
                  <div style={{ flex: 1, color: "var(--ink)" }}>{c.category}</div>
                  <div style={{ width: 60, textAlign: "right", color: "var(--ink-2)" }}>
                    {c.items}
                  </div>
                  <div style={{ width: 90, textAlign: "right" }}>
                    {c.avg_score != null ? (
                      <ScoreChip score={c.avg_score} />
                    ) : (
                      <span style={{ color: "var(--ink-3)" }}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* By country */}
          <section>
            <h3 style={{ ...sectionHeadingStyle, fontSize: 15, marginBottom: 16 }}>
              By country
            </h3>
            <div style={cardStyle}>
              <div style={tableHeaderStyle}>
                <div style={{ flex: 1 }}>Country</div>
                <div style={{ width: 70, textAlign: "right" }}>Closets</div>
                <div style={{ width: 60, textAlign: "right" }}>Items</div>
              </div>
              {data?.byCountry.length === 0 && (
                <div style={emptyRowStyle}>No data yet.</div>
              )}
              {data?.byCountry.map((c, i) => (
                <div
                  key={c.country}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                  }}
                >
                  <div style={{ flex: 1, color: "var(--ink)" }}>{c.country}</div>
                  <div
                    style={{
                      width: 70,
                      textAlign: "right",
                      fontWeight: 500,
                      color: "var(--ink)",
                    }}
                  >
                    {c.closets}
                  </div>
                  <div style={{ width: 60, textAlign: "right", color: "var(--ink-2)" }}>
                    {c.items}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ---- Scanned vs kept funnel ---- */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
            <h3 style={{ ...sectionHeadingStyle, fontSize: 15 }}>Scanned vs kept</h3>
            <span
              style={{
                fontFamily: "var(--sans)",
                fontSize: 11,
                color: "var(--ink-3)",
                letterSpacing: 0,
              }}
            >
              (scan data is forward-only — started {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}; closets include backfilled history)
            </span>
          </div>

          {scans && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Totals + by source */}
              <div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                  <StatCard
                    label="Total scans"
                    value={scans.total}
                  />
                  {totals && (
                    <StatCard
                      label="Keep rate"
                      value={
                        scans.total > 0
                          ? `${Math.round((totals.total_items / scans.total) * 100)}%`
                          : "—"
                      }
                      sub="items saved / scans"
                    />
                  )}
                </div>
                <div style={cardStyle}>
                  <div style={tableHeaderStyle}>
                    <div style={{ flex: 1 }}>Scan source</div>
                    <div style={{ width: 70, textAlign: "right" }}>Scans</div>
                    <div style={{ width: 60, textAlign: "right" }}>%</div>
                  </div>
                  {(
                    [
                      ["App — camera", scans.bySource.app_camera],
                      ["App — barcode", scans.bySource.app_barcode],
                      ["App — URL", scans.bySource.app_url],
                      ["Extension", scans.bySource.extension],
                    ] as [string, number][]
                  ).map(([label, count], i) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 18px",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                      }}
                    >
                      <div style={{ flex: 1, color: "var(--ink)" }}>{label}</div>
                      <div
                        style={{
                          width: 70,
                          textAlign: "right",
                          fontWeight: 500,
                          color: "var(--ink)",
                        }}
                      >
                        {count}
                      </div>
                      <div style={{ width: 60, textAlign: "right", color: "var(--ink-3)" }}>
                        {scans.total > 0
                          ? `${Math.round((count / scans.total) * 100)}%`
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top scanned brands */}
              <div>
                <h4
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink-2)",
                    margin: "0 0 12px",
                    letterSpacing: "-0.005em",
                  }}
                >
                  Top scanned brands
                </h4>
                <div style={cardStyle}>
                  <div style={tableHeaderStyle}>
                    <div style={{ flex: 1 }}>Brand</div>
                    <div style={{ width: 70, textAlign: "right" }}>Scans</div>
                  </div>
                  {scans.topScannedBrands.length === 0 && (
                    <div style={emptyRowStyle}>No scans yet.</div>
                  )}
                  {scans.topScannedBrands.map((b, i) => (
                    <div
                      key={b.brand}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 18px",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {b.brand}
                      </div>
                      <div
                        style={{
                          width: 70,
                          textAlign: "right",
                          fontWeight: 500,
                          color: "var(--ink)",
                        }}
                      >
                        {b.scans}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
