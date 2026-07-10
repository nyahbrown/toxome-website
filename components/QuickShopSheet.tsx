"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { triggerAppPrompt } from "@/components/AppInstallPrompt";
import ScoreBadge from "@/components/ScoreBadge";
import CertBadge from "@/components/CertBadge";
import { fiberHazardColor, prettyFiber } from "@/lib/fabricScores";
import { findCertification } from "@/lib/certifications";
import { withUtm, track } from "@/lib/track";

// Right-side quick-view sheet opened from a QuickShopCard. Score-forward: leads
// with the Toxome rating and fiber breakdown (Toxome's edge), then certs, price,
// and two CTAs (affiliate click-out + free wishlist). Reusable, but currently
// hosted only by QuickShopProvider inside the Journal trend-edit grids.

// Small image gallery. Mounted with key={product.id} so it resets per product.
function SheetGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [errored, setErrored] = useState<Set<string>>(new Set());

  const visible = images.filter((s) => !errored.has(s));
  const cur = visible.length ? Math.min(active, visible.length - 1) : 0;

  if (visible.length === 0) {
    return <div className="qs-sheet__noimg">No image</div>;
  }

  return (
    <div className="qs-sheet__gallery">
      <div className="qs-sheet__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visible[cur]}
          alt={alt}
          onError={() => setErrored((s) => new Set(s).add(visible[cur]))}
        />
      </div>
      {visible.length > 1 && (
        <div className="qs-sheet__thumbs">
          {visible.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === cur ? "qs-sheet__thumb is-active" : "qs-sheet__thumb"}
              aria-label={`View image ${i + 1}`}
              aria-current={i === cur}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                onError={() => setErrored((s) => new Set(s).add(src))}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuickShopSheet({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user, wishlist, toggleWishlist } = useAuth();

  // `shown` keeps the last product mounted through the slide-out so its content
  // doesn't blank mid-animation; `open` drives the enter/exit transform.
  const [shown, setShown] = useState<Product | null>(product);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (product) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      setShown(product);
      const r = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(r);
    }
    setOpen(false);
    const t = setTimeout(() => setShown(null), 340);
    return () => clearTimeout(t);
  }, [product]);

  // While open: lock body scroll, close on Esc, trap Tab, and restore focus to
  // the trigger on close.
  useEffect(() => {
    if (!product) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("[data-autofocus]")
        ?.focus();
    }, 60);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!nodes || nodes.length === 0) return;
      const list = Array.from(nodes);
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      lastFocused.current?.focus?.();
    };
  }, [product, onClose]);

  if (!shown) return null;

  const p = shown;
  const buyUrl = p.affiliate_url || p.item_url || null;
  const outboundUrl = buyUrl ? withUtm(buyUrl) : null;
  const isWishlisted = wishlist.has(p.id);

  const gallery = Array.from(
    new Set([p.item_image, ...(p.images ?? [])].filter((u): u is string => !!u))
  );

  const fabricEntries = p.fabric_composition
    ? Object.entries(p.fabric_composition)
        .filter(([, v]) => typeof v === "number" && v > 0)
        .sort(([, a], [, b]) => b - a)
    : [];

  // Resolve each free-form certification string to the field-guide entry so the
  // sheet renders the same circular logo badge as the product detail page
  // (see app/shop/[id]/page.tsx). No filesystem logo lookup here since this is a
  // client component; CertBadge falls back to its own remote-logo/monogram chain.
  const certBadges = (p.certifications ?? []).map((raw) => {
    const cert = findCertification(raw);
    return {
      slug: cert?.slug ?? raw.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: cert?.name ?? raw,
      abbr: cert?.abbr,
    };
  });

  function handleWishlist() {
    if (!user) {
      // Saving is peak intent. On iOS the closet lives in the app, so prompt the
      // install; elsewhere fall back to the same web login flow the product page
      // uses, preserving the pending like.
      if (triggerAppPrompt("save")) return;
      sessionStorage.setItem("pendingLike", p.id);
      sessionStorage.setItem("pendingLikeProduct", JSON.stringify(p));
      router.push(`/login?return=/shop/${p.id}`);
      return;
    }
    toggleWishlist(p);
  }

  return (
    <div
      className={open ? "qs-scrim is-open" : "qs-scrim"}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className={open ? "qs-sheet is-open" : "qs-sheet"}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick shop: ${p.item_name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qs-sheet__bar">
          <span className="eyebrow">Quick Shop</span>
          <button
            type="button"
            className="qs-sheet__close"
            data-autofocus
            onClick={onClose}
            aria-label="Close quick shop"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>

        <div className="qs-sheet__scroll">
          <SheetGallery key={p.id} images={gallery} alt={p.item_name} />

          <div className="qs-sheet__brand">{p.brand}</div>
          <h2 className="qs-sheet__name">{p.item_name}</h2>
          {p.item_price != null && (
            <div className="qs-sheet__price">${p.item_price.toLocaleString()}</div>
          )}

          {(p.toxome_score != null || p.risk_level) && (
            <div className="qs-sheet__score">
              <span className="qs-sheet__score-label">Toxome Rating</span>
              <ScoreBadge score={p.toxome_score} level={p.risk_level} showScore />
            </div>
          )}

          {fabricEntries.length > 0 && (
            <div className="qs-sheet__block">
              <div className="eyebrow qs-sheet__block-label">Fiber composition</div>
              <div className="qs-sheet__fibers">
                {fabricEntries.map(([fiber, pct]) => {
                  const percent = pct > 1 ? pct : pct * 100;
                  return (
                    <div key={fiber} className="qs-sheet__fiber">
                      <div className="qs-sheet__fiber-row">
                        <span>{prettyFiber(fiber)}</span>
                        <span className="qs-sheet__fiber-pct">
                          {Math.round(percent)}%
                        </span>
                      </div>
                      <div className="qs-sheet__bar">
                        <div
                          className="qs-sheet__bar-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, percent))}%`,
                            background: fiberHazardColor(fiber),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {certBadges.length > 0 && (
            <div className="qs-sheet__block">
              <div className="eyebrow qs-sheet__block-label">Certifications</div>
              <div className="qs-sheet__certs">
                {certBadges.map((c) => (
                  <CertBadge
                    key={c.slug}
                    slug={c.slug}
                    name={c.name}
                    abbr={c.abbr}
                    size={44}
                  />
                ))}
              </div>
            </div>
          )}

          <Link
            href={`/shop/${p.id}`}
            className="qs-sheet__fulllink"
            onClick={onClose}
          >
            View full product details
          </Link>
        </div>

        <div className="qs-sheet__ctas">
          {outboundUrl ? (
            <a
              href={outboundUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="pill-cta qs-sheet__buy"
              onClick={() =>
                track("outbound_click", {
                  brand: p.brand,
                  productId: p.id,
                  productName: p.item_name,
                  category: p.category,
                  scoreAtTime: p.toxome_score,
                  userId: user?.uid ?? null,
                })
              }
            >
              shop at {p.brand}
            </a>
          ) : (
            <span className="pill-cta qs-sheet__buy is-disabled">unavailable</span>
          )}
          <button
            type="button"
            className="pill-cta ghost qs-sheet__wish"
            onClick={handleWishlist}
            aria-pressed={isWishlisted}
          >
            {isWishlisted ? "saved to wishlist" : "add to wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
