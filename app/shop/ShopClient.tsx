"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/types/product";
import type { ShopTaxonomy } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import FrostedSelect from "@/components/FrostedSelect";
import WishlistHeart from "@/components/WishlistHeart";

export type ShopSection = "women" | "men" | "home" | null;

const PAGE_SIZE = 16;

const SECTION_META: Record<
  "women" | "men" | "home",
  { eyebrow: string; title: string }
> = {
  women: { eyebrow: "shop women", title: "clothes for her, clean by design" },
  men: { eyebrow: "shop men", title: "clothes for him, clean by design" },
  home: { eyebrow: "shop home", title: "for the spaces you live in" },
};

const FIBERS: { name: string; image: string }[] = [
  { name: "cotton", image: "/fibers/cotton.jpg" },
  { name: "silk",   image: "/fibers/silk.jpg" },
  { name: "wool",   image: "/fibers/wool.jpg" },
  { name: "hemp",   image: "/fibers/hemp.jpg" },
  { name: "linen",  image: "/fibers/linen.jpg" },
];

function ProductCard({
  p,
  wishlist,
  onToggle,
}: {
  p: Product;
  wishlist: Set<string>;
  onToggle: (p: Product) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isWishlisted = wishlist.has(p.id);
  const isNew = p.tags?.some((t) => t.toLowerCase() === "new") ?? false;

  return (
    <Link
      href={`/shop/${p.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ textDecoration: "none", display: "block" }}
    >
      {/* Image card — 266:334 aspect (portrait) */}
      <div
        style={{
          position: "relative",
          paddingBottom: "125.56%",
          background: "var(--tan)",
          borderRadius: 10,
          overflow: "hidden",
          transition: "transform 200ms ease",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
      >
        {p.item_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.item_image}
            alt={p.item_name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 400ms ease",
              transform: hovered ? "scale(1.03)" : "scale(1)",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--tan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            No image
          </div>
        )}
        {isNew && (
          <span
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: "var(--ink)",
              color: "var(--white)",
              fontFamily: "var(--sans)",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "-0.005em",
              padding: "4px 12px",
              borderRadius: 999,
            }}
          >
            New
          </span>
        )}
        <WishlistHeart
          isWishlisted={isWishlisted}
          onClick={() => onToggle(p)}
          stopPropagation
        />
      </div>

      {/* Info below card */}
      <div style={{ paddingTop: 20 }}>
        <h3
          style={{
            fontFamily: "var(--serif)",
            fontSize: 20,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            margin: "0 0 6px",
          }}
        >
          {p.item_name}
        </h3>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            letterSpacing: "-0.005em",
            color: "var(--ink-2)",
            margin: "0 0 10px",
          }}
        >
          {p.brand}
          {p.item_price != null && (
            <>
              <span style={{ color: "var(--ink-3)", margin: "0 6px" }}>·</span>
              ${p.item_price.toLocaleString()}
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      onClick={onRemove}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--sans)",
        fontSize: 12,
        letterSpacing: "-0.005em",
        color: "var(--ink)",
        background: "transparent",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 999,
        padding: "4px 8px 4px 12px",
        cursor: "pointer",
        lineHeight: 1.2,
      }}
      aria-label={`Remove ${label} filter`}
    >
      {label}
      <span
        style={{
          fontSize: 14,
          lineHeight: 1,
          color: "var(--ink-3)",
          marginLeft: 2,
        }}
      >
        ×
      </span>
    </button>
  );
}

function SmartEmpty({
  hasUserFilters,
  onClear,
}: {
  hasUserFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        textAlign: "center",
        padding: "80px 24px",
        color: "var(--ink-2)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          margin: "0 0 14px",
        }}
      >
        {hasUserFilters
          ? "No items match those filters."
          : "No products yet — check back soon."}
      </p>
      {hasUserFilters && (
        <button
          onClick={onClear}
          className="pill-cta ghost"
          style={{ minWidth: 180, justifyContent: "center" }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function ShopClient({
  products,
  taxonomy,
  section,
}: {
  products: Product[];
  taxonomy: ShopTaxonomy;
  section: ShopSection;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, wishlist, toggleWishlist } = useAuth();

  // Base path the section lives under — filter changes route here.
  const sectionPath =
    section === "women" ? "/shop/women"
    : section === "men" ? "/shop/men"
    : section === "home" ? "/shop/home"
    : "/shop";

  // Section-imposed constraints (always applied, never appear as user filters).
  const sectionGender =
    section === "women" ? "Women" : section === "men" ? "Men" : null;
  const sectionCategoryConstraint = section === "home" ? "Other" : null;

  // Categories selectable for the current section.
  const sectionCategories = useMemo<string[]>(() => {
    if (section === "women") return taxonomy.women;
    if (section === "men") return taxonomy.men;
    if (section === "home") return []; // no sub-categories yet under Home
    // null section = all categories
    return Array.from(
      new Set([...taxonomy.women, ...taxonomy.men, ...taxonomy.home])
    ).sort();
  }, [section, taxonomy]);

  // Read filters from URL (case-insensitive match against actual values).
  const fiberFilter = searchParams.get("fiber") || null;
  const query = (searchParams.get("q") || "").trim();
  const rawSort = searchParams.get("sort");
  const sort = rawSort && rawSort.length > 0 ? rawSort : "Featured";
  const categoryRaw = searchParams.get("category");
  const category =
    categoryRaw &&
    sectionCategories.some(
      (c) => c.toLowerCase() === categoryRaw.toLowerCase()
    )
      ? sectionCategories.find(
          (c) => c.toLowerCase() === categoryRaw.toLowerCase()
        )!
      : "All";

  // Push a partial URL update — replace so we don't pollute history per pill click.
  function updateParams(updates: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "" || v === "All") p.delete(k);
      else p.set(k, v);
    }
    const qs = p.toString();
    router.replace(qs ? `${sectionPath}?${qs}` : sectionPath, {
      scroll: false,
    });
  }

  function handleToggle(p: Product) {
    if (!user) {
      sessionStorage.setItem("pendingLike", p.id);
      sessionStorage.setItem("pendingLikeProduct", JSON.stringify(p));
      router.push(`/login?return=${sectionPath}`);
      return;
    }
    toggleWishlist(p);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let result = products.filter((p) => {
      if (sectionGender && p.gender !== sectionGender) return false;
      if (sectionCategoryConstraint && p.category !== sectionCategoryConstraint)
        return false;
      if (fiberFilter) {
        const fibers = Object.keys(p.fabric_composition || {}).map((k) =>
          k.toLowerCase()
        );
        if (!fibers.includes(fiberFilter)) return false;
      }
      if (category !== "All" && p.category !== category) return false;
      if (q) {
        const haystack = [p.item_name, p.brand, p.category, p.gender]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sort === "Featured") {
      result = [...result].sort((a, b) => {
        const va = a.brand_verified ? 1 : 0;
        const vb = b.brand_verified ? 1 : 0;
        if (vb !== va) return vb - va;
        const sa = a.toxome_score ?? -Infinity;
        const sb = b.toxome_score ?? -Infinity;
        if (sb !== sa) return sb - sa;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } else if (sort === "Newest") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "Oldest") {
      result = [...result].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sort === "Price: Low to High") {
      result = [...result].sort(
        (a, b) => (a.item_price ?? Infinity) - (b.item_price ?? Infinity)
      );
    } else if (sort === "Price: High to Low") {
      result = [...result].sort(
        (a, b) => (b.item_price ?? -Infinity) - (a.item_price ?? -Infinity)
      );
    } else if (sort === "Lowest Risk") {
      const riskRank = { low: 0, moderate: 1, high: 2 } as const;
      result = [...result].sort((a, b) => {
        const ra = a.risk_level ? riskRank[a.risk_level] : 3;
        const rb = b.risk_level ? riskRank[b.risk_level] : 3;
        if (ra !== rb) return ra - rb;
        const sa = a.toxome_score ?? Infinity;
        const sb = b.toxome_score ?? Infinity;
        return sa - sb;
      });
    }

    return result;
  }, [
    products,
    sectionGender,
    sectionCategoryConstraint,
    fiberFilter,
    category,
    query,
    sort,
  ]);

  const hasUserFilters =
    !!fiberFilter || category !== "All" || query.length > 0;

  // Pagination — reset to first page when filters change.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [section, fiberFilter, category, query, sort]);
  const visible = filtered.slice(0, visibleCount);
  const hiddenCount = Math.max(0, filtered.length - visibleCount);

  const header = section ? SECTION_META[section] : null;

  return (
    <main style={{ background: "var(--linen)", minHeight: "100vh", paddingBottom: 120, paddingTop: 64 }}>
      {/* Page header */}
      <div style={{ textAlign: "center", paddingTop: 52, paddingBottom: 48 }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 24,
          }}
        >
          {header ? header.eyebrow : "shop all"}
        </div>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 400,
            fontSize: "clamp(36px, 5.5vw, 68px)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            margin: "0 auto",
            maxWidth: 780,
            padding: "0 24px",
          }}
        >
          {header ? header.title : "clothing that's clean by design"}
        </h1>
      </div>

      {/* Browse by fiber */}
      <div className="shell" style={{ paddingBottom: 52 }}>
        <div
          className="eyebrow"
          style={{ marginBottom: 20 }}
        >
          Browse by fiber
        </div>
        <div className="fiber-grid" style={{ gap: 8 }}>
          {FIBERS.map((fiber) => {
            const active = fiberFilter === fiber.name;
            return (
              <button
                key={fiber.name}
                onClick={() =>
                  updateParams({ fiber: active ? null : fiber.name })
                }
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    paddingBottom: "124.5%",
                    overflow: "hidden",
                    outline: active ? "2px solid var(--ink)" : "none",
                    outlineOffset: 2,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fiber.image}
                    alt={fiber.name}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: active ? 1 : 0.88,
                      transition: "opacity 160ms ease, transform 300ms ease",
                      transform: active ? "scale(1.03)" : "scale(1)",
                    }}
                  />
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(59,60,58,.12)",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    letterSpacing: "-0.005em",
                    color: active ? "var(--ink)" : "var(--ink-2)",
                    marginTop: 10,
                    fontWeight: active ? 500 : 400,
                    fontFamily: "var(--sans)",
                  }}
                >
                  {fiber.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          borderTop: "1px solid var(--hairline)",
          borderBottom: "1px solid var(--hairline)",
          padding: "14px 0",
          marginBottom: 32,
        }}
      >
        <div
          className="shell"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            className="eyebrow"
            style={{ flexShrink: 0, marginRight: 4 }}
          >
            Filter by
          </span>
          <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
            {sectionCategories.length > 0 && (
              <FrostedSelect
                label="Category"
                options={sectionCategories}
                value={category}
                onChange={(v) => updateParams({ category: v })}
              />
            )}
          </div>
          <FrostedSelect
            label="Sort By"
            options={[
              "Featured",
              "Lowest Risk",
              "Newest",
              "Oldest",
              "Price: Low to High",
              "Price: High to Low",
            ]}
            value={sort}
            onChange={(v) =>
              updateParams({ sort: v === "Featured" ? null : v })
            }
            align="right"
            hideAll
          />
        </div>
      </div>

      {/* Product grid */}
      <div className="shell" style={{ maxWidth: "none", padding: "0 32px" }}>
        {/* Result count + active filter chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginRight: 4,
            }}
          >
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </span>
          {category !== "All" && (
            <FilterChip
              label={category}
              onRemove={() => updateParams({ category: null })}
            />
          )}
          {fiberFilter && (
            <FilterChip
              label={`${fiberFilter} fiber`}
              onRemove={() => updateParams({ fiber: null })}
            />
          )}
          {query && (
            <FilterChip
              label={`"${query}"`}
              onRemove={() => updateParams({ q: null })}
            />
          )}
          {hasUserFilters && (
            <button
              onClick={() =>
                updateParams({
                  category: null,
                  fiber: null,
                  q: null,
                })
              }
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                background: "none",
                border: "none",
                padding: "3px 6px",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Clear all
            </button>
          )}
        </div>

        <div className="product-grid">
          {filtered.length === 0 ? (
            <SmartEmpty
              hasUserFilters={hasUserFilters}
              onClear={() =>
                updateParams({ category: null, fiber: null, q: null })
              }
            />
          ) : (
            visible.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                wishlist={wishlist}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>

        {hiddenCount > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 56 }}>
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="pill-cta ghost"
              style={{ minWidth: 200, justifyContent: "center" }}
            >
              Load more ({hiddenCount} remaining)
            </button>
          </div>
        )}

        <p
          style={{
            marginTop: 64,
            fontSize: 11,
            color: "var(--ink-3)",
            fontFamily: "var(--mono)",
            letterSpacing: ".04em",
          }}
        >
          Some products may contain affiliate links.
        </p>
      </div>
    </main>
  );
}
