"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { HeartFilled, HeartOutline } from "@/components/icons";
import { triggerAppPrompt } from "@/components/AppInstallPrompt";
import CertBadge from "@/components/CertBadge";
import VerificationRung from "@/components/VerificationRung";
import ScoreBadge from "@/components/ScoreBadge";
// Single source of truth for fiber hazard colors + labels, keeps the product
// page bars in sync with the score table (alpaca/cashmere green, Lenzing green,
// recycled synthetics red, "european linen" -> linen via keyword fallback, etc.)
import { prettyFiber } from "@/lib/fabricScores";
import FiberBars from "@/components/FiberBars";
import { fiberGuideHref } from "@/lib/fiberGuide";
import { collectionSlugForFiber } from "@/lib/shopPages";
import { productSeoDescription } from "@/lib/productSeo";
import { track } from "@/lib/track";
import { OUTBOUND_REL } from "@/lib/affiliate";

// A named fiber goes to its guide page: the reader looking at a composition is
// asking what the fiber IS, not what else is made of it. Fibers with no guide
// page fall back to their collection page, then to the filtered shop.
function fiberHref(fiber: string): string {
  const guide = fiberGuideHref(fiber);
  if (guide) return guide;
  const slug = collectionSlugForFiber(fiber);
  return slug
    ? `/shop/collection/${slug}`
    : `/shop?fiber=${encodeURIComponent(fiber.toLowerCase())}`;
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

// Sections are separated by spacing, not rule lines (house rule: no dividers).
// Kept as a component so all call sites stay put; it now renders pure space.
function Divider() {
  return <div aria-hidden style={{ height: 48 }} />;
}

type CertBadgeItem = {
  slug: string;
  name: string;
  abbr?: string;
  label: string;
  logoSrc?: string;
  href?: string;
};

function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [errored, setErrored] = useState<Set<string>>(new Set());
  const touchX = useRef<number | null>(null);

  const visible = images.filter((src) => !errored.has(src));
  const cur = visible.length ? Math.min(active, visible.length - 1) : 0;

  const go = (n: number) => {
    const len = visible.length;
    if (!len) return;
    setActive(((n % len) + len) % len);
  };

  if (visible.length === 0) {
    return (
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
    );
  }

  return (
    <div className="pdp-gallery">
      <div className="pdp-thumbs">
        {visible.map((src, i) => (
          <button
            key={src}
            className={i === cur ? "pdp-thumb is-active" : "pdp-thumb"}
            aria-label={`View image ${i + 1}`}
            aria-current={i === cur}
            onClick={() => setActive(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              onError={() => setErrored((p) => new Set(p).add(src))}
            />
          </button>
        ))}
      </div>

      <div
        className="pdp-main"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
        }}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
          if (Math.abs(dx) > 40) go(dx < 0 ? cur + 1 : cur - 1);
          touchX.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visible[cur]}
          alt={alt}
          onError={() => setErrored((p) => new Set(p).add(visible[cur]))}
        />

        {visible.length > 1 && (
          <>
            <button
              className="pdp-arrow pdp-arrow-left"
              aria-label="Previous image"
              onClick={() => go(cur - 1)}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="14 5 8 11 14 17" />
              </svg>
            </button>
            <button
              className="pdp-arrow pdp-arrow-right"
              aria-label="Next image"
              onClick={() => go(cur + 1)}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 5 14 11 8 17" />
              </svg>
            </button>
          </>
        )}

        {visible.length > 1 && (
          <div className="pdp-dots">
            {visible.map((_, i) => (
              <span key={i} className={i === cur ? "pdp-dot is-active" : "pdp-dot"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailClient({
  product,
  certBadges = [],
  outboundHref = null,
}: {
  product: Product;
  certBadges?: CertBadgeItem[];
  // Resolved on the server (lib/affiliatePrograms.ts): /out/<id> when one of our
  // own wrappers applies, a direct UTM-tagged merchant link when Skimlinks is the
  // only earner. Never rebuild it here — a client cannot read
  // brand_affiliate_programs, and a wrong guess silently costs the commission.
  outboundHref?: string | null;
}) {
  const router = useRouter();
  const { user, wishlist, toggleWishlist } = useAuth();
  const isWishlisted = wishlist.has(product.id);
  const outboundUrl = outboundHref;

  // A same-origin /out link must keep sending its Referer: the route logs it to
  // outbound_clicks to show which page drove the click, and OUTBOUND_REL's
  // `noreferrer` would blank that column. Nothing leaks by dropping it here —
  // the link is same-origin, and /out sets its own Referrer-Policy: no-referrer
  // on the onward hop to the brand.
  const outboundRel = outboundUrl?.startsWith("/out/")
    ? "noopener sponsored"
    : OUTBOUND_REL;

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

  // Special case: items that disclose fibers but no percentage breakdown
  // (e.g. home goods like pillows). We list the fibers present — no bars, no
  // Toxome score — only when there's no real composition to show instead.
  const fibersPresent =
    fabricEntries.length === 0 && product.fibers_present?.length
      ? product.fibers_present
      : [];

  function handleWishlist() {
    if (!user) {
      // On iOS, saving is peak intent: send them to the app (their closet lives
      // there) instead of a web login. triggerAppPrompt returns false off iOS,
      // where we fall back to the normal web login flow.
      if (triggerAppPrompt("save")) return;
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
        }}
        className="product-detail-grid"
      >
        {/* Image column */}
        <ProductGallery images={images} alt={product.item_name} />

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
                <ScoreBadge score={product.toxome_score} level={product.risk_level} />
              )}
              <VerificationRung
                certifications={product.certifications}
                verification_rung={product.verification_rung}
              />
            </div>
          )}

          {/* Buy CTA */}
          <div style={{ marginBottom: 12 }}>
            {outboundUrl ? (
              <a
                href={outboundUrl}
                target="_blank"
                rel={outboundRel}
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

          {/* Always render an About paragraph: the brand-written description when
              present, otherwise one generated from the product's own fiber/score
              data, so no product page is left without unique body copy. */}
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
            {product.description || productSeoDescription(product)}
          </p>

          {(product.materials_text ||
            fabricEntries.length > 0 ||
            fibersPresent.length > 0) && (
            <>
              <Divider />
              <SectionHeading>Materials</SectionHeading>
              {fibersPresent.length > 0 && (
                <div style={{ marginBottom: product.materials_text ? 18 : 0 }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    {fibersPresent.map((fiber) => (
                      <Link
                        key={fiber}
                        href={fiberHref(fiber)}
                        style={{
                          fontSize: 14,
                          color: "var(--ink)",
                          letterSpacing: "-0.005em",
                          background: "transparent",
                          border: "1px solid var(--hairline-strong)",
                          padding: "5px 12px",
                          borderRadius: 999,
                          textDecoration: "none",
                        }}
                      >
                        {prettyFiber(fiber)}
                      </Link>
                    ))}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      color: "var(--ink-3)",
                      margin: 0,
                    }}
                  >
                    Fibers present — no percentage breakdown published, so this
                    item isn&apos;t scored.
                  </p>
                </div>
              )}
              {fabricEntries.length > 0 && (
                <FiberBars
                  entries={fabricEntries}
                  style={{ marginBottom: product.materials_text ? 18 : 0 }}
                />
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

          {certBadges.length > 0 && (
            <>
              <Divider />
              <SectionHeading>Certifications</SectionHeading>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "20px 22px",
                }}
              >
                {certBadges.map((c) => {
                  const inner = (
                    <>
                      <CertBadge
                        slug={c.slug}
                        name={c.name}
                        abbr={c.abbr}
                        size={64}
                        logoSrc={c.logoSrc}
                      />
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10.5,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--ink-3)",
                          maxWidth: 96,
                          lineHeight: 1.3,
                        }}
                      >
                        {c.label}
                      </span>
                    </>
                  );
                  const wrap = {
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "center",
                    gap: 11,
                    textAlign: "center" as const,
                    width: 96,
                  };
                  return c.href ? (
                    <Link key={c.slug} href={c.href} style={wrap}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={c.slug} style={wrap}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          :global(.product-detail-info) {
            position: sticky;
            top: 96px;
          }
        }
      `}</style>
    </main>
  );
}
