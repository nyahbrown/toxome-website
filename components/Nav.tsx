"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavDropdown from "./NavDropdown";
import type { ShopTaxonomy } from "@/lib/supabase";
import { KIDS_AGE_BANDS } from "@/lib/kidsSizes";

const FALLBACK_TAXONOMY: ShopTaxonomy = {
  women: ["Activewear", "Bottoms", "Outerwear", "Tops"],
  men: ["Activewear", "Bottoms", "Outerwear", "Tops"],
  kids: ["Bodysuits & Onesies", "Tops", "Bottoms", "Sleepwear"],
  home: ["Bedding", "Throws & Blankets", "Bath", "Rugs"],
};

function buildShopColumns(taxonomy: ShopTaxonomy) {
  const makeDept = (
    label: "Men" | "Women" | "Kids" | "Home",
    categories: string[]
  ) => {
    const slug = label.toLowerCase();
    return {
      heading: label,
      items: [
        { label: `All ${label}`, href: `/shop/${slug}`, muted: true },
        ...categories.map((c) => ({
          label: c,
          href: `/shop/${slug}?category=${encodeURIComponent(c)}`,
        })),
      ],
    };
  };
  // Kids is browsed by age, not garment type. The column shows the four age
  // bands (Newborn / Baby / Toddler / Kids) from KIDS_AGE_BANDS; garment
  // categories are refined on the /shop/kids page itself.
  const kidsCol = {
    heading: "Kids",
    items: [
      { label: "All Kids", href: "/shop/kids", muted: true },
      ...KIDS_AGE_BANDS.map((b) => ({
        label: b.label,
        href: `/shop/kids?age=${b.value}`,
      })),
    ],
  };
  // Lead the Shop menu with a "by fiber" entry point: the natural-fiber hub and
  // the collections index. Matches how people shop (by material) and mirrors the
  // fiber guide.
  const byFiberCol = {
    heading: "By fiber",
    items: [
      { label: "Shop by fiber", href: "/shop/fibers" },
      { label: "Collections", href: "/shop/collections", muted: true },
    ],
  };
  // Mattresses is the one Home category sold as editorial rather than catalog.
  // A mattress has no fiber score, so the roundup and its certification scopes
  // ARE the storefront, and taxonomy.home only lists categories that have
  // published products. Pinning the link keeps the category in the menu without
  // pointing shoppers at an empty grid. The moment mattress rows go live the
  // taxonomy supplies the real category and this drops out on its own.
  const homeCol = (() => {
    const base = makeDept("Home", taxonomy.home);
    if (taxonomy.home.includes("Mattresses")) return base;
    return {
      ...base,
      items: [
        ...base.items,
        { label: "Mattresses", href: "/journal/best-non-toxic-mattresses" },
      ],
    };
  })();
  return [
    byFiberCol,
    makeDept("Women", taxonomy.women),
    makeDept("Men", taxonomy.men),
    kidsCol,
    homeCol,
  ];
}

export default function Nav({
  taxonomy = FALLBACK_TAXONOMY,
}: {
  taxonomy?: ShopTaxonomy;
} = {}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const isHome = pathname === "/";
  const shopColumns = buildShopColumns(taxonomy);
  // The bar reads as transparent only on the homepage hero before scroll AND
  // while the mobile menu is closed (open menu = cream surface behind it).
  const transparent = isHome && !scrolled && !menuOpen;
  const hamburgerColor =
    isHome && !scrolled && !menuOpen ? "rgba(255,255,255,0.95)" : "var(--ink)";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu (and any expanded shop section) on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setShopOpen(false);
    setGuideOpen(false);
  }, [pathname]);

  // Collapse expandable sections whenever the drawer closes, so it reopens tidy.
  useEffect(() => {
    if (!menuOpen) {
      setShopOpen(false);
      setGuideOpen(false);
    }
  }, [menuOpen]);

  // Lock body scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: transparent
          ? "transparent"
          : "rgba(252,251,247,0.92)",
        backdropFilter: transparent ? "none" : "blur(20px) saturate(160%)",
        WebkitBackdropFilter: transparent ? "none" : "blur(20px) saturate(160%)",
        borderBottom: "none",
        transition: "background 300ms ease",
      }}
    >
      <div
        style={{
          maxWidth: "none",
          margin: 0,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo + links */}
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <Link
            href="/"
            aria-label="Toxome home"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Image
              src="/toxome-logo.png"
              alt=""
              width={61}
              height={40}
              priority
              style={{ display: "block" }}
            />
            <span
              style={{
                fontFamily: "var(--sans)",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                textTransform: "none",
                color: transparent ? "rgba(255,255,255,0.95)" : "var(--ink)",
                transition: "color 300ms ease",
              }}
            >
              Toxome
            </span>
          </Link>
          <div
            className="nav-links-inline"
            style={{ display: "flex", gap: 28, alignItems: "center" }}
          >
            <NavDropdown
              label="shop"
              href="/shop"
              transparent={transparent}
              active={pathname === "/shop" || pathname.startsWith("/shop/")}
              columns={buildShopColumns(taxonomy)}
              topRow={{ label: "Shop all", href: "/shop", muted: true }}
            />
            <NavDropdown
              label="guide"
              href="/guide"
              transparent={transparent}
              active={pathname === "/guide" || pathname.startsWith("/guide/")}
              columns={[
                {
                  heading: "Guide",
                  items: [
                    { label: "Fabrics", href: "/guide" },
                    { label: "Certifications", href: "/guide/certifications" },
                    { label: "How we score", href: "/methodology" },
                  ],
                },
              ]}
            />
            <Link
              href="/journal"
              style={{
                fontSize: 14,
                fontWeight: 400,
                letterSpacing: "-0.005em",
                color: transparent
                  ? "rgba(255,255,255,0.92)"
                  : pathname === "/journal" || pathname.startsWith("/journal/")
                  ? "var(--ink)"
                  : "var(--ink-2)",
                textDecoration:
                  !transparent &&
                  (pathname === "/journal" || pathname.startsWith("/journal/"))
                    ? "underline"
                    : "none",
                textUnderlineOffset: 5,
                textDecorationThickness: 1,
                transition: "color 300ms ease",
                padding: "8px 0",
              }}
            >
              journal
            </Link>
          </div>
        </div>

        {/* Search + Download app + Account */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Hidden on phones via CSS (.nav-desktop-only), pure CSS so it
              never depends on hydration. iOS shows the App Store smart banner. */}
          <span className="nav-desktop-only" style={{ display: "inline-flex" }}>
            <NavSearch transparent={transparent} />
          </span>
          {/* Secondary text link — the app is now a secondary feature, so this
              is toned down from the old filled pill to match the other nav
              items (shop + newsletter lead). */}
          <Link
            className="nav-desktop-only"
            href="/app"
            style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: 14,
                fontWeight: 400,
                letterSpacing: "-0.005em",
                color: transparent
                  ? "rgba(255,255,255,0.92)"
                  : "var(--ink-2)",
                textDecoration: "none",
                transition: "color 300ms ease",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              download app
              <svg
                width="12"
                height="12"
                viewBox="0 0 384 512"
                fill="currentColor"
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: -1 }}
              >
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
            </Link>
          <Link
            href="/account"
            className="nav-desktop-only"
            style={{
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: "-0.005em",
              color: transparent ? "rgba(255,255,255,0.92)" : "var(--ink-2)",
              textDecoration: "none",
              transition: "color 300ms ease",
            }}
          >
            account
          </Link>
          {/* Hamburger, phones only. Toggles the full-width mobile menu. */}
          <button
            type="button"
            className="nav-mobile-only"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              margin: "0 -8px 0 0",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: hamburgerColor,
              transition: "color 300ms ease",
            }}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6.5h18M3 12h18M3 17.5h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>

      {/* Mobile menu, full-bleed drawer with a dimmed backdrop, phones only.
          Rendered OUTSIDE <nav> on purpose: the nav's backdrop-filter would
          otherwise become the containing block for these fixed elements and
          clip the sheet to the 64px bar height. */}
      {menuOpen && (
        <>
          <div
            className="nav-sheet-backdrop"
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(59,60,58,0.38)",
            }}
          />
          <aside
            className="nav-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(100vw, 400px)",
              background: "var(--cream)",
              boxShadow: "-16px 0 48px -16px rgba(59,60,58,0.28)",
              display: "flex",
              flexDirection: "column",
              padding: "12px 28px 32px",
              overflowY: "auto",
            }}
          >
            {/* Close */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                height: 52,
                alignItems: "center",
              }}
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  margin: "0 -8px 0 0",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <form
              action="/shop"
              method="GET"
              role="search"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 44,
                padding: "0 14px",
                borderRadius: 999,
                border: "1px solid rgba(59,60,58,0.18)",
                marginBottom: 22,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: "var(--ink-3)" }}>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                name="q"
                placeholder="search"
                aria-label="Search products"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "var(--sans)",
                  fontSize: 15,
                  letterSpacing: "-0.005em",
                  color: "var(--ink)",
                  padding: 0,
                }}
              />
            </form>

            {/* Primary links */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* shop, expandable */}
              <button
                type="button"
                aria-expanded={shopOpen}
                onClick={() => setShopOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "13px 0",
                  fontFamily: "var(--sans)",
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color:
                    pathname === "/shop" || pathname.startsWith("/shop/")
                      ? "var(--ink)"
                      : "var(--ink-2)",
                  textTransform: "lowercase",
                }}
              >
                shop
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                  style={{
                    color: "var(--ink-3)",
                    transform: shopOpen ? "rotate(180deg)" : "none",
                    transition: "transform 240ms var(--ease-out-strong)",
                  }}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {shopOpen && (
                <div className="nav-sheet-sub" style={{ paddingBottom: 8 }}>
                  <Link
                    href="/shop"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      color: "var(--ink)",
                      textDecoration: "none",
                      padding: "8px 0",
                    }}
                  >
                    shop all
                  </Link>
                  {shopColumns.map((col) => (
                    <div key={col.heading} style={{ marginTop: 14 }}>
                      <div className="eyebrow" style={{ marginBottom: 8, color: "var(--ink-3)" }}>
                        {col.heading}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {col.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            style={{
                              fontSize: 16,
                              letterSpacing: "-0.005em",
                              color: "var(--ink-2)",
                              textDecoration: "none",
                              padding: "7px 0",
                            }}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* guide, expandable — mirrors the shop accordion so both
                  primary groups share one interaction model. */}
              <button
                type="button"
                aria-expanded={guideOpen}
                onClick={() => setGuideOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "13px 0",
                  fontFamily: "var(--sans)",
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color:
                    pathname === "/guide" ||
                    pathname.startsWith("/guide/") ||
                    pathname === "/methodology"
                      ? "var(--ink)"
                      : "var(--ink-2)",
                  textTransform: "lowercase",
                }}
              >
                guide
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                  style={{
                    color: "var(--ink-3)",
                    transform: guideOpen ? "rotate(180deg)" : "none",
                    transition: "transform 240ms var(--ease-out-strong)",
                  }}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {guideOpen && (
                <div className="nav-sheet-sub" style={{ paddingBottom: 8 }}>
                  {[
                    { label: "fabrics", href: "/guide" },
                    { label: "certifications", href: "/guide/certifications" },
                    { label: "how we score", href: "/methodology" },
                  ].map((link) => {
                    const active =
                      pathname === link.href ||
                      (link.href !== "/guide" &&
                        pathname.startsWith(`${link.href}/`));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "block",
                          fontSize: 16,
                          letterSpacing: "-0.005em",
                          color: active ? "var(--ink)" : "var(--ink-2)",
                          textDecoration: "none",
                          padding: "7px 0",
                        }}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* journal */}
              <Link
                href="/journal"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color:
                    pathname === "/journal" || pathname.startsWith("/journal/")
                      ? "var(--ink)"
                      : "var(--ink-2)",
                  textDecoration: "none",
                  padding: "13px 0",
                }}
              >
                journal
              </Link>
            </div>

            {/* Utility — secondary group. Flows just below the primary nav
                with generous top spacing (no divider line, per house rules),
                rather than bottom-pinned, which left a dead void on tall phones. */}
            <div style={{ marginTop: 28 }}>
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  fontFamily: "var(--sans)",
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  color: "var(--ink-2)",
                  textDecoration: "none",
                  padding: "10px 0 18px",
                }}
              >
                account
              </Link>
              <Link
                href="/app"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: 15,
                  fontWeight: 400,
                  letterSpacing: "-0.005em",
                  color: "var(--ink-2)",
                  textDecoration: "none",
                  padding: "10px 0 18px",
                  gap: 7,
                }}
              >
                download app
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 384 512"
                  fill="currentColor"
                  aria-hidden="true"
                  style={{ flexShrink: 0, marginTop: -1 }}
                >
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function NavSearch({ transparent }: { transparent: boolean }) {
  const [focused, setFocused] = useState(false);
  const placeholderColor = transparent
    ? "rgba(255,255,255,0.7)"
    : "var(--ink-3)";
  const textColor = transparent ? "rgba(255,255,255,0.95)" : "var(--ink)";
  const borderColor = transparent
    ? focused
      ? "rgba(255,255,255,0.55)"
      : "rgba(255,255,255,0.32)"
    : focused
    ? "var(--hairline-strong)"
    : "rgba(59,60,58,0.18)";

  return (
    <form
      action="/shop"
      method="GET"
      role="search"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 32,
        padding: "0 12px",
        borderRadius: 999,
        border: `1px solid ${borderColor}`,
        background: "transparent",
        transition: "border-color 200ms ease",
        minWidth: 0,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0, color: placeholderColor }}
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M11 11L14 14"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        name="q"
        placeholder="Search"
        aria-label="Search products"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          fontFamily: "var(--sans)",
          fontSize: 13,
          letterSpacing: "-0.005em",
          color: textColor,
          width: 160,
          padding: 0,
        }}
      />
      <style jsx>{`
        input::placeholder {
          color: ${placeholderColor};
        }
        input::-webkit-search-cancel-button {
          -webkit-appearance: none;
          appearance: none;
        }
      `}</style>
    </form>
  );
}
