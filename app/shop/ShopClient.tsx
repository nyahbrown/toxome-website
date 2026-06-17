"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/types/product";
import type { ShopTaxonomy } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import FrostedSelect from "@/components/FrostedSelect";
import WishlistHeart from "@/components/WishlistHeart";
import { normalizeFiber } from "@/lib/fabricScores";
import { EDITORS_PICKS, isEditorsPick } from "@/lib/editorsPicks";
import { track } from "@/lib/track";

export type ShopSection = "women" | "men" | "kids" | "home" | null;

const PAGE_SIZE = 16;

const SECTION_META: Record<
  "women" | "men" | "kids" | "home",
  { title: string }
> = {
  women: { title: "women's" },
  men: { title: "men's" },
  kids: { title: "kids" },
  home: { title: "home" },
};

const FIBERS: { name: string; image: string; hover?: string }[] = [
  { name: "organic cotton", image: "/fibers/guide/organic_cotton.jpg" },
  { name: "silk", image: "/fibers/guide/silk.jpg" },
  { name: "linen", image: "/fibers/guide/linen.jpg" },
  { name: "hemp", image: "/fibers/guide/hemp.jpg" },
  { name: "wool", image: "/fibers/guide/wool.jpg", hover: "/fibers/guide/wool-2.jpg" },
  { name: "alpaca", image: "/fibers/guide/alpaca.jpg" },
  { name: "cashmere", image: "/fibers/guide/cashmere.jpg" },
  { name: "ramie", image: "/fibers/guide/ramie.jpg" },
];

// Lifestyle-5 occasion taxonomy, mirrors the `occasion` column values.
const OCCASIONS = [
  "Everyday",
  "Workwear",
  "Evening",
  "Special Occasion",
  "Vacation/Resort",
];

// Kids age split, mirrors the `age_band` column values.
const AGE_BANDS = [
  { label: "Baby", value: "baby" },
  { label: "Kids", value: "kids" },
] as const;

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
  const editorsPick = isEditorsPick(p.item_name);

  // Resilient image: try item_image, then each gallery image, then a placeholder.
  // Some retailers 404 or hotlink-block their main image; the gallery images are
  // mostly canonical CDN URLs that load reliably.
  const imgCandidates = [p.item_image, ...(p.images ?? [])].filter(
    (u): u is string => !!u
  );
  const [imgIdx, setImgIdx] = useState(0);
  const imgSrc = imgCandidates[imgIdx];
  // Second photo shown on hover (first candidate that differs from the primary).
  const [hoverErr, setHoverErr] = useState(false);
  const hoverSrc = imgCandidates.find((u) => u !== imgSrc);
  // Skeleton shimmer until the primary image decodes; reset if the src changes
  // (e.g. an onError fallback advances to the next candidate).
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
  }, [imgSrc]);

  return (
    <Link
      href={`/shop/${p.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ textDecoration: "none", display: "block" }}
    >
      {/* Image card, 266:334 aspect (portrait) */}
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
        {imgSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={p.item_name}
              ref={(node) => {
                // Cached images can be complete before onLoad attaches.
                if (node && node.complete && node.naturalWidth > 0) setLoaded(true);
              }}
              onLoad={() => setLoaded(true)}
              onError={() => setImgIdx((i) => i + 1)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: loaded ? 1 : 0,
                transition: "opacity 400ms ease, transform 400ms ease",
                transform: hovered ? "scale(1.03)" : "scale(1)",
              }}
            />
            {hoverSrc && !hoverErr && (
              // Second photo, cross-faded in on hover.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hoverSrc}
                alt=""
                aria-hidden="true"
                onError={() => setHoverErr(true)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: hovered ? 1 : 0,
                  transition: "opacity 300ms ease, transform 400ms ease",
                  transform: hovered ? "scale(1.03)" : "scale(1)",
                }}
              />
            )}
            {/* Skeleton shimmer over the image until it decodes */}
            <div
              className="skeleton-shimmer"
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                opacity: loaded ? 0 : 1,
                transition: "opacity 300ms ease",
                pointerEvents: "none",
              }}
            />
          </>
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
        {editorsPick ? (
          <span
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: "var(--blue)",
              color: "var(--ink)",
              fontFamily: "var(--sans)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              padding: "4px 12px",
              borderRadius: 999,
            }}
          >
            Editor&apos;s Pick
          </span>
        ) : isNew ? (
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
        ) : null}
        <WishlistHeart
          isWishlisted={isWishlisted}
          onClick={() => onToggle(p)}
          stopPropagation
        />
      </div>

      {/* Info below card */}
      <div style={{ paddingTop: 20 }}>
        <h2
          style={{
            fontFamily: "var(--sans)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            color: "var(--ink)",
            margin: "0 0 4px",
          }}
        >
          {p.item_name}
        </h2>
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
              <span style={{ margin: "0 6px" }}>·</span>
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
        gap: 7,
        fontFamily: "var(--sans)",
        fontSize: 14,
        letterSpacing: "-0.005em",
        color: "var(--ink)",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        lineHeight: 1.2,
      }}
      aria-label={`Remove ${label} filter`}
    >
      <span style={{ fontSize: 14, lineHeight: 1, color: "var(--ink)" }}>×</span>
      {label}
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
          : "No products yet. Check back soon."}
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
  heading,
}: {
  products: Product[];
  taxonomy: ShopTaxonomy;
  section: ShopSection;
  // Optional H1 override for SEO collection pages (e.g. "non-toxic baby
  // clothes"). When set it replaces the section/default title so the page has
  // exactly one, keyword-accurate H1. Omitted everywhere else = unchanged.
  heading?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, wishlist, toggleWishlist } = useAuth();
  const fiberRailRef = useRef<HTMLDivElement | null>(null);
  const scrollRail = (dir: 1 | -1) =>
    fiberRailRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  // Base path the section lives under, filter changes route here.
  const sectionPath =
    section === "women" ? "/shop/women"
    : section === "men" ? "/shop/men"
    : section === "kids" ? "/shop/kids"
    : section === "home" ? "/shop/home"
    : "/shop";

  // Section-imposed constraints (always applied, never appear as user filters).
  // Department lives on `gender` — Home is a real department alongside Women/Men.
  const sectionGender =
    section === "women" ? "Women"
    : section === "men" ? "Men"
    : section === "kids" ? "Kids"
    : section === "home" ? "Home"
    : null;

  // Categories selectable for the current section.
  const sectionCategories = useMemo<string[]>(() => {
    if (section === "women") return taxonomy.women;
    if (section === "men") return taxonomy.men;
    if (section === "kids") return taxonomy.kids;
    if (section === "home") return taxonomy.home;
    // null section = all categories, kept in relevance order (taxonomy is
    // already ranked by product count), deduped without re-alphabetizing.
    return Array.from(
      new Set([...taxonomy.women, ...taxonomy.men, ...taxonomy.kids, ...taxonomy.home])
    );
  }, [section, taxonomy]);

  // Read filters from URL (case-insensitive match against actual values).
  const fiberFilter = searchParams.get("fiber") || null;
  // Resolve the URL fiber to its curated option so the dropdown shows it as
  // selected regardless of casing; "All" when absent or off the curated list.
  const fiberValue = fiberFilter
    ? FIBERS.find((f) => f.name.toLowerCase() === fiberFilter.toLowerCase())
        ?.name ?? "All"
    : "All";
  const occasionRaw = searchParams.get("occasion");
  const occasionFilter =
    occasionRaw &&
    OCCASIONS.some((o) => o.toLowerCase() === occasionRaw.toLowerCase())
      ? OCCASIONS.find((o) => o.toLowerCase() === occasionRaw.toLowerCase())!
      : null;
  const ageRaw = searchParams.get("age");
  const ageFilter =
    ageRaw && AGE_BANDS.some((a) => a.value === ageRaw.toLowerCase())
      ? ageRaw.toLowerCase()
      : null;
  const query = (searchParams.get("q") || "").trim();

  // Record committed searches (debounced so we log the settled term, not every
  // keystroke), a free read on what shoppers want, including gaps we don't stock.
  useEffect(() => {
    if (!query) return;
    const t = setTimeout(
      () => track("search_query", { metadata: { q: query } }),
      800
    );
    return () => clearTimeout(t);
  }, [query]);

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

  // Push a partial URL update, replace so we don't pollute history per pill click.
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
      if (fiberFilter) {
        // Match on the base fiber so "mulberry silk" filters under silk,
        // "european linen" under linen, etc. Organic cotton stays distinct.
        const target = normalizeFiber(fiberFilter);
        const fibers = Object.keys(p.fabric_composition || {}).map(normalizeFiber);
        if (!fibers.includes(target)) return false;
      }
      if (category !== "All" && p.category !== category) return false;
      if (occasionFilter && !(p.occasion ?? []).includes(occasionFilter))
        return false;
      if (section === "kids" && ageFilter && p.age_band !== ageFilter)
        return false;
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
        // Higher Toxome Score = cleaner, so descending surfaces the cleanest
        // verified products first. Null scores sink to the bottom.
        const sa = a.toxome_score ?? -Infinity;
        const sb = b.toxome_score ?? -Infinity;
        if (sa !== sb) return sb - sa;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      // In women's AND shop-all, pin the hand-selected Editor's Picks to the
      // very top in their curated order, ahead of the rest of the Featured sort.
      if (section === "women" || section === null) {
        const picks: Product[] = [];
        for (const name of EDITORS_PICKS) {
          const found = result.find(
            (p) => p.item_name.toLowerCase() === name.toLowerCase()
          );
          if (found) picks.push(found);
        }
        if (picks.length) {
          const pickIds = new Set(picks.map((p) => p.id));
          result = [...picks, ...result.filter((p) => !pickIds.has(p.id))];
        }
      }
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
        const sa = a.toxome_score ?? -Infinity;
        const sb = b.toxome_score ?? -Infinity;
        return sb - sa;
      });
    }

    return result;
  }, [
    products,
    section,
    sectionGender,
    fiberFilter,
    occasionFilter,
    ageFilter,
    category,
    query,
    sort,
  ]);

  const hasUserFilters =
    !!fiberFilter ||
    !!occasionFilter ||
    !!ageFilter ||
    category !== "All" ||
    query.length > 0;

  // Auto-load pagination, reveal a fresh PAGE_SIZE every time the
  // sentinel below the grid scrolls into view. Reset to first page
  // whenever any filter changes.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [section, fiberFilter, occasionFilter, ageFilter, category, query, sort]);
  const visible = filtered.slice(0, visibleCount);
  const hiddenCount = Math.max(0, filtered.length - visibleCount);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (hiddenCount === 0) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hiddenCount, visibleCount]);

  const header = section ? SECTION_META[section] : null;

  return (
    <main style={{ background: "var(--linen)", minHeight: "100vh", paddingBottom: 120, paddingTop: 64 }}>
      {/* Page header */}
      <div
        style={{
          textAlign: "center",
          paddingTop: header ? 36 : 52,
          paddingBottom: header ? 32 : 48,
        }}
      >
        {!header && (
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
            shop all
          </div>
        )}
        <h1
          style={
            header
              ? {
                  fontFamily: "var(--sans)",
                  fontWeight: 500,
                  fontSize: 22,
                  lineHeight: 1.2,
                  letterSpacing: "-0.015em",
                  color: "var(--ink)",
                  margin: 0,
                }
              : {
                  fontFamily: "var(--sans)",
                  fontWeight: 500,
                  fontSize: "clamp(18px, 2.75vw, 34px)",
                  lineHeight: 1.25,
                  letterSpacing: "-0.018em",
                  color: "var(--ink)",
                  margin: "0 auto",
                  maxWidth: 640,
                  padding: "0 24px",
                }
          }
        >
          {heading
            ? heading
            : header
              ? category !== "All"
                ? `${header.title} | ${category.toLowerCase()}`
                : header.title
              : "There is no wellness without what touches the skin all day."}
        </h1>
      </div>

      {/* Browse by fiber, horizontal scrollable rail, only on /shop default */}
      {!section && (
      <div className="shell" style={{ paddingBottom: 52 }}>
        <div
          className="eyebrow"
          style={{ marginBottom: 20, textTransform: "uppercase" }}
        >
          Browse by fiber
        </div>
        <div className="fiber-rail-wrap">
          <button
            type="button"
            className="fiber-rail-arrow left"
            aria-label="Scroll fibers left"
            onClick={() => scrollRail(-1)}
          >
            <svg width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">
              <path d="M7.5 1 1.5 7.5l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="fiber-rail" ref={fiberRailRef}>
            {FIBERS.map((fiber) => {
              const active = fiberFilter === fiber.name;
              return (
                <button
                  key={fiber.name}
                  className="fiber-rail-item"
                  data-active={active}
                  onClick={() => updateParams({ fiber: active ? null : fiber.name })}
                >
                  <div className="fiber-rail-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fiber.image} alt={fiber.name} loading="lazy" />
                    {fiber.hover && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="fiber-rail-hover"
                        src={fiber.hover}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                      />
                    )}
                    {active && <div className="fiber-rail-tint" />}
                  </div>
                  <div className="fiber-rail-label">{fiber.name}</div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="fiber-rail-arrow right"
            aria-label="Scroll fibers right"
            onClick={() => scrollRail(1)}
          >
            <svg width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">
              <path d="m1.5 1 6 6.5-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      )}

      {/* Filter bar */}
      <div
        style={{
          padding: "14px 0",
          marginBottom: 10,
        }}
      >
        <div className="shell shop-filterbar">
          <span
            className="eyebrow shop-filterbar__label"
            style={{ flexShrink: 0, textTransform: "uppercase" }}
          >
            Filter by
          </span>
          {sectionCategories.length > 0 && (
            <FrostedSelect
              label="Category"
              options={sectionCategories}
              value={category}
              onChange={(v) => updateParams({ category: v })}
            />
          )}
          <FrostedSelect
            label="Fiber"
            options={FIBERS.map((f) => f.name)}
            value={fiberValue}
            onChange={(v) => updateParams({ fiber: v === "All" ? null : v })}
            capitalize
          />
          {/* Occasion is an apparel concept, irrelevant for home goods and kids. */}
          {section !== "home" && section !== "kids" && (
          <FrostedSelect
            label="Occasion"
            options={OCCASIONS}
            value={occasionFilter ?? "All"}
            onChange={(v) => updateParams({ occasion: v })}
          />
          )}
          {/* Age split, kids only. */}
          {section === "kids" && (
          <FrostedSelect
            label="Age"
            options={["Baby", "Kids"]}
            value={AGE_BANDS.find((a) => a.value === ageFilter)?.label ?? "All"}
            onChange={(v) =>
              updateParams({ age: v === "All" ? null : v.toLowerCase() })
            }
          />
          )}
          <div className="shop-filterbar__sort">
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
      </div>

      {/* Product grid */}
      <div className="shell">
        {/* Result count + active filter chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink)",
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
          {occasionFilter && (
            <FilterChip
              label={occasionFilter}
              onRemove={() => updateParams({ occasion: null })}
            />
          )}
          {ageFilter && (
            <FilterChip
              label={AGE_BANDS.find((a) => a.value === ageFilter)?.label ?? ageFilter}
              onRemove={() => updateParams({ age: null })}
            />
          )}
          {query && (
            <FilterChip
              label={`"${query}"`}
              onRemove={() => updateParams({ q: null })}
            />
          )}
        </div>

        <div className="product-grid">
          {filtered.length === 0 ? (
            <SmartEmpty
              hasUserFilters={hasUserFilters}
              onClear={() =>
                updateParams({
                  category: null,
                  fiber: null,
                  occasion: null,
                  age: null,
                  q: null,
                })
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
          <div
            ref={sentinelRef}
            aria-hidden="true"
            style={{ height: 1, marginTop: 1 }}
          />
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
