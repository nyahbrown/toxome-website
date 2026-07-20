"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AdminTabs from "@/components/admin/AdminTabs";

const ADMIN_EMAIL = "nyah@toxome.app";

// ---- Types -----------------------------------------------------------

type Submission = {
  normalized: string;
  raw_name: string;
  count: number;
  scan_category: string | null;
  latest_at: string;
};

type ClosetBrand = {
  brand_name: string;
  brand_normalized: string;
  item_count: number;
  closet_count: number;
  avg_score: number | null;
  top_category: string | null;
};

type ClosetTotals = {
  total_items: number;
  total_closets: number;
  avg_score: number | null;
};

// ---- Small shared helpers --------------------------------------------

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

// ---- Main page -------------------------------------------------------

export default function AdminBrandsPage() {
  const { user, loading, signOut } = useAuth();
  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  // --- Submissions state ---
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // --- Closet state ---
  const [closetBrands, setClosetBrands] = useState<ClosetBrand[]>([]);
  const [closetTotals, setClosetTotals] = useState<ClosetTotals | null>(null);
  const [closetLoading, setClosetLoading] = useState(false);
  const [closetError, setClosetError] = useState("");
  const [daysFilter, setDaysFilter] = useState(""); // "" = all-time

  const token = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    return user.getIdToken();
  }, [user]);

  // Fetch pending submissions.
  const refreshSubmissions = useCallback(async () => {
    if (!isAdmin) return;
    setSubLoading(true);
    setSubError("");
    try {
      const t = await token();
      const res = await fetch("/api/admin/brand-submissions", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `Request failed (${res.status})`);
      }
      const j = (await res.json()) as { submissions: Submission[] };
      setSubmissions(j.submissions ?? []);
    } catch (e) {
      setSubError(e instanceof Error ? e.message : "Failed to load submissions");
    } finally {
      setSubLoading(false);
    }
  }, [isAdmin, token]);

  // Fetch closet aggregation.
  const refreshClosets = useCallback(async () => {
    if (!isAdmin) return;
    setClosetLoading(true);
    setClosetError("");
    try {
      const t = await token();
      const params = new URLSearchParams();
      if (daysFilter) params.set("days", daysFilter);
      const res = await fetch(
        `/api/admin/closet-brands${params.toString() ? `?${params.toString()}` : ""}`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `Request failed (${res.status})`);
      }
      const j = (await res.json()) as { brands: ClosetBrand[]; totals: ClosetTotals };
      setClosetBrands(j.brands ?? []);
      setClosetTotals(j.totals ?? null);
    } catch (e) {
      setClosetError(e instanceof Error ? e.message : "Failed to load closet data");
    } finally {
      setClosetLoading(false);
    }
  }, [isAdmin, token, daysFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSubmissions();
  }, [refreshSubmissions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshClosets();
  }, [refreshClosets]);

  // Approve or reject a grouped submission set.
  const decide = useCallback(
    async (sub: Submission, action: "approve" | "reject") => {
      setBusyKey(sub.normalized);
      setSubError("");
      try {
        const t = await token();
        const res = await fetch("/api/admin/brand-submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify({
            action,
            normalized: sub.normalized,
            name: sub.raw_name,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error || `Request failed (${res.status})`);
        }
        // Optimistically remove from the list.
        setSubmissions((prev) => prev.filter((s) => s.normalized !== sub.normalized));
      } catch (e) {
        setSubError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setBusyKey(null);
      }
    },
    [token]
  );

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

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", color: "var(--ink)" }}>
      {/* Top bar — matches /admin and /admin/analytics */}
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
        <AdminTabs active="brands" />

        {/* ---- Section 1: Submission queue ---- */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--sans)",
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "-0.018em",
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Pending submissions
            </h2>
            {submissions.length > 0 && (
              <span
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(230,166,56,0.16)",
                  color: "var(--orange)",
                  border: "1px solid var(--orange)",
                }}
              >
                {submissions.length}
              </span>
            )}
          </div>

          {subError && (
            <p
              style={{
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--red)",
                margin: "0 0 12px",
              }}
            >
              {subError}
            </p>
          )}

          <div
            style={{
              border: "1px solid var(--hairline-strong)",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--white)",
            }}
          >
            {/* Header row */}
            <div style={tableHeaderStyle}>
              <div style={{ flex: 1 }}>Brand name</div>
              <div style={{ width: 80, textAlign: "right" }}>Submissions</div>
              <div style={{ width: 140, paddingLeft: 24 }}>Category sample</div>
              <div style={{ width: 120, paddingLeft: 16 }}>Latest</div>
              <div style={{ width: 160, textAlign: "right" }}>Actions</div>
            </div>

            {subLoading && <div style={emptyRowStyle}>Loading…</div>}

            {!subLoading && submissions.length === 0 && (
              <div style={emptyRowStyle}>No pending brand submissions.</div>
            )}

            {!subLoading &&
              submissions.map((sub) => {
                const busy = busyKey === sub.normalized;
                return (
                  <div
                    key={sub.normalized}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 18px",
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      opacity: busy ? 0.5 : 1,
                      borderTop: "1px solid var(--hairline)",
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
                          textTransform: "capitalize",
                        }}
                      >
                        {sub.raw_name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                        {sub.normalized}
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
                      {sub.count}
                    </div>
                    <div style={{ width: 140, paddingLeft: 24, color: "var(--ink-3)" }}>
                      {sub.scan_category ?? "—"}
                    </div>
                    <div style={{ width: 120, paddingLeft: 16, color: "var(--ink-3)" }}>
                      {sub.latest_at
                        ? new Date(sub.latest_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </div>
                    <div
                      style={{
                        width: 160,
                        display: "flex",
                        gap: 6,
                        justifyContent: "flex-end",
                      }}
                    >
                      <ActionButton
                        tone="approve"
                        disabled={busy}
                        onClick={() => decide(sub, "approve")}
                      >
                        Approve
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        disabled={busy}
                        onClick={() => decide(sub, "reject")}
                      >
                        Reject
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* ---- Section 2: Closet brands dashboard ---- */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--sans)",
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "-0.018em",
                color: "var(--ink)",
                margin: 0,
                flex: 1,
              }}
            >
              What&apos;s in closets
            </h2>

            {/* Days filter */}
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

          {/* Totals strip */}
          {closetTotals && (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <ClosetStatCard label="Total items logged" value={closetTotals.total_items} />
              <ClosetStatCard label="Distinct closets" value={closetTotals.total_closets} />
              <ClosetStatCard
                label="Overall avg score"
                value={closetTotals.avg_score != null ? closetTotals.avg_score : undefined}
              />
            </div>
          )}

          {closetError && (
            <p
              style={{
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--red)",
                margin: "0 0 12px",
              }}
            >
              {closetError}
            </p>
          )}

          <div
            style={{
              border: "1px solid var(--hairline-strong)",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--white)",
            }}
          >
            {/* Header */}
            <div style={tableHeaderStyle}>
              <div style={{ flex: 1 }}>Brand</div>
              <div style={{ width: 100, textAlign: "right" }}>Closets</div>
              <div style={{ width: 80, textAlign: "right" }}>Items</div>
              <div style={{ width: 100, textAlign: "right" }}>Avg score</div>
              <div style={{ width: 140, paddingLeft: 16 }}>Top category</div>
            </div>

            {closetLoading && <div style={emptyRowStyle}>Loading…</div>}

            {!closetLoading && closetBrands.length === 0 && (
              <div style={emptyRowStyle}>No closet data yet.</div>
            )}

            {!closetLoading &&
              closetBrands.map((brand, i) => (
                <div
                  key={brand.brand_normalized}
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
                        textTransform: "capitalize",
                      }}
                    >
                      {brand.brand_name}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 100,
                      textAlign: "right",
                      fontWeight: 500,
                      color: "var(--ink)",
                    }}
                  >
                    {brand.closet_count}
                  </div>
                  <div style={{ width: 80, textAlign: "right", color: "var(--ink-2)" }}>
                    {brand.item_count}
                  </div>
                  <div style={{ width: 100, textAlign: "right" }}>
                    {brand.avg_score != null ? (
                      <ScoreChip score={brand.avg_score} />
                    ) : (
                      <span style={{ color: "var(--ink-3)" }}>—</span>
                    )}
                  </div>
                  <div style={{ width: 140, paddingLeft: 16, color: "var(--ink-3)" }}>
                    {brand.top_category ?? "—"}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// ---- Small components ------------------------------------------------

function ActionButton({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "approve" | "danger";
}) {
  const palette =
    tone === "approve"
      ? { bg: "rgba(173,200,156,0.25)", fg: "#4f6e3b", border: "var(--risk-low)" }
      : tone === "danger"
      ? { bg: "rgba(200,66,66,0.10)", fg: "var(--red)", border: "rgba(200,66,66,0.4)" }
      : { bg: "var(--white)", fg: "var(--ink-2)", border: "var(--hairline-strong)" };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--sans)",
        fontSize: 12,
        padding: "5px 11px",
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.fg,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </button>
  );
}

// Score chip — color from the brand's avg_score using the V2 clean bands:
// <40 red (bad), 40–67 orange (okay), ≥68 green (good).
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

function ClosetStatCard({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
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
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}


