"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hazardColor,
  fiberHazardColor,
  prettyFiber,
  calcToxomeScore,
  scoreToRiskLevel,
} from "@/lib/fabricScores";
import type { Product } from "@/types/product";
import AdminTabs from "@/components/admin/AdminTabs";

const ADMIN_EMAIL = "nyah@toxome.app";

type Status = "pending" | "live" | "rejected" | "removed" | "all";

type Stats = {
  live: number;
  pending: number;
  rejected: number;
  removed: number;
  total: number;
};

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "Pending review" },
  { key: "live", label: "Live" },
  { key: "rejected", label: "Rejected" },
  { key: "removed", label: "Removed" },
  { key: "all", label: "All" },
];

// Derive a product's status for the badge.
function deriveStatus(p: AdminProduct): Status {
  if (p.published) return "live";
  if (p.rejected) return "rejected";
  if (p.unpublish_reason) return "removed";
  return "pending";
}

// Products as returned by the admin API, superset of the public Product type.
type AdminProduct = Product & {
  rejected?: boolean;
  unpublish_reason?: string | null;
  reviewed_at?: string | null;
};

const REASON_LABEL: Record<string, string> = {
  dead: "Link dead",
  sold_out: "Sold out",
  manual: "Removed manually",
};

const STATUS_BADGE: Record<Status, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pending", bg: "rgba(230,166,56,0.16)", fg: "var(--orange)" },
  live: { label: "Live", bg: "rgba(173,200,156,0.22)", fg: "#5c7a47" },
  rejected: { label: "Rejected", bg: "rgba(200,66,66,0.12)", fg: "var(--red)" },
  removed: { label: "Removed", bg: "var(--tan)", fg: "var(--ink-2)" },
  all: { label: "", bg: "", fg: "" },
};

export default function AdminPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signOut } = useAuth();

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [allBrands, setAllBrands] = useState<{ brand: string; count: number }[]>([]);
  const [status, setStatus] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [brand, setBrand] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Gamified review session tally (resets on reload).
  const [sessionApproved, setSessionApproved] = useState(0);
  const [sessionRejected, setSessionRejected] = useState(0);

  // sign-in form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // add-by-url form state
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addedProduct, setAddedProduct] = useState<AdminProduct | null>(null);

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const token = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    return user.getIdToken();
  }, [user]);

  const refreshStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const t = await token();
      const [statsRes, brandsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/admin/brands", { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (brandsRes.ok) setAllBrands((await brandsRes.json()).brands ?? []);
    } catch {
      /* non-fatal */
    }
  }, [isAdmin, token]);

  const refreshList = useCallback(async () => {
    if (!isAdmin) return;
    setListLoading(true);
    setError("");
    try {
      const t = await token();
      const params = new URLSearchParams({ status });
      if (debounced) params.set("q", debounced);
      if (brand) params.set("brand", brand);
      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const j = await res.json();
      setProducts(j.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
      setProducts([]);
    } finally {
      setListLoading(false);
    }
  }, [isAdmin, status, debounced, brand, token]);

  // Fetch from Supabase (an external system) when the filters or auth change.
  // The setState calls inside these helpers run against an external data source,
  // not synchronous derived state, so the cascading-render rule does not apply.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStats();
  }, [refreshStats]);

  const mutate = useCallback(
    async (
      id: string,
      action: string,
      fields?: Record<string, unknown>
    ): Promise<AdminProduct | null> => {
      setBusyId(id);
      setError("");
      try {
        const t = await token();
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify({ action, fields }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Request failed (${res.status})`);
        }
        const j = await res.json();
        await Promise.all([refreshList(), refreshStats()]);
        return j.product as AdminProduct;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
        return null;
      } finally {
        setBusyId(null);
      }
    },
    [token, refreshList, refreshStats]
  );

  // Lightweight PATCH for the gamified review flow. Unlike `mutate`, it does
  // not refetch the whole list (the review card advances optimistically and
  // manages its own queue); it just refreshes the stat counts. Returns true
  // on success so the caller can revert an optimistic advance on failure.
  const reviewDecision = useCallback(
    async (id: string, action: "approve" | "reject"): Promise<boolean> => {
      try {
        const t = await token();
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Request failed (${res.status})`);
        }
        if (action === "approve") setSessionApproved((n) => n + 1);
        else setSessionRejected((n) => n + 1);
        refreshStats();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
        return false;
      }
    },
    [token, refreshStats]
  );

  const addByUrl = useCallback(async () => {
    const url = addUrl.trim();
    if (!url || adding) return;
    setAdding(true);
    setAddError("");
    setAddedProduct(null);
    try {
      const t = await token();
      const res = await fetch("/api/admin/add-by-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ url }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      setAddedProduct(j.product as AdminProduct);
      setAddUrl("");
      await Promise.all([refreshList(), refreshStats()]);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Could not add product");
    } finally {
      setAdding(false);
    }
  }, [addUrl, adding, token, refreshList, refreshStats]);

  // Every brand in the catalog (from /api/admin/brands) so you can search by any
  // brand, not just ones in the current view. Falls back to the loaded list.
  const brandOptions: { brand: string; count: number | null }[] =
    allBrands.length > 0
      ? allBrands
      : Array.from(new Set(products.map((p) => p.brand).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b))
          .map((brand) => ({ brand, count: null }));

  // ---- Gated states ----------------------------------------------------
  if (loading) {
    return (
      <Centered>
        <span
          style={{
            fontFamily: "var(--sans)",
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          Loading…
        </span>
      </Centered>
    );
  }

  if (!user) {
    return (
      <Centered>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <Eyebrow>Toxome Admin</Eyebrow>
          <h1 style={headingStyle}>Sign in</h1>
          <button
            onClick={async () => {
              setAuthError("");
              try {
                await signInWithGoogle();
              } catch (e) {
                if (e instanceof Error) setAuthError(e.message);
              }
            }}
            style={ghostButtonStyle}
          >
            Continue with Google
          </button>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthError("");
              setSubmitting(true);
              try {
                await signInWithEmail(email, password);
              } catch (err) {
                if (err instanceof Error) setAuthError(err.message);
              } finally {
                setSubmitting(false);
              }
            }}
            style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}
          >
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <button type="submit" disabled={submitting} style={solidButtonStyle(submitting)}>
              {submitting ? "…" : "Sign in"}
            </button>
          </form>
          {authError && <p style={errorTextStyle}>{authError}</p>}
        </div>
      </Centered>
    );
  }

  if (!isAdmin) {
    return (
      <Centered>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <Eyebrow>Toxome Admin</Eyebrow>
          <h1 style={headingStyle}>Access denied</h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)", margin: "0 0 20px" }}>
            Signed in as {user.email}. This dashboard is private.
          </p>
          <button onClick={() => signOut()} style={ghostButtonStyle}>
            Sign out
          </button>
        </div>
      </Centered>
    );
  }

  // ---- Dashboard -------------------------------------------------------
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/toxome-logo.png"
            alt="Toxome"
            style={{ height: 22, width: "auto", display: "block" }}
          />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em", textTransform: "none" }}>Toxome</span>
          <span
            style={{
              fontFamily: "var(--sans)",
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            Admin
          </span>
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
        <AdminTabs active="products" />

        {/* Add product by URL */}
        <div
          style={{
            border: "1px solid var(--hairline-strong)",
            borderRadius: 12,
            background: "var(--white)",
            padding: "18px 20px",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: 10,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
              marginBottom: 10,
            }}
          >
            Add product by URL
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addByUrl();
            }}
            style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
          >
            <input
              type="url"
              placeholder="https://brand.com/products/…"
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              disabled={adding}
              style={{ ...inputStyle, flex: 1, minWidth: 260 }}
            />
            <button
              type="submit"
              disabled={adding || !addUrl.trim()}
              style={{
                border: "1px solid var(--ink)",
                borderRadius: 999,
                padding: "9px 20px",
                background: "var(--ink)",
                color: "var(--white)",
                fontSize: 13,
                fontFamily: "var(--sans)",
                cursor: adding || !addUrl.trim() ? "not-allowed" : "pointer",
                opacity: adding || !addUrl.trim() ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {adding ? "Fetching & extracting…" : "Fetch & add"}
            </button>
          </form>
          {addError && <p style={errorTextStyle}>{addError}</p>}
          {addedProduct && (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(173,200,156,0.14)",
                border: "1px solid var(--risk-low)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 52,
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "var(--tan)",
                  flexShrink: 0,
                }}
              >
                {addedProduct.item_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={addedProduct.item_image}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {addedProduct.item_name || "Untitled"}
                </div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)" }}>
                  {addedProduct.brand} · published live
                </div>
              </div>
              {addedProduct.toxome_score != null && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: "var(--cream)",
                    border: `1px solid ${hazardColor(addedProduct.toxome_score)}`,
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: hazardColor(addedProduct.toxome_score),
                    }}
                  />
                  {addedProduct.toxome_score}
                  {addedProduct.risk_level ? ` · ${addedProduct.risk_level}` : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
          <StatCard label="Pending review" value={stats?.pending} highlight />
          <StatCard label="Live" value={stats?.live} />
          <StatCard label="Rejected" value={stats?.rejected} />
          <StatCard label="Removed" value={stats?.removed} />
          <StatCard label="Total" value={stats?.total} muted />
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TABS.map((tab) => {
              const active = status === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatus(tab.key)}
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    padding: "7px 14px",
                    borderRadius: 999,
                    border: `1px solid ${active ? "var(--ink)" : "var(--hairline-strong)"}`,
                    background: active ? "var(--ink)" : "var(--white)",
                    color: active ? "var(--white)" : "var(--ink-2)",
                    cursor: "pointer",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <input
            type="search"
            placeholder="Search name or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 240 }}
          />
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            style={{ ...inputStyle, width: 180, cursor: "pointer" }}
          >
            <option value="">All brands{allBrands.length ? ` (${allBrands.length})` : ""}</option>
            {brandOptions.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand}
                {b.count != null ? ` (${b.count})` : ""}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={errorTextStyle}>{error}</p>}

        {status === "pending" ? (
          /* Gamified one-at-a-time review */
          <ReviewFlow
            products={products}
            loading={listLoading}
            totalPending={stats?.pending ?? products.length}
            sessionApproved={sessionApproved}
            sessionRejected={sessionRejected}
            onDecision={reviewDecision}
          />
        ) : (
          /* Table view (Live / Rejected / Removed / All) */
          <div
            style={{
              border: "1px solid var(--hairline-strong)",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--white)",
            }}
          >
            {/* Header row */}
            <div style={listHeaderStyle}>
              <div style={{ width: 56 }} />
              <div style={{ flex: 1 }}>Product</div>
              <div style={{ width: 90 }}>Price</div>
              <div style={{ width: 120 }}>Score</div>
              <div style={{ width: 160 }}>Fabric</div>
              <div style={{ width: 100 }}>Status</div>
              <div style={{ width: 220, textAlign: "right" }}>Actions</div>
            </div>

            {listLoading && <div style={emptyRowStyle}>Loading products…</div>}
            {!listLoading && products.length === 0 && (
              <div style={emptyRowStyle}>No products in this view.</div>
            )}

            {!listLoading &&
              products.map((p) => (
                <ProductRow
                  key={p.id}
                  p={p}
                  busy={busyId === p.id}
                  editing={editingId === p.id}
                  onEdit={() => setEditingId(editingId === p.id ? null : p.id)}
                  onCloseEdit={() => setEditingId(null)}
                  onAction={mutate}
                />
              ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ---- Row -------------------------------------------------------------
function ProductRow({
  p,
  busy,
  editing,
  onEdit,
  onCloseEdit,
  onAction,
}: {
  p: AdminProduct;
  busy: boolean;
  editing: boolean;
  onEdit: () => void;
  onCloseEdit: () => void;
  onAction: (
    id: string,
    action: string,
    fields?: Record<string, unknown>
  ) => Promise<AdminProduct | null>;
}) {
  const st = deriveStatus(p);
  const badge = STATUS_BADGE[st];

  const imgCandidates = [p.item_image, ...(p.images ?? [])].filter(
    (u): u is string => !!u
  );
  const [imgIdx, setImgIdx] = useState(0);
  const imgSrc = imgCandidates[imgIdx];

  const fibers = p.fabric_composition
    ? Object.keys(p.fabric_composition).map(prettyFiber)
    : [];
  const fabricSummary = fibers.slice(0, 3).join(", ") + (fibers.length > 3 ? "…" : "");

  // Change 2: thumbnail + name link out to the external retailer page.
  const externalUrl = p.item_url || p.affiliate_url || null;
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          padding: "12px 18px",
          fontFamily: "var(--sans)",
          fontSize: 13,
          opacity: busy ? 0.5 : 1,
        }}
      >
        {/* Thumb */}
        <div style={{ width: 56 }}>
          <a
            href={externalUrl ?? undefined}
            target={externalUrl ? "_blank" : undefined}
            rel={externalUrl ? "noopener noreferrer" : undefined}
            onClick={externalUrl ? stopPropagation : undefined}
            style={{
              display: "block",
              width: 40,
              height: 52,
              borderRadius: 6,
              overflow: "hidden",
              background: "var(--tan)",
              cursor: externalUrl ? "pointer" : "default",
            }}
          >
            {imgSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgSrc}
                alt=""
                onError={() => setImgIdx((i) => i + 1)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </a>
        </div>

        {/* Name + brand */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          {externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stopPropagation}
              style={{
                display: "block",
                fontWeight: 500,
                color: "var(--ink)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {p.item_name || "Untitled"}
            </a>
          ) : (
            <div
              style={{
                fontWeight: 500,
                color: "var(--ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {p.item_name || "Untitled"}
            </div>
          )}
          <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
            {p.brand}
            {p.added_by ? ` · ${p.added_by}` : ""}
          </div>
          {st === "removed" && p.unpublish_reason && (
            <div style={{ color: "var(--ink-3)", fontSize: 11, marginTop: 2 }}>
              {REASON_LABEL[p.unpublish_reason] || p.unpublish_reason}
            </div>
          )}
        </div>

        {/* Price */}
        <div style={{ width: 90, color: "var(--ink-2)" }}>
          {p.item_price != null ? `$${p.item_price}` : "–"}
        </div>

        {/* Score chip */}
        <div style={{ width: 120 }}>
          {p.toxome_score != null ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 9px",
                borderRadius: 999,
                background: "var(--cream)",
                border: `1px solid ${hazardColor(p.toxome_score)}`,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: hazardColor(p.toxome_score),
                }}
              />
              {p.toxome_score}
              {p.risk_level ? ` · ${p.risk_level}` : ""}
            </span>
          ) : (
            <span style={{ color: "var(--ink-3)" }}>–</span>
          )}
        </div>

        {/* Fabric */}
        <div style={{ width: 160, color: "var(--ink-2)", fontSize: 12, paddingRight: 8 }}>
          {fabricSummary || "–"}
        </div>

        {/* Status badge */}
        <div style={{ width: 100 }}>
          <span
            style={{
              display: "inline-block",
              padding: "3px 9px",
              borderRadius: 999,
              background: badge.bg,
              color: badge.fg,
              fontFamily: "var(--sans)",
              fontSize: 10,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            {badge.label}
          </span>
        </div>

        {/* Actions */}
        <div
          style={{
            width: 220,
            display: "flex",
            gap: 6,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {st === "pending" && (
            <>
              <RowButton tone="approve" disabled={busy} onClick={() => onAction(p.id, "approve")}>
                Approve
              </RowButton>
              <RowButton tone="danger" disabled={busy} onClick={() => onAction(p.id, "reject")}>
                Reject
              </RowButton>
            </>
          )}
          {st === "live" && (
            <RowButton tone="danger" disabled={busy} onClick={() => onAction(p.id, "unpublish")}>
              Remove from shop
            </RowButton>
          )}
          {st === "rejected" && (
            <RowButton disabled={busy} onClick={() => onAction(p.id, "restore")}>
              Restore
            </RowButton>
          )}
          {st === "removed" && (
            <RowButton tone="approve" disabled={busy} onClick={() => onAction(p.id, "publish")}>
              Republish
            </RowButton>
          )}
          <RowButton disabled={busy} onClick={onEdit}>
            {editing ? "Close" : "Edit"}
          </RowButton>
        </div>
      </div>

      {editing && (
        <EditPanel
          p={p}
          busy={busy}
          onSave={async (fields) => {
            const updated = await onAction(p.id, "edit", fields);
            if (updated) onCloseEdit();
          }}
        />
      )}
    </div>
  );
}

// ---- Gamified review flow -------------------------------------------
// Shows ONE pending product at a time, presented like the product detail
// page. Approve/Reject advance optimistically (with revert on failure);
// Skip moves to the next without deciding. Keyboard: A approve, R reject,
// →/S skip.
function ReviewFlow({
  products,
  loading,
  totalPending,
  sessionApproved,
  sessionRejected,
  onDecision,
}: {
  products: AdminProduct[];
  loading: boolean;
  totalPending: number;
  sessionApproved: number;
  sessionRejected: number;
  onDecision: (id: string, action: "approve" | "reject") => Promise<boolean>;
}) {
  // Local queue so we can advance instantly without waiting on a refetch.
  const [queue, setQueue] = useState<AdminProduct[]>(products);
  const [idx, setIdx] = useState(0);
  const [deciding, setDeciding] = useState(false);

  // When a fresh list arrives (tab opened, filters changed), reset the queue.
  const loadKey = products.map((p) => p.id).join(",");
  const prevKey = useRef(loadKey);
  useEffect(() => {
    if (prevKey.current !== loadKey) {
      prevKey.current = loadKey;
      setQueue(products);
      setIdx(0);
    }
  }, [loadKey, products]);

  const current = queue[idx];

  const advance = useCallback(() => {
    setIdx((i) => i + 1);
  }, []);

  const decide = useCallback(
    async (action: "approve" | "reject") => {
      if (!current || deciding) return;
      const target = current;
      setDeciding(true);
      // Optimistic advance.
      advance();
      const ok = await onDecision(target.id, action);
      if (!ok) {
        // Revert: step back to the failed card.
        setIdx((i) => Math.max(0, i - 1));
      }
      setDeciding(false);
    },
    [current, deciding, advance, onDecision]
  );

  const skip = useCallback(() => {
    if (!current) return;
    advance();
  }, [current, advance]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key.toLowerCase();
      if (k === "a") {
        e.preventDefault();
        decide("approve");
      } else if (k === "r") {
        e.preventDefault();
        decide("reject");
      } else if (k === "s" || e.key === "ArrowRight") {
        e.preventDefault();
        skip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, skip]);

  if (loading) {
    return (
      <div style={{ ...reviewShellStyle, ...reviewEmptyStyle }}>
        <span
          style={{
            fontFamily: "var(--sans)",
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          Loading review queue…
        </span>
      </div>
    );
  }

  // Inbox zero, either no pending at all, or we've worked through the queue.
  if (!current) {
    return (
      <div style={{ ...reviewShellStyle, ...reviewEmptyStyle }}>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: 40,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            marginBottom: 10,
          }}
        >
          All caught up
        </div>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: 15,
            color: "var(--ink-2)",
            margin: "0 0 6px",
          }}
        >
          Inbox zero. Nothing left to review.
        </p>
        {(sessionApproved > 0 || sessionRejected > 0) && (
          <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
            This session: {sessionApproved} approved · {sessionRejected} rejected
          </p>
        )}
      </div>
    );
  }

  // Progress numbers.
  const reviewedTotal = sessionApproved + sessionRejected;
  const positionInQueue = idx + 1;
  const queueLeft = queue.length - idx;
  const progressDenom = reviewedTotal + queueLeft;
  const progressPct =
    progressDenom > 0 ? Math.min(100, Math.round((reviewedTotal / progressDenom) * 100)) : 0;

  return (
    <div>
      {/* Gamification header: progress + tally */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: "var(--sans)",
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--ink-2)",
              }}
            >
              {reviewedTotal} of {Math.max(totalPending, reviewedTotal + queueLeft)} reviewed
              {" · "}#{positionInQueue} in queue
            </span>
            <span
              style={{
                fontFamily: "var(--sans)",
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              {queueLeft} left
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--tan)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "var(--risk-low)",
                borderRadius: 999,
                transition: "width 280ms ease",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TallyChip color="#4f6e3b" bg="rgba(173,200,156,0.25)" label="Approved" value={sessionApproved} />
          <TallyChip color="var(--red)" bg="rgba(200,66,66,0.10)" label="Rejected" value={sessionRejected} />
        </div>
      </div>

      {/* The card, keyed so it remounts (image reset + transition) per product */}
      <ReviewCard
        key={current.id}
        p={current}
        deciding={deciding}
        onApprove={() => decide("approve")}
        onReject={() => decide("reject")}
        onSkip={skip}
      />
    </div>
  );
}

function TallyChip({
  color,
  bg,
  label,
  value,
}: {
  color: string;
  bg: string;
  label: string;
  value: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 7,
        padding: "7px 13px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${color}`,
      }}
    >
      <span style={{ fontFamily: "var(--sans)", fontSize: 18, color, lineHeight: 1 }}>{value}</span>
      <span
        style={{
          fontFamily: "var(--sans)",
          fontSize: 9,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color,
        }}
      >
        {label}
      </span>
    </span>
  );
}

// One pending product, presented like ProductDetailClient, scaled for the
// dashboard. Approve / Reject / Skip with shortcut hints.
function ReviewCard({
  p,
  deciding,
  onApprove,
  onReject,
  onSkip,
}: {
  p: AdminProduct;
  deciding: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSkip: () => void;
}) {
  const candidates = (
    p.images && p.images.length > 0
      ? p.images
      : p.item_image
      ? [p.item_image]
      : []
  ).filter((u): u is string => !!u);

  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const visible = candidates.filter((_, i) => !failed[i]);
  const primarySrc = candidates[primaryIdx] && !failed[primaryIdx] ? candidates[primaryIdx] : visible[0];

  const externalUrl = p.item_url || p.affiliate_url || null;

  const fabricEntries = p.fabric_composition
    ? Object.entries(p.fabric_composition)
        .filter(([, v]) => typeof v === "number" && v > 0)
        .sort(([, a], [, b]) => b - a)
    : [];

  const risk = p.risk_level;
  const riskMap = {
    low: { color: "var(--risk-low)", label: "Low risk" },
    moderate: { color: "var(--orange)", label: "Moderate risk" },
    high: { color: "var(--red)", label: "High risk" },
  } as const;

  return (
    <div
      style={{
        border: "1px solid var(--hairline-strong)",
        borderRadius: 16,
        background: "var(--white)",
        overflow: "hidden",
        animation: "reviewCardIn 280ms ease",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1fr)",
          gap: 0,
        }}
        className="review-card-grid"
      >
        {/* Image column */}
        <div style={{ background: "var(--tan)", padding: 20 }}>
          <div
            style={{
              position: "relative",
              aspectRatio: "266 / 334",
              background: "var(--tan)",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid var(--hairline)",
            }}
          >
            {primarySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primarySrc}
                alt={p.item_name || ""}
                onError={() =>
                  setFailed((prev) => ({ ...prev, [primaryIdx]: true }))
                }
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--sans)",
                  fontSize: 10,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                No image
              </div>
            )}
          </div>

          {/* Gallery thumbnails */}
          {candidates.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {candidates.map((src, i) =>
                failed[i] ? null : (
                  <button
                    key={src + i}
                    onClick={() => setPrimaryIdx(i)}
                    style={{
                      width: 48,
                      height: 60,
                      borderRadius: 6,
                      overflow: "hidden",
                      padding: 0,
                      cursor: "pointer",
                      background: "var(--white)",
                      border: `1px solid ${i === primaryIdx ? "var(--ink)" : "var(--hairline-strong)"}`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Info column */}
        <div style={{ padding: "28px 30px" }}>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontSize: "clamp(24px, 2.4vw, 32px)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.022em",
              color: "var(--ink)",
              margin: "0 0 10px",
            }}
          >
            {p.item_name || "Untitled"}
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <span style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--ink-2)" }}>
              {p.brand}
            </span>
            {p.item_price != null && (
              <span style={{ fontFamily: "var(--sans)", fontSize: 17, color: "var(--ink)" }}>
                ${p.item_price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Score + risk */}
          {(p.toxome_score != null || risk) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              {p.toxome_score != null && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "5px 12px",
                    borderRadius: 999,
                    background: "var(--cream)",
                    border: `1px solid ${hazardColor(p.toxome_score)}`,
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      background: hazardColor(p.toxome_score),
                    }}
                  />
                  {p.toxome_score} Toxome Score
                </span>
              )}
              {risk && riskMap[risk] && (
                <span
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "var(--ink)",
                    background: riskMap[risk].color,
                    padding: "5px 11px",
                    borderRadius: 999,
                  }}
                >
                  {riskMap[risk].label}
                </span>
              )}
            </div>
          )}

          {/* External link */}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--ink-2)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                marginBottom: 20,
              }}
            >
              View on {p.brand} ↗
            </a>
          )}

          {/* Fabric composition bars */}
          {fabricEntries.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <ReviewSectionHeading>Materials</ReviewSectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {fabricEntries.map(([fiber, pct]) => {
                  const percent = pct > 1 ? pct : pct * 100;
                  return (
                    <div key={fiber}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          fontFamily: "var(--sans)",
                          fontSize: 13,
                          color: "var(--ink)",
                          marginBottom: 4,
                        }}
                      >
                        <span>{prettyFiber(fiber)}</span>
                        <span style={{ color: "var(--ink-2)" }}>{Math.round(percent)}%</span>
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
            </div>
          )}

          {p.materials_text && (
            <p
              style={{
                fontFamily: "var(--sans)",
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                margin: "0 0 16px",
                whiteSpace: "pre-wrap",
              }}
            >
              {p.materials_text}
            </p>
          )}

          {p.description && (
            <div style={{ marginBottom: 16 }}>
              <ReviewSectionHeading>About</ReviewSectionHeading>
              <p
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {p.description}
              </p>
            </div>
          )}

          {p.certifications && p.certifications.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <ReviewSectionHeading>Certifications</ReviewSectionHeading>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {p.certifications.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 11,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: "var(--ink-2)",
                      border: "1px solid var(--hairline-strong)",
                      padding: "5px 12px",
                      borderRadius: 999,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision bar */}
      <div
        style={{
          background: "var(--cream)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onReject}
          disabled={deciding}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--sans)",
            fontSize: 15,
            padding: "12px 26px",
            borderRadius: 999,
            border: "1px solid var(--red)",
            background: "rgba(200,66,66,0.08)",
            color: "var(--red)",
            cursor: deciding ? "not-allowed" : "pointer",
            opacity: deciding ? 0.6 : 1,
          }}
        >
          Reject
          <kbd style={kbdStyle}>R</kbd>
        </button>

        <button
          onClick={onSkip}
          disabled={deciding}
          style={{
            fontFamily: "var(--sans)",
            fontSize: 13,
            padding: "12px 18px",
            borderRadius: 999,
            border: "1px solid var(--hairline-strong)",
            background: "var(--white)",
            color: "var(--ink-2)",
            cursor: deciding ? "not-allowed" : "pointer",
            opacity: deciding ? 0.6 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Skip
          <kbd style={kbdStyle}>→</kbd>
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={onApprove}
          disabled={deciding}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--sans)",
            fontSize: 15,
            fontWeight: 500,
            padding: "12px 32px",
            borderRadius: 999,
            border: "1px solid var(--ink)",
            background: "var(--ink)",
            color: "var(--white)",
            cursor: deciding ? "not-allowed" : "pointer",
            opacity: deciding ? 0.6 : 1,
          }}
        >
          Approve
          <kbd style={{ ...kbdStyle, borderColor: "rgba(255,255,255,0.4)", color: "var(--white)" }}>
            A
          </kbd>
        </button>
      </div>

      <style jsx>{`
        @keyframes reviewCardIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 760px) {
          :global(.review-card-grid) {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

function ReviewSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "var(--sans)",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        margin: "0 0 12px",
      }}
    >
      {children}
    </h3>
  );
}

const kbdStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontSize: 10,
  lineHeight: 1,
  padding: "3px 6px",
  borderRadius: 5,
  border: "1px solid var(--hairline-strong)",
  color: "var(--ink-3)",
  background: "transparent",
};

const reviewShellStyle: React.CSSProperties = {
  border: "1px solid var(--hairline-strong)",
  borderRadius: 16,
  background: "var(--white)",
};

const reviewEmptyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "72px 24px",
};

// ---- Edit panel ------------------------------------------------------
// Fixed option sets for the edit form dropdowns (mirror the DB values).
const CATEGORY_OPTIONS = [
  "Tops", "Bottoms", "Dresses", "Outerwear", "Sweaters", "Activewear",
  "Loungewear", "Pajamas", "Intimates", "Undergarments", "Footwear",
  "Accessories", "Other",
];
const GENDER_OPTIONS = ["Women", "Men", "Unisex"];
const OCCASION_OPTIONS = [
  "Everyday", "Workwear", "Evening", "Special Occasion", "Vacation/Resort",
];

function EditPanel({
  p,
  busy,
  onSave,
}: {
  p: AdminProduct;
  busy: boolean;
  onSave: (fields: Record<string, unknown>) => void;
}) {
  const [itemName, setItemName] = useState(p.item_name ?? "");
  const [brand, setBrand] = useState(p.brand ?? "");
  const [price, setPrice] = useState(p.item_price != null ? String(p.item_price) : "");
  const [category, setCategory] = useState(p.category ?? "");
  const [gender, setGender] = useState(p.gender ?? "");
  const [occasion, setOccasion] = useState<string[]>(p.occasion ?? []);
  const [itemImage, setItemImage] = useState(p.item_image ?? "");
  const [description, setDescription] = useState(p.description ?? "");
  const [certs, setCerts] = useState((p.certifications ?? []).join(", "));
  const [compJson, setCompJson] = useState(
    JSON.stringify(p.fabric_composition ?? {}, null, 2)
  );
  const [jsonError, setJsonError] = useState("");

  // Live preview of the recomputed score from the JSON textarea.
  let previewScore: number | null = null;
  let previewRisk: string | null = null;
  try {
    const parsed = JSON.parse(compJson || "{}") as Record<string, number>;
    previewScore = calcToxomeScore(parsed);
    previewRisk = scoreToRiskLevel(previewScore);
  } catch {
    /* invalid JSON, no preview */
  }

  function handleSave() {
    setJsonError("");
    let comp: Record<string, number> | null;
    try {
      const parsed = compJson.trim() ? JSON.parse(compJson) : {};
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Composition must be a JSON object");
      }
      comp = Object.keys(parsed).length ? parsed : null;
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }

    const fields: Record<string, unknown> = {
      item_name: itemName,
      brand,
      item_price: price.trim() === "" ? null : Number(price),
      category: category || null,
      gender: gender || null,
      occasion: occasion.length ? occasion : null,
      item_image: itemImage || null,
      description: description || null,
      certifications: certs
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      fabric_composition: comp,
    };
    onSave(fields);
  }

  return (
    <div
      style={{
        padding: "18px 24px 24px 74px",
        background: "var(--cream)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          maxWidth: 720,
        }}
      >
        <Field label="Item name">
          <input style={editInputStyle} value={itemName} onChange={(e) => setItemName(e.target.value)} />
        </Field>
        <Field label="Brand">
          <input style={editInputStyle} value={brand} onChange={(e) => setBrand(e.target.value)} />
        </Field>
        <Field label="Price">
          <input style={editInputStyle} value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Category">
          <select style={editInputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">(none)</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Gender">
          <select style={editInputStyle} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">(none)</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Image URL">
          <input style={editInputStyle} value={itemImage} onChange={(e) => setItemImage(e.target.value)} />
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Description">
            <textarea
              style={{ ...editInputStyle, minHeight: 60, resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Certifications (comma-separated)">
            <input style={editInputStyle} value={certs} onChange={(e) => setCerts(e.target.value)} />
          </Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Occasion (tap to toggle)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {OCCASION_OPTIONS.map((o) => {
                const on = occasion.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() =>
                      setOccasion((cur) =>
                        cur.includes(o)
                          ? cur.filter((x) => x !== o)
                          : [...cur, o]
                      )
                    }
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      padding: "6px 12px",
                      borderRadius: 999,
                      cursor: "pointer",
                      border: on
                        ? "1px solid var(--ink)"
                        : "1px solid var(--hairline-strong)",
                      background: on ? "var(--ink)" : "transparent",
                      color: on ? "var(--cream)" : "var(--ink-2)",
                    }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Fabric composition (JSON: { fiber: percent })">
            <textarea
              style={{
                ...editInputStyle,
                minHeight: 90,
                resize: "vertical",
                fontFamily: "var(--sans)",
                fontSize: 12,
              }}
              value={compJson}
              onChange={(e) => setCompJson(e.target.value)}
            />
          </Field>
          <div style={{ marginTop: 6, fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-2)" }}>
            Recomputed score:{" "}
            {previewScore != null ? (
              <strong style={{ color: hazardColor(previewScore) }}>
                {previewScore} · {previewRisk}
              </strong>
            ) : (
              "–"
            )}
          </div>
          {jsonError && <p style={errorTextStyle}>{jsonError}</p>}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <RowButton tone="approve" disabled={busy} onClick={handleSave}>
          {busy ? "Saving…" : "Save changes"}
        </RowButton>
      </div>
    </div>
  );
}

// ---- Small components / styles --------------------------------------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontFamily: "var(--sans)",
          fontSize: 10,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 5,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function RowButton({
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

function StatCard({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: number | undefined;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        flex: "1 1 140px",
        minWidth: 130,
        padding: "16px 18px",
        borderRadius: 12,
        background: highlight ? "rgba(230,166,56,0.10)" : "var(--white)",
        border: `1px solid ${highlight ? "var(--orange)" : "var(--hairline-strong)"}`,
      }}
    >
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 10,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: muted ? "var(--ink-3)" : "var(--ink-2)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 30,
          fontWeight: 300,
          letterSpacing: "-0.02em",
          color: highlight ? "var(--orange)" : "var(--ink)",
        }}
      >
        {value ?? "–"}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--sans)",
        fontSize: 11,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontWeight: 300,
  fontSize: 28,
  letterSpacing: "-0.025em",
  color: "var(--ink)",
  margin: "0 0 18px",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--hairline-strong)",
  borderRadius: 8,
  padding: "9px 13px",
  background: "var(--white)",
  color: "var(--ink)",
  fontSize: 13,
  fontFamily: "var(--sans)",
  outline: "none",
  boxSizing: "border-box",
};

const editInputStyle: React.CSSProperties = {
  ...inputStyle,
  width: "100%",
};

const ghostButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  border: "1px solid var(--hairline-strong)",
  borderRadius: 999,
  padding: "11px 22px",
  background: "var(--white)",
  color: "var(--ink)",
  fontSize: 14,
  fontFamily: "var(--sans)",
  cursor: "pointer",
};

function solidButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    border: "1px solid var(--ink)",
    borderRadius: 999,
    padding: "11px 22px",
    background: "var(--ink)",
    color: "var(--white)",
    fontSize: 14,
    fontFamily: "var(--sans)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}

const errorTextStyle: React.CSSProperties = {
  fontFamily: "var(--sans)",
  fontSize: 13,
  color: "var(--red)",
  margin: "10px 0 0",
};

const listHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "11px 18px",
  fontFamily: "var(--sans)",
  fontSize: 10,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  background: "var(--cream)",
};

const emptyRowStyle: React.CSSProperties = {
  padding: "40px 18px",
  textAlign: "center",
  fontFamily: "var(--sans)",
  fontSize: 13,
  color: "var(--ink-3)",
};
