"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { HeartFilled, HeartOutline } from "@/components/icons";
// Single source of truth for fiber hazard colors + labels — keeps the product
// page bars in sync with the score table (alpaca/cashmere green, Lenzing green,
// recycled synthetics red, "european linen" -> linen via keyword fallback, etc.)
import { fiberHazardColor, prettyFiber } from "@/lib/fabricScores";
import { track, withUtm } from "@/lib/track";

function RiskChip({
  score,
  level,
}: {
  score?: number | null;
  level?: "low" | "moderate" | "high" | null;
}) {
  // Four-word verdict, matching the Toxome browser extension (higher = cleaner):
  // >=85 Great, >=68 Good, >=40 Okay, else Bad. Color follows the 3-band ramp.
  let m: { color: string; label: string };
  if (score != null) {
    m = {
      label: score >= 85 ? "Great" : score >= 68 ? "Good" : score >= 40 ? "Okay" : "Bad",
      color: score >= 68 ? "var(--risk-low)" : score >= 40 ? "var(--orange)" : "var(--red)",
    };
  } else {
    const fallback = {
      low: { color: "var(--risk-low)", label: "Good" },
      moderate: { color: "var(--orange)", label: "Okay" },
      high: { color: "var(--red)", label: "Bad" },
    } as const;
    m = fallback[level ?? "low"];
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--mono)",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ink)",
        background: m.color,
        padding: "5px 11px",
        borderRadius: 999,
      }}
    >
      {m.label}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "var(--mono)",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        margin: "0 0 14px",
      }}
    >
      {children}
    </h3>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--hairline)",
        margin: "28px 0",
      }}
    />
  );
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { user, wishlist, toggleWishlist } = useAuth();
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const isWishlisted = wishlist.has(product.id);
  const buyUrl = product.affiliate_url || product.item_url || null;
  // UTM-tagged so the brand can verify Toxome-referred traffic in their own GA.
  const outboundUrl = buyUrl ? withUtm(buyUrl) : null;

  // Record a product view once per product, so the dashboard can show demand
  // (and click-through rate) even for products that don't get a Buy click.
  useEffect(() => {
    track("product_view", {
      brand: product.brand,
      productId: product.id,
      productName: product.item_name,
      category: product.category,
      scoreAtTime: product.toxome_score,
      userId: user?.uid ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const images = (product.images && product.images.length > 0
    ? product.images
    : product.item_image
    ? [product.item_image]
    : []) as string[];

  const fabricEntries = product.fabric_composition
    ? Object.entries(product.fabric_composition)
        .filter(([, v]) => typeof v === "number" && v > 0)
        .sort(([, a], [, b]) => b - a)
    : [];

  function handleWishlist() {
    if (!user) {
      sessionStorage.setItem("pendingLike", product.id);
      sessionStorage.setItem("pendingLikeProduct", JSON.stringify(product));
      router.push(`/login?return=/shop/${product.id}`);
      return;
    }
    toggleWishlist(product);
  }

  return (
    <main
      className="product-detail"
      style={{
        background: "var(--linen)",
        minHeight: "100vh",
        paddingTop: 88,
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 32,
        }}
        className="product-detail-grid"
      >
        {/* Image column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {images.length === 0 ? (
            <div
              style={{
                position: "relative",
                aspectRatio: "266 / 334",
                background: "var(--tan)",
                borderRadius: 10,
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
          ) : (
            images.map((src, i) =>
              imgError[i] ? null : (
                <div
                  key={src + i}
                  style={{
                    position: "relative",
                    aspectRatio: "266 / 334",
                    background: "var(--tan)",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${product.item_name} — image ${i + 1}`}
                    onError={() =>
                      setImgError((prev) => ({ ...prev, [i]: true }))
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )
            )
          )}
        </div>

        {/* Info column */}
        <div className="product-detail-info">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              <Link href="/shop" style={{ color: "inherit" }}>
                Shop
              </Link>
              {product.category && (
                <>
                  {" / "}
                  <Link
                    href={`/shop?category=${encodeURIComponent(product.category)}`}
                    style={{ color: "inherit" }}
                  >
                    {product.category}
                  </Link>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={isWishlisted ? "Remove from saved" : "Save item"}
              style={{
                flexShrink: 0,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: isWishlisted ? "var(--ink)" : "var(--ink-2)",
                transition: "color 180ms ease",
              }}
            >
              {isWishlisted ? <HeartFilled /> : <HeartOutline />}
            </button>
          </div>

          <h1
            style={{
              fontFamily: "var(--sans)",
              fontSize: "clamp(30px, 3.4vw, 44px)",
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: "-0.022em",
              color: "var(--ink)",
              margin: "0 0 14px",
            }}
          >
            {product.item_name}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <span
              style={{
                fontSize: 15,
                color: "var(--ink-2)",
                letterSpacing: "-0.005em",
              }}
            >
              {product.brand}
            </span>
            {product.item_price != null && (
              <span
                style={{
                  fontSize: 18,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                ${product.item_price.toLocaleString()}
              </span>
            )}
          </div>

          {(product.toxome_score != null || product.risk_level) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
                marginBottom: 26,
              }}
            >
              {(product.toxome_score != null || product.risk_level) && (
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--ink-2)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  Toxome Rating
                </span>
              )}
              {(product.toxome_score != null || product.risk_level) && (
                <RiskChip score={product.toxome_score} level={product.risk_level} />
              )}
            </div>
          )}

          {/* Buy CTA */}
          <div style={{ marginBottom: 12 }}>
            {buyUrl ? (
              <a
                href={outboundUrl!}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="pill-cta"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() =>
                  track("outbound_click", {
                    brand: product.brand,
                    productId: product.id,
                    productName: product.item_name,
                    category: product.category,
                    scoreAtTime: product.toxome_score,
                    userId: user?.uid ?? null,
                  })
                }
              >
                Buy at {product.brand}
              </a>
            ) : (
              <span
                className="pill-cta"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  opacity: 0.55,
                  cursor: "not-allowed",
                }}
              >
                Unavailable
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.06em",
              color: "var(--ink-3)",
              margin: "0 0 8px",
            }}
          >
            Opens in a new tab · may contain affiliate link
          </p>

          {product.description && (
            <>
              <Divider />
              <SectionHeading>About</SectionHeading>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  letterSpacing: "-0.005em",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {product.description}
              </p>
            </>
          )}

          {(product.materials_text || fabricEntries.length > 0) && (
            <>
              <Divider />
              <SectionHeading>Materials</SectionHeading>
              {fabricEntries.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginBottom: product.materials_text ? 18 : 0,
                  }}
                >
                  {fabricEntries.map(([fiber, pct]) => {
                    const percent = pct > 1 ? pct : pct * 100;
                    return (
                      <div key={fiber}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            fontSize: 14,
                            color: "var(--ink)",
                            letterSpacing: "-0.005em",
                            marginBottom: 5,
                          }}
                        >
                          <Link
                            href={`/shop?fiber=${encodeURIComponent(
                              fiber.toLowerCase()
                            )}`}
                            style={{
                              color: "inherit",
                              textDecoration: "underline",
                              textUnderlineOffset: 3,
                              textDecorationColor: "var(--hairline-strong)",
                            }}
                          >
                            {prettyFiber(fiber)}
                          </Link>
                          <span style={{ color: "var(--ink-2)" }}>
                            {Math.round(percent)}%
                          </span>
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
              )}
              {product.materials_text && (
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: "var(--ink-2)",
                    letterSpacing: "-0.005em",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {product.materials_text}
                </p>
              )}
            </>
          )}

          {product.certifications && product.certifications.length > 0 && (
            <>
              <Divider />
              <SectionHeading>Certifications</SectionHeading>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {product.certifications.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--mono)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--ink-2)",
                      background: "transparent",
                      border: "1px solid var(--hairline-strong)",
                      padding: "5px 12px",
                      borderRadius: 999,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          :global(.product-detail-grid) {
            grid-template-columns: minmax(0, 1fr) 420px !important;
            gap: 56px !important;
            align-items: start;
          }
          :global(.product-detail-info) {
            position: sticky;
            top: 96px;
          }
        }
        @media (min-width: 1200px) {
          :global(.product-detail-grid) {
            grid-template-columns: minmax(0, 1fr) 460px !important;
            gap: 72px !important;
          }
        }
      `}</style>
    </main>
  );
}
