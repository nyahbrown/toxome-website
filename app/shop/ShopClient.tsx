"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import FrostedSelect from "@/components/FrostedSelect";
import { StarIcon } from "@/components/icons";
import WishlistHeart from "@/components/WishlistHeart";

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
        {p.toxome_score != null && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--ink-2)",
              letterSpacing: "-0.005em",
            }}
          >
            <StarIcon />
            {p.toxome_score} Toxome Score
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        textAlign: "center",
        padding: "80px 0",
        color: "var(--ink-3)",
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: ".1em",
        textTransform: "uppercase",
      }}
    >
      {hasFilters ? "No items match those filters." : "No products yet — check back soon."}
    </div>
  );
}

export default function ShopClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const { user, wishlist, toggleWishlist } = useAuth();

  function handleToggle(p: Product) {
    if (!user) {
      sessionStorage.setItem("pendingLike", p.id);
      sessionStorage.setItem("pendingLikeProduct", JSON.stringify(p));
      router.push("/login?return=/shop");
      return;
    }
    toggleWishlist(p);
  }

  const [fiberFilter, setFiberFilter] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [gender, setGender] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fiber = params.get("fiber");
    if (fiber) setFiberFilter(fiber);

    const q = params.get("q");
    if (q) setQuery(q.trim());

    const matchExact = (raw: string | null, pool: (string | null)[]) => {
      if (!raw) return null;
      const lowered = raw.toLowerCase();
      const hit = pool.find((v) => v && v.toLowerCase() === lowered);
      return hit ?? null;
    };

    const g = matchExact(
      params.get("gender"),
      products.map((p) => p.gender)
    );
    if (g) setGender(g);

    const c = matchExact(
      params.get("category"),
      products.map((p) => p.category)
    );
    if (c) setCategory(c);
  }, [products]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      ) as string[],
    [products]
  );

  const genders = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.gender).filter(Boolean))
      ) as string[],
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = products.filter((p) => {
      if (fiberFilter) {
        const fibers = Object.keys(p.fabric_composition || {}).map((k) =>
          k.toLowerCase()
        );
        if (!fibers.includes(fiberFilter)) return false;
      }
      if (category !== "All" && p.category !== category) return false;
      if (gender !== "All" && p.gender !== gender) return false;
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
  }, [products, fiberFilter, category, gender, query, sort]);

  const hasFilters =
    !!fiberFilter ||
    category !== "All" ||
    gender !== "All" ||
    query.trim().length > 0;

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
          shop all
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
          clothing that&apos;s clean by design
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
                onClick={() => setFiberFilter(active ? null : fiber.name)}
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
            {categories.length > 0 && (
              <FrostedSelect
                label="Category"
                options={categories}
                value={category}
                onChange={setCategory}
              />
            )}
            {genders.length > 0 && (
              <FrostedSelect
                label="Gender"
                options={genders}
                value={gender}
                onChange={setGender}
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
            onChange={setSort}
            align="right"
            hideAll
          />
        </div>
      </div>

      {/* Product grid */}
      <div className="shell" style={{ maxWidth: "none", padding: "0 32px" }}>
        {fiberFilter && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
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
              }}
            >
              {filtered.length} {filtered.length === 1 ? "item" : "items"} · fiber:{" "}
              {fiberFilter}
            </span>
            <button
              onClick={() => setFiberFilter(null)}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                background: "none",
                border: "1px solid var(--hairline-strong)",
                borderRadius: 999,
                padding: "3px 10px",
                cursor: "pointer",
              }}
            >
              clear
            </button>
          </div>
        )}

        <div className="product-grid">
          {filtered.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            filtered.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                wishlist={wishlist}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>

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
