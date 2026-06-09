"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AdminTabs from "@/components/admin/AdminTabs";

const ADMIN_EMAIL = "nyah@toxome.app";

// ---- Types -----------------------------------------------------------

type TopBrand = {
  brand: string;
  closets: number;
  items: number;
  avg_score: number | null;
  top_category: string | null;
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
  position: "sticky",
  top: 0,
  zIndex: 2,
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

// ---- Main page -------------------------------------------------------

export default function AdminClosetsBrandsPage() {
  const { user, loading, signOut } = useAuth();
  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  const [brands, setBrands] = useState<TopBrand[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

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
      const res = await fetch("/api/admin/closets?brands=all", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          (j as { error?: string }).error || `Request failed (${res.status})`
        );
      }
      const json = await res.json();
      setBrands((json.topBrands ?? []) as TopBrand[]);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  }, [isAdmin, token]);

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

  // ---- Page ----------------------------------------------------------

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

        {/* Back link + heading */}
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
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <Link
              href="/admin/closets"
              style={{
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--ink-3)",
                textDecoration: "none",
              }}
            >
              ← Closets
            </Link>
            <h2 style={sectionHeadingStyle}>All brands in closets</h2>
          </div>
          {!dataLoading && brands.length > 0 && (
            <span
              style={{
                fontFamily: "var(--sans)",
                fontSize: 12,
                color: "var(--ink-3)",
              }}
            >
              {brands.length} brands
            </span>
          )}
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

        {/* Brands table */}
        <div style={cardStyle}>
          <div style={tableHeaderStyle}>
            <div style={{ width: 32, flexShrink: 0, color: "var(--ink-3)" }}>#</div>
            <div style={{ flex: 1 }}>Brand</div>
            <div style={{ width: 80, textAlign: "right" }}>Closets</div>
            <div style={{ width: 70, textAlign: "right" }}>Items</div>
            <div style={{ width: 100, textAlign: "right" }}>Avg score</div>
            <div style={{ width: 140, paddingLeft: 16 }}>Top category</div>
          </div>

          {!dataLoading && brands.length === 0 && (
            <div style={emptyRowStyle}>No brands yet.</div>
          )}

          {brands.map((b, i) => (
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
              <div
                style={{
                  width: 32,
                  flexShrink: 0,
                  color: "var(--ink-3)",
                  fontSize: 11,
                }}
              >
                {i + 1}
              </div>
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
        </div>
      </div>
    </main>
  );
}
