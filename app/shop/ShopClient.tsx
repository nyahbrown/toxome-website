"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/types/product";
import type { ShopTaxonomy } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { triggerAppPrompt } from "@/components/AppInstallPrompt";
import FrostedSelect from "@/components/FrostedSelect";
import WishlistHeart from "@/components/WishlistHeart";
import ScoreBadge from "@/components/ScoreBadge";
import CertBadge from "@/components/CertBadge";
import { normalizeFiber } from "@/lib/fabricScores";
import { EDITORS_PICKS, isEditorsPick } from "@/lib/editorsPicks";
import { track } from "@/lib/track";
import {
  healthCertBadge,
  productCertSlugs,
  HEALTH_CERTS,
  TOXOME_VERIFIED,
} from "@/lib/verification";
import { KIDS_AGE_BANDS, sizesToBands, type KidsAgeBand } from "@/lib/kidsSizes";
import { getSubfilter } from "@/lib/subfilters";

export type ShopSection = "women" | "men" | "kids" | "home" | null;

const PAGE_SIZE = 16;

// The set of active filter constraints. Shared by the live grid and the mobile
// Refine sheet's "Show N results" count so the two never disagree.
type FilterState = {
  sectionGender: string | null;
  section: string | null;
  fiber: string | null;
  category: string; // "All" or a category name
  // Second level beneath category, only meaningful under Women > Intimates.
  subcategory: string | null;
  certSlugs: string[]; // empty = no cert constraint
  occasion: string | null;
  age: KidsAgeBand | null;
  brand: string | null;
  priceBand: { min: number; max: number } | null;
  query: string; // already lowercased
};

// Single source of truth for "does this product pass the current filters?".
// Sort is deliberately excluded — it reorders, never filters.
function matchesFilters(p: Product, f: FilterState): boolean {
  if (f.sectionGender && p.gender !== f.sectionGender) return false;
  if (f.fiber) {
    // Match on the base fiber so "mulberry silk" filters under silk, etc.
    const target = normalizeFiber(f.fiber);
    const fibers = Object.keys(p.fabric_composition || {}).map(normalizeFiber);
    if (!fibers.includes(target)) return false;
  }
  if (f.category !== "All" && p.category !== f.category) return false;
  // Guarded by the category check above: subcategory is only ever set while a
  // category that has a split is selected, so this can't strand products in
  // other categories that legitimately carry no subcategory.
  if (f.subcategory && p.subcategory !== f.subcategory) return false;
  // ANY-match: picking GOTS + OEKO-TEX shows products carrying either, not both.
  if (
    f.certSlugs.length > 0 &&
    !productCertSlugs(p).some((s) => f.certSlugs.includes(s))
  )
    return false;
  if (f.occasion && !(p.occasion ?? []).includes(f.occasion)) return false;
  if (f.section === "kids" && f.age && !sizesToBands(p.sizes).includes(f.age))
    return false;
  if (f.brand && p.brand !== f.brand) return false;
  if (f.priceBand) {
    const pr = p.item_price;
    if (pr == null || pr < f.priceBand.min || pr >= f.priceBand.max) return false;
  }
  if (f.query) {
    const haystack = [p.item_name, p.brand, p.category, p.gender]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(f.query)) return false;
  }
  return true;
}

// Every cert the registry knows about, plus the doc-verified pseudo-cert. The
// filter only ever offers the subset that has stock in the current section (see
// certOptions), so a shopper can never pick an option that returns nothing.
const ALL_CERT_BADGES = [...HEALTH_CERTS, TOXOME_VERIFIED];

// Sort menu — shared by the desktop sort pill and the mobile Sort dropdown.
const SORT_OPTIONS = [
  "Featured",
  "Lowest Risk",
  "Newest",
  "Oldest",
  "Price: Low to High",
  "Price: High to Low",
];

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

// Kids age bands (Newborn / Baby / Toddler / Kids) are derived from each
// product's `sizes` at filter time via lib/kidsSizes — KIDS_AGE_BANDS is the
// canonical list. A product spans every band its size range covers.

// Kids price bands (kids-only filter). Match is min <= price < max so a price
// landing exactly on a boundary falls into the higher band.
const KIDS_PRICE_BANDS = [
  { label: "Under $25", value: "under-25", min: 0, max: 25 },
  { label: "$25 – $50", value: "25-50", min: 25, max: 50 },
  { label: "$50 & Up", value: "50-up", min: 50, max: Infinity },
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
  // Health/verifying certs only (OEKO-TEX, GOTS, bluesign, …), deduped by slug
  // so multiple OEKO-TEX variants collapse into one logo. Rendered as circular
  // logo badges on the card, capped so a heavily-certified piece doesn't overrun.
  const certBadges = (() => {
    const seen = new Set<string>();
    const out: { slug: string; label: string }[] = [];
    for (const raw of p.certifications ?? []) {
      const b = healthCertBadge(raw);
      if (b && !seen.has(b.slug)) {
        seen.add(b.slug);
        out.push(b);
      }
    }
    return out;
  })();
  const MAX_CERT_BADGES = 3;
  const shownCerts = certBadges.slice(0, MAX_CERT_BADGES);
  const extraCerts = certBadges.length - shownCerts.length;

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
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Cached / fast-decoding images are often already `complete` before onLoad
    // ever fires. This reset MUST re-check that, or the card stays stuck at
    // opacity 0 (grey) forever. Show immediately when the current src is already
    // decoded; otherwise wait for onLoad.
    const node = imgRef.current;
    setLoaded(!!(node && node.complete && node.naturalWidth > 0));
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
              loading="lazy"
              decoding="async"
              ref={imgRef}
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
                loading="lazy"
                decoding="async"
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
              padding: "0 18px",
              textAlign: "center",
              fontFamily: "var(--mono)",
              fontSize: 11,
              lineHeight: 1.4,
              letterSpacing: ".04em",
              color: "var(--ink-3)",
            }}
          >
            {p.item_name}
          </div>
        )}
        {editorsPick ? (
          // Featured — outlined "Best Seller"-style pill: frosted cream fill so
          // it reads over any photo, thin ink outline, ink text. No solid accent.
          <span
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: "rgba(252,251,247,0.82)",
              backdropFilter: "blur(8px) saturate(150%)",
              WebkitBackdropFilter: "blur(8px) saturate(150%)",
              color: "var(--ink)",
              border: "1px solid var(--ink)",
              fontFamily: "var(--sans)",
              fontSize: 12.5,
              fontWeight: 500,
              letterSpacing: "-0.005em",
              padding: "5px 14px",
              borderRadius: 999,
            }}
          >
            Featured
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
        {/* Toxome verdict — the moat, surfaced on every card while browsing.
            Same GREAT/GOOD/OKAY/BAD treatment as the product page (ScoreBadge),
            with the numeric 0–100 score appended. */}
        {(p.toxome_score != null || p.risk_level) && (
          <ScoreBadge
            score={p.toxome_score}
            level={p.risk_level}
            showScore
            overlay
          />
        )}
        {shownCerts.length > 0 && (
          // Certification logo circles, stacked down the right edge below the
          // wishlist heart — each a white logo badge under a "CERTIFIED" eyebrow,
          // mirroring the editorial "featured in" treatment. These replace the
          // old "Verified" text pill: the logos are the verification signal.
          <div className="card-cert-stack" aria-hidden={false}>
            {shownCerts.map((c) => (
              <span
                key={c.slug}
                title={c.label}
                style={{ display: "flex" }}
              >
                <CertBadge slug={c.slug} name={c.label} size={52} />
              </span>
            ))}
            {extraCerts > 0 && (
              <span className="card-cert-stack__more">+{extraCerts}</span>
            )}
          </div>
        )}
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
  const ageRaw = searchParams.get("age");
  const ageFilter =
    ageRaw && KIDS_AGE_BANDS.some((a) => a.value === ageRaw.toLowerCase())
      ? (ageRaw.toLowerCase() as KidsAgeBand)
      : null;
  const query = (searchParams.get("q") || "").trim();

  // Certification filter. Options are built from the live catalog for this
  // section and ranked by stock, so the list only ever offers certs that return
  // products, and the ones shoppers actually see (GOTS, OEKO-TEX) sit on top.
  const certOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (sectionGender && p.gender !== sectionGender) continue;
      for (const slug of productCertSlugs(p)) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }
    return ALL_CERT_BADGES.filter((c) => (counts.get(c.slug) ?? 0) > 0)
      .map((c) => ({
        value: c.slug,
        label: c.label,
        meta: String(counts.get(c.slug)),
        count: counts.get(c.slug)!,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [products, sectionGender]);

  // ?certs=gots,oeko-tex-standard-100 → ["gots", "oeko-tex-standard-100"].
  // Unknown or out-of-stock slugs are dropped so a stale link can't filter the
  // grid down to nothing with an option the shopper can't even see to remove.
  const certSlugs = useMemo(() => {
    const raw = searchParams.get("certs");
    if (!raw) return [];
    const available = new Set(certOptions.map((o) => o.value));
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => available.has(s));
  }, [searchParams, certOptions]);

  const certKey = certSlugs.join(",");
  const toParam = (slugs: string[]) => (slugs.length ? slugs.join(",") : null);
  const toggleCert = (slug: string) =>
    updateParams({
      certs: toParam(
        certSlugs.includes(slug)
          ? certSlugs.filter((s) => s !== slug)
          : [...certSlugs, slug]
      ),
    });

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

  // Occasion is an apparel concept — Everyday, Workwear, Evening. It's dead under
  // Activewear (all inherently everyday/athletic), so it's dropped there and a
  // stale ?occasion= link resolves to nothing rather than filtering the grid
  // invisibly with a pill the shopper can't see to remove.
  const occasionRaw = searchParams.get("occasion");
  const occasionFilter =
    occasionRaw &&
    category !== "Activewear" &&
    OCCASIONS.some((o) => o.toLowerCase() === occasionRaw.toLowerCase())
      ? OCCASIONS.find((o) => o.toLowerCase() === occasionRaw.toLowerCase())!
      : null;

  // Second-level filter, offered only under a category that splits (Women >
  // Intimates or Women > Activewear). getSubfilter returns null for everything
  // else, so a stale ?sub= link can't silently filter the whole grid down to
  // nothing with a pill the shopper can't see to remove.
  const subfilter = getSubfilter(section, category);
  const subRaw = searchParams.get("sub");
  const subcategoryFilter =
    subRaw && subfilter
      ? subfilter.options.find(
          (s) => s.toLowerCase() === subRaw.toLowerCase()
        ) ?? null
      : null;

  // Brands available in the current section, ranked by stock (kids only for now).
  // Lets parents narrow to the baby brands they already trust.
  const sectionBrands = useMemo<string[]>(() => {
    if (section !== "kids") return [];
    const m = new Map<string, number>();
    for (const p of products) {
      if (p.gender === "Kids" && p.brand) m.set(p.brand, (m.get(p.brand) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([b]) => b);
  }, [products, section]);

  const brandRaw = searchParams.get("brand");
  const brandFilter =
    brandRaw && sectionBrands.some((b) => b.toLowerCase() === brandRaw.toLowerCase())
      ? sectionBrands.find((b) => b.toLowerCase() === brandRaw.toLowerCase())!
      : null;

  const priceRaw = searchParams.get("price");
  const priceBand =
    section === "kids"
      ? KIDS_PRICE_BANDS.find((b) => b.value === priceRaw) ?? null
      : null;

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
      // iOS: saving is peak intent, funnel to the app (closet lives there).
      // Off iOS, triggerAppPrompt returns false and we fall back to web login.
      if (triggerAppPrompt("save")) return;
      sessionStorage.setItem("pendingLike", p.id);
      sessionStorage.setItem("pendingLikeProduct", JSON.stringify(p));
      router.push(`/login?return=${sectionPath}`);
      return;
    }
    toggleWishlist(p);
  }

  // The currently-applied constraints, in the shape matchesFilters expects.
  const activeFilters = useMemo<FilterState>(
    () => ({
      sectionGender,
      section,
      fiber: fiberFilter,
      category,
      subcategory: subcategoryFilter,
      certSlugs,
      occasion: occasionFilter,
      age: ageFilter,
      brand: brandFilter,
      priceBand,
      query: query.toLowerCase(),
    }),
    // certKey (not certSlugs) — the array is a new identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sectionGender,
      section,
      fiberFilter,
      category,
      subcategoryFilter,
      certKey,
      occasionFilter,
      ageFilter,
      brandFilter,
      priceBand,
      query,
    ]
  );

  const filtered = useMemo(() => {
    let result = products.filter((p) => matchesFilters(p, activeFilters));

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
  }, [products, activeFilters, section, sort]);

  // Count how many products a hypothetical filter set would show, so the mobile
  // Refine sheet can label its apply button "Show N results" before committing.
  const countForFilters = (f: FilterState) =>
    products.reduce((n, p) => (matchesFilters(p, f) ? n + 1 : n), 0);

  const hasUserFilters =
    !!fiberFilter ||
    !!occasionFilter ||
    !!ageFilter ||
    !!brandFilter ||
    !!priceBand ||
    category !== "All" ||
    query.length > 0 ||
    certSlugs.length > 0;

  // Count of filters the mobile Refine sheet controls (search box excluded —
  // it lives in the nav, not the sheet). Drives the "Refine · N" badge.
  // Certs count once no matter how many are ticked, matching the one-row-per-
  // filter shape of the sheet.
  const refineCount =
    (category !== "All" ? 1 : 0) +
    (subcategoryFilter ? 1 : 0) +
    (fiberFilter ? 1 : 0) +
    (certSlugs.length > 0 ? 1 : 0) +
    (occasionFilter ? 1 : 0) +
    (brandFilter ? 1 : 0) +
    (priceBand ? 1 : 0) +
    (ageFilter ? 1 : 0);

  // Open state for the mobile Refine side sheet.
  const [refineOpen, setRefineOpen] = useState(false);

  // Auto-load pagination, reveal a fresh PAGE_SIZE every time the
  // sentinel below the grid scrolls into view. Reset to first page
  // whenever any filter changes.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [section, fiberFilter, occasionFilter, ageFilter, category, query, sort, certKey, brandFilter, priceBand]);
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

      {/* Kids trust banner: the catalog is uniformly GOTS organic cotton, so we
          state it as a guarantee instead of offering a one-option fiber filter. */}
      {section === "kids" && (
        <div
          className="shell"
          style={{ textAlign: "center", paddingBottom: 28, marginTop: -8 }}
        >
          <p
            style={{
              fontSize: 16,
              color: "var(--ink-2)",
              textTransform: "none",
              margin: "0 auto",
              maxWidth: 520,
            }}
          >
            every piece in the kids edit is GOTS-certified organic cotton.
          </p>
        </div>
      )}

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
          {/* Desktop/tablet: the full row of inline filter pills. display:contents
              keeps them as direct flex children of .shop-filterbar; hidden on
              phones (<=640px) in favor of the Sort + Refine bar below. */}
          <div className="shop-filterbar__desktop-filters">
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
              // Leaving a category drops its sub-filter — a Bras pill would be
              // meaningless under Tops, and stale ones shouldn't lie in wait in
              // the URL for the next time Intimates is picked.
              onChange={(v) => updateParams({ category: v, sub: null })}
              stickyLabel
            />
          )}
          {/* Second cut shoppers want once they're inside a category that splits
              — Bras/Underwear under Intimates, Sports Bras/Leggings/Shorts/Tops
              under Activewear. Women only; getSubfilter returns null elsewhere so
              the pill never offers a dead option. */}
          {subfilter && (
            <FrostedSelect
              label={subfilter.label}
              options={[...subfilter.options]}
              value={subcategoryFilter ?? "All"}
              onChange={(v) => updateParams({ sub: v === "All" ? null : v })}
              stickyLabel
            />
          )}
          {/* Fiber + Certification are uniform across the kids catalog (all
              organic cotton, all GOTS), so they'd be dead filters there — hidden
              in favor of Brand + Price below. */}
          {section !== "kids" && (
          <FrostedSelect
            label="Fiber"
            options={FIBERS.map((f) => f.name)}
            value={fiberValue}
            onChange={(v) => updateParams({ fiber: v === "All" ? null : v })}
            capitalize
            stickyLabel
          />
          )}
          {section !== "kids" && certOptions.length > 0 && (
          <FrostedSelect
            label="Certification"
            options={certOptions}
            multiple
            values={certSlugs}
            value="All"
            onChange={(v) => (v === "All" ? updateParams({ certs: null }) : toggleCert(v))}
            onSelectAll={() =>
              updateParams({ certs: toParam(certOptions.map((o) => o.value)) })
            }
            stickyLabel
          />
          )}
          {/* Brand + Price, kids only — the variables that actually differ
              across an otherwise uniformly clean baby catalog. */}
          {section === "kids" && sectionBrands.length > 0 && (
          <FrostedSelect
            label="Brand"
            options={sectionBrands}
            value={brandFilter ?? "All"}
            onChange={(v) => updateParams({ brand: v === "All" ? null : v })}
            stickyLabel
          />
          )}
          {section === "kids" && (
          <FrostedSelect
            label="Price"
            options={KIDS_PRICE_BANDS.map((b) => b.label)}
            value={priceBand?.label ?? "All"}
            onChange={(v) =>
              updateParams({
                price:
                  v === "All"
                    ? null
                    : KIDS_PRICE_BANDS.find((b) => b.label === v)?.value ?? null,
              })
            }
            stickyLabel
          />
          )}
          {/* Occasion is an apparel concept, irrelevant for home goods and kids,
              and dead under Activewear (everything there is everyday/athletic). */}
          {section !== "home" && section !== "kids" && category !== "Activewear" && (
          <FrostedSelect
            label="Occasion"
            options={OCCASIONS}
            value={occasionFilter ?? "All"}
            onChange={(v) => updateParams({ occasion: v })}
            stickyLabel
          />
          )}
          {/* Age split, kids only. */}
          {section === "kids" && (
          <FrostedSelect
            label="Age"
            options={KIDS_AGE_BANDS.map((b) => b.label)}
            value={KIDS_AGE_BANDS.find((b) => b.value === ageFilter)?.label ?? "All"}
            onChange={(v) =>
              updateParams({
                age:
                  v === "All"
                    ? null
                    : KIDS_AGE_BANDS.find((b) => b.label === v)?.value ?? null,
              })
            }
            stickyLabel
          />
          )}
          </div>
          <div className="shop-filterbar__sort shop-filterbar__desktop-sort">
            <FrostedSelect
              label="Sort By"
              options={SORT_OPTIONS}
              value={sort}
              onChange={(v) =>
                updateParams({ sort: v === "Featured" ? null : v })
              }
              align="right"
              hideAll
            />
          </div>

          {/* Phones (<=640px): Sort dropdown + Refine, as underlined text
              controls aligned to the right. */}
          <div className="shop-filterbar__mobile">
            <FrostedSelect
              label="Sort"
              options={SORT_OPTIONS}
              value={sort}
              onChange={(v) =>
                updateParams({ sort: v === "Featured" ? null : v })
              }
              align="right"
              hideAll
              stickyLabel
              variant="text"
            />
            <button
              type="button"
              className="refine-btn"
              onClick={() => setRefineOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={refineOpen}
            >
              <span className="refine-btn__text">Refine</span>
              {refineCount > 0 && (
                <span className="refine-btn__badge">{refineCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-only filter side sheet, opened by the Refine button. */}
      <RefineSheet
        open={refineOpen}
        onClose={() => setRefineOpen(false)}
        section={section}
        sectionCategories={sectionCategories}
        sectionBrands={sectionBrands}
        certOptions={certOptions}
        products={products}
        baseFilters={activeFilters}
        applied={{
          category,
          subcategory: subcategoryFilter,
          fiber: fiberFilter,
          certs: certSlugs,
          occasion: occasionFilter,
          brand: brandFilter,
          price: priceRaw ?? null,
          age: ageFilter,
        }}
        onApply={(v) => {
          updateParams({
            category: v.category,
            sub: v.subcategory,
            fiber: v.fiber,
            certs: v.certs,
            occasion: v.occasion,
            brand: v.brand,
            price: v.price,
            age: v.age,
          });
          setRefineOpen(false);
        }}
      />

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
              onRemove={() => updateParams({ category: null, sub: null })}
            />
          )}
          {subcategoryFilter && (
            <FilterChip
              label={subcategoryFilter}
              onRemove={() => updateParams({ sub: null })}
            />
          )}
          {fiberFilter && (
            <FilterChip
              label={`${fiberFilter} fiber`}
              onRemove={() => updateParams({ fiber: null })}
            />
          )}
          {certSlugs.map((slug) => (
            <FilterChip
              key={slug}
              label={certOptions.find((o) => o.value === slug)?.label ?? slug}
              onRemove={() => toggleCert(slug)}
            />
          ))}
          {occasionFilter && (
            <FilterChip
              label={occasionFilter}
              onRemove={() => updateParams({ occasion: null })}
            />
          )}
          {ageFilter && (
            <FilterChip
              label={KIDS_AGE_BANDS.find((b) => b.value === ageFilter)?.label ?? ageFilter}
              onRemove={() => updateParams({ age: null })}
            />
          )}
          {brandFilter && (
            <FilterChip
              label={brandFilter}
              onRemove={() => updateParams({ brand: null })}
            />
          )}
          {priceBand && (
            <FilterChip
              label={priceBand.label}
              onRemove={() => updateParams({ price: null })}
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
                  sub: null,
                  fiber: null,
                  occasion: null,
                  age: null,
                  q: null,
                  certs: null,
                  brand: null,
                  price: null,
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

// Values the Refine sheet hands back on apply — the raw URL-param shapes
// updateParams expects (null clears a param).
type RefineValues = {
  category: string | null;
  subcategory: string | null;
  fiber: string | null;
  certs: string | null; // comma-joined slugs, null when none picked
  occasion: string | null;
  brand: string | null;
  price: string | null;
  age: string | null;
};

type CertOption = { value: string; label: string; meta: string };

// Mobile-only (<=640px) filter side sheet. All filters live here as accordion
// sections; selections are staged locally and only committed when the shopper
// taps "Show N results", so the grid doesn't churn under a full-screen sheet.
function RefineSheet({
  open,
  onClose,
  section,
  sectionCategories,
  sectionBrands,
  certOptions,
  products,
  baseFilters,
  applied,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  section: string | null;
  sectionCategories: string[];
  sectionBrands: string[];
  certOptions: CertOption[];
  products: Product[];
  baseFilters: FilterState;
  applied: {
    category: string;
    subcategory: string | null;
    fiber: string | null;
    certs: string[];
    occasion: string | null;
    brand: string | null;
    price: string | null;
    age: KidsAgeBand | null;
  };
  onApply: (v: RefineValues) => void;
}) {
  const emptyStaged = {
    category: "All",
    subcategory: null as string | null,
    fiber: null as string | null,
    certs: [] as string[],
    occasion: null as string | null,
    brand: null as string | null,
    price: null as string | null,
    age: null as string | null,
  };
  const [staged, setStaged] = useState(emptyStaged);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Re-seed the staged selection from what's applied each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setStaged({
      category: applied.category,
      subcategory: applied.subcategory,
      fiber: applied.fiber,
      certs: applied.certs,
      occasion: applied.occasion,
      brand: applied.brand,
      price: applied.price,
      age: applied.age,
    });
    setExpanded(null);
    // Only re-sync on open; applied is a fresh object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock body scroll and wire Escape-to-close while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  type Sec = {
    key: string;
    label: string;
    value: string | null;
    displayValue: string;
    options: { label: string; value: string; meta?: string }[];
    onSelect: (value: string | null) => void;
    // Multi-select rows (certs) tick checkboxes and stage an array. `onSelect(null)`
    // still clears the whole row, so the shared "All" option needs no special case.
    multi?: boolean;
    values?: string[];
    onToggle?: (value: string) => void;
  };
  const sections: Sec[] = [];
  if (sectionCategories.length > 0) {
    sections.push({
      key: "category",
      label: "Category",
      value: staged.category === "All" ? null : staged.category,
      displayValue: staged.category === "All" ? "All" : staged.category,
      options: sectionCategories.map((c) => ({ label: c, value: c })),
      // Changing category drops the sub-filter with it, matching the desktop
      // pill — otherwise the Type row vanishes still holding a staged value.
      // Activewear also drops Occasion, which isn't offered there.
      onSelect: (v) =>
        setStaged((s) => ({
          ...s,
          category: v ?? "All",
          subcategory: null,
          occasion: v === "Activewear" ? null : s.occasion,
        })),
    });
  }
  // Appears the moment a splitting category (Intimates / Activewear) is staged,
  // disappears when it isn't.
  const stagedSubfilter = getSubfilter(section, staged.category);
  if (stagedSubfilter) {
    sections.push({
      key: "subcategory",
      label: stagedSubfilter.label,
      value: staged.subcategory,
      displayValue: staged.subcategory ?? "All",
      options: stagedSubfilter.options.map((s) => ({ label: s, value: s })),
      onSelect: (v) => setStaged((s) => ({ ...s, subcategory: v })),
    });
  }
  if (section !== "kids") {
    sections.push({
      key: "fiber",
      label: "Fiber",
      value: staged.fiber,
      displayValue: staged.fiber ?? "All",
      options: FIBERS.map((f) => ({ label: f.name, value: f.name })),
      onSelect: (v) => setStaged((s) => ({ ...s, fiber: v })),
    });
    if (certOptions.length > 0) {
      sections.push({
        key: "certs",
        label: "Certification",
        value: null,
        displayValue:
          staged.certs.length === 0
            ? "All"
            : staged.certs.length === 1
              ? certOptions.find((o) => o.value === staged.certs[0])?.label ??
                staged.certs[0]
              : `${staged.certs.length} selected`,
        options: certOptions,
        multi: true,
        values: staged.certs,
        onSelect: () => setStaged((s) => ({ ...s, certs: [] })),
        onToggle: (v) =>
          setStaged((s) => ({
            ...s,
            certs: s.certs.includes(v)
              ? s.certs.filter((c) => c !== v)
              : [...s.certs, v],
          })),
      });
    }
  }
  if (section === "kids" && sectionBrands.length > 0) {
    sections.push({
      key: "brand",
      label: "Brand",
      value: staged.brand,
      displayValue: staged.brand ?? "All",
      options: sectionBrands.map((b) => ({ label: b, value: b })),
      onSelect: (v) => setStaged((s) => ({ ...s, brand: v })),
    });
  }
  if (section === "kids") {
    sections.push({
      key: "price",
      label: "Price",
      value: staged.price,
      displayValue:
        KIDS_PRICE_BANDS.find((b) => b.value === staged.price)?.label ?? "All",
      options: KIDS_PRICE_BANDS.map((b) => ({ label: b.label, value: b.value })),
      onSelect: (v) => setStaged((s) => ({ ...s, price: v })),
    });
  }
  if (section !== "home" && section !== "kids" && staged.category !== "Activewear") {
    sections.push({
      key: "occasion",
      label: "Occasion",
      value: staged.occasion,
      displayValue: staged.occasion ?? "All",
      options: OCCASIONS.map((o) => ({ label: o, value: o })),
      onSelect: (v) => setStaged((s) => ({ ...s, occasion: v })),
    });
  }
  if (section === "kids") {
    sections.push({
      key: "age",
      label: "Age",
      value: staged.age,
      displayValue:
        KIDS_AGE_BANDS.find((b) => b.value === staged.age)?.label ?? "All",
      options: KIDS_AGE_BANDS.map((b) => ({ label: b.label, value: b.value })),
      onSelect: (v) => setStaged((s) => ({ ...s, age: v })),
    });
  }

  // Live match count for the staged selection → the apply-button label.
  const band = staged.price
    ? KIDS_PRICE_BANDS.find((b) => b.value === staged.price)
    : null;
  const stagedFilters: FilterState = {
    ...baseFilters,
    category: staged.category,
    subcategory: staged.subcategory,
    fiber: staged.fiber,
    certSlugs: staged.certs,
    occasion: staged.occasion,
    brand: staged.brand,
    priceBand: band ? { min: band.min, max: band.max } : null,
    age: (staged.age as KidsAgeBand | null) ?? null,
  };
  const count = products.reduce(
    (n, p) => (matchesFilters(p, stagedFilters) ? n + 1 : n),
    0
  );

  const stagedCount =
    (staged.category !== "All" ? 1 : 0) +
    (staged.subcategory ? 1 : 0) +
    (staged.fiber ? 1 : 0) +
    (staged.certs.length > 0 ? 1 : 0) +
    (staged.occasion ? 1 : 0) +
    (staged.brand ? 1 : 0) +
    (staged.price ? 1 : 0) +
    (staged.age ? 1 : 0);

  const apply = () =>
    onApply({
      category: staged.category === "All" ? null : staged.category,
      subcategory: staged.subcategory,
      fiber: staged.fiber,
      certs: staged.certs.length ? staged.certs.join(",") : null,
      occasion: staged.occasion,
      brand: staged.brand,
      price: staged.price,
      age: staged.age,
    });

  return (
    <div className={`refine-sheet-root${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="refine-scrim" onClick={onClose} />
      <aside
        className="refine-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Refine filters"
      >
        <header className="refine-panel__head">
          <span className="refine-panel__title">Refine</span>
          <button
            type="button"
            className="refine-panel__close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="refine-panel__body">
          {sections.map((sec) => {
            const isOpen = expanded === sec.key;
            return (
              <div className="refine-acc" key={sec.key}>
                <button
                  type="button"
                  className="refine-acc__head"
                  onClick={() => setExpanded(isOpen ? null : sec.key)}
                  aria-expanded={isOpen}
                >
                  <span className="refine-acc__label">{sec.label}</span>
                  <span className="refine-acc__value">{sec.displayValue}</span>
                  <svg
                    className={`refine-acc__chev${isOpen ? " is-open" : ""}`}
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    className="refine-acc__body"
                    role={sec.multi ? "group" : "radiogroup"}
                    aria-label={sec.label}
                  >
                    <RefineOption
                      label="All"
                      selected={sec.multi ? (sec.values?.length ?? 0) === 0 : sec.value === null}
                      onClick={() => sec.onSelect(null)}
                      multi={sec.multi}
                    />
                    {sec.options.map((opt) => (
                      <RefineOption
                        key={opt.value}
                        label={opt.label}
                        meta={opt.meta}
                        selected={
                          sec.multi
                            ? !!sec.values?.includes(opt.value)
                            : sec.value === opt.value
                        }
                        onClick={() =>
                          sec.multi
                            ? sec.onToggle?.(opt.value)
                            : sec.onSelect(opt.value)
                        }
                        multi={sec.multi}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="refine-panel__foot">
          <button
            type="button"
            className="refine-clear"
            onClick={() => setStaged(emptyStaged)}
            disabled={stagedCount === 0}
          >
            Clear all
          </button>
          <button type="button" className="refine-apply" onClick={apply}>
            {count === 0
              ? "No results"
              : `Show ${count} ${count === 1 ? "result" : "results"}`}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function RefineOption({
  label,
  meta,
  selected,
  onClick,
  multi = false,
}: {
  label: string;
  meta?: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      className={`refine-opt${selected ? " is-selected" : ""}`}
      onClick={onClick}
    >
      <span
        className={multi ? "refine-opt__check" : "refine-opt__radio"}
        aria-hidden="true"
      />
      <span>{label}</span>
      {meta && <span className="refine-opt__meta">{meta}</span>}
    </button>
  );
}
