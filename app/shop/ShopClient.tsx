"use client";
import { useState, useMemo } from "react";
import type { Product } from "@/types/product";

const RISK_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  low:      { bg: "#ADC89C", color: "#233d18", label: "Low Risk" },
  moderate: { bg: "#E6A638", color: "#4a2e00", label: "Moderate" },
  high:     { bg: "#C84242", color: "#fff",    label: "High Risk" },
};

function FilterPill({
  label, active, onClick,
}: {
  label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
        letterSpacing: "-0.005em", cursor: "pointer", whiteSpace: "nowrap",
        transition: "all 180ms cubic-bezier(.22,.61,.36,1)",
        border: active ? "0" : "1px solid rgba(20,24,27,0.14)",
        background: active ? "#3B3C3A" : "transparent",
        color: active ? "#fff" : "#3B3C3A",
      }}
    >
      {label}
    </button>
  );
}

function ProductCard({ p }: { p: Product }) {
  const [hovered, setHovered] = useState(false);
  const shopUrl = p.affiliate_url || p.item_url;
  const risk = p.risk_level ? RISK_STYLE[p.risk_level] : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 14, overflow: "hidden", display: "flex",
        flexDirection: "column",
        boxShadow: hovered
          ? "0 4px 24px rgba(20,24,27,.12)"
          : "0 1px 3px rgba(20,24,27,.06), 0 4px 16px rgba(20,24,27,.04)",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "transform 220ms cubic-bezier(.22,.61,.36,1), box-shadow 220ms cubic-bezier(.22,.61,.36,1)",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", paddingBottom: "100%", background: "#f0efea", flexShrink: 0 }}>
        {p.item_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.item_image}
            alt={p.item_name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "ui-monospace,SFMono-Regular,monospace",
            fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "#57636C",
          }}>No image</div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
          {risk && (
            <span style={{
              background: risk.bg, color: risk.color,
              fontFamily: "ui-monospace,SFMono-Regular,monospace", fontSize: 10, fontWeight: 600,
              letterSpacing: ".07em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 999,
            }}>{risk.label}</span>
          )}
          {p.brand_verified && (
            <span style={{
              background: "#14181B", color: "#fff",
              fontFamily: "ui-monospace,SFMono-Regular,monospace", fontSize: 10, fontWeight: 600,
              letterSpacing: ".07em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 999,
            }}>Verified</span>
          )}
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{
          fontFamily: "ui-monospace,SFMono-Regular,monospace", fontSize: 10.5, fontWeight: 500,
          letterSpacing: ".12em", textTransform: "uppercase", color: "#57636C",
        }}>{p.brand}</div>
        <div style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: "-0.012em", color: "#14181B" }}>
          {p.item_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 1 }}>
          {p.item_price != null && (
            <span style={{ fontSize: 14, fontWeight: 600, color: "#14181B" }}>
              ${p.item_price.toLocaleString()}
            </span>
          )}
          {p.budget && (
            <span style={{
              fontSize: 11, fontFamily: "ui-monospace,SFMono-Regular,monospace",
              color: "#57636C", letterSpacing: ".04em",
            }}>{p.budget}</span>
          )}
        </div>
        {p.category && (
          <div style={{ marginTop: 3 }}>
            <span style={{
              fontSize: 10.5, fontFamily: "ui-monospace,SFMono-Regular,monospace",
              background: "#E1DCCC", color: "#3B3C3A", padding: "3px 9px",
              borderRadius: 999, letterSpacing: ".06em", textTransform: "uppercase",
            }}>{p.category}</span>
          </div>
        )}
        {shopUrl ? (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{
              marginTop: "auto", paddingTop: 14, display: "inline-flex", alignItems: "center",
              gap: 6, fontSize: 13, fontWeight: 500, color: "#3B3C3A",
              borderTop: "1px solid rgba(20,24,27,0.08)",
              textDecoration: "none",
            }}
          >
            Shop now
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 6h7m0 0L6 2.5M9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ) : (
          <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(20,24,27,0.08)" }} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ filters }: { filters: boolean }) {
  return (
    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px 0", color: "#57636C" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🧺</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>
        {filters ? "No items match those filters." : "No products yet — check back soon."}
      </div>
    </div>
  );
}

export default function ShopClient({ products }: { products: Product[] }) {
  const [category, setCategory] = useState("All");
  const [gender, setGender] = useState("All");
  const [budget, setBudget] = useState("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    return ["All", ...cats.sort()];
  }, [products]);

  const genders = useMemo(() => {
    const gs = Array.from(new Set(products.map(p => p.gender).filter(Boolean))) as string[];
    return gs.length > 0 ? ["All", ...gs.sort()] : [];
  }, [products]);

  const budgets = useMemo(() => {
    const bs = Array.from(new Set(products.map(p => p.budget).filter(Boolean))) as string[];
    return bs.length > 0 ? ["All", "$", "$$", "$$$"].filter(b => b === "All" || bs.includes(b)) : [];
  }, [products]);

  const filtered = useMemo(() => products.filter(p => {
    if (category !== "All" && p.category !== category) return false;
    if (gender !== "All" && p.gender !== gender) return false;
    if (budget !== "All" && p.budget !== budget) return false;
    return true;
  }), [products, category, gender, budget]);

  const hasFilters = category !== "All" || gender !== "All" || budget !== "All";

  return (
    <main style={{ background: "var(--bg)", minHeight: "60vh", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 40 }}>
        <div className="shell" style={{ paddingTop: 64 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Toxome · Shop</div>
          <h1 style={{
            fontWeight: 500, fontSize: "clamp(34px, 4.5vw, 54px)", lineHeight: 1.06,
            letterSpacing: "-0.04em", color: "var(--ink)", margin: "0 0 16px",
          }}>
            Clean clothing,<br />
            <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>curated for you.</em>
          </h1>
          <p style={{ fontSize: 17, color: "var(--ink-2)", margin: 0, maxWidth: 520, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            Every item is hand-selected for lower toxin load.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ position: "sticky", top: 64, zIndex: 40, background: "rgba(231,230,222,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--hairline)", padding: "14px 0" }}>
        <div className="shell" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Category row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {categories.map(c => (
              <FilterPill key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>
          {/* Gender + Budget row */}
          {(genders.length > 1 || budgets.length > 1) && (
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {genders.length > 1 && (
                <div style={{ display: "flex", gap: 6 }}>
                  {genders.map(g => (
                    <FilterPill key={g} label={g} active={gender === g} onClick={() => setGender(g)} />
                  ))}
                </div>
              )}
              {genders.length > 1 && budgets.length > 1 && (
                <div style={{ width: 1, height: 20, background: "var(--hairline-strong)" }} />
              )}
              {budgets.length > 1 && (
                <div style={{ display: "flex", gap: 6 }}>
                  {budgets.map(b => (
                    <FilterPill key={b} label={b} active={budget === b} onClick={() => setBudget(b)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="shell" style={{ paddingTop: 48 }}>
        <div style={{ marginBottom: 24, fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {filtered.length} {filtered.length === 1 ? "item" : "items"}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 24,
        }}>
          {filtered.length === 0 ? (
            <EmptyState filters={hasFilters} />
          ) : (
            filtered.map(p => <ProductCard key={p.id} p={p} />)
          )}
        </div>
        <p style={{
          marginTop: 64, fontSize: 11.5, color: "var(--ink-3)",
          fontFamily: "var(--mono)", letterSpacing: ".04em",
        }}>
          The products featured here may contain affiliate links.
        </p>
      </div>
    </main>
  );
}
