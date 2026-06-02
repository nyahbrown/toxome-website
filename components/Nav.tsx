"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavDropdown from "./NavDropdown";
import type { ShopTaxonomy } from "@/lib/supabase";

const MOBILE_LINKS = [
  { label: "shop", href: "/shop" },
  { label: "guide", href: "/guide" },
  { label: "journal", href: "/journal" },
  { label: "account", href: "/account" },
];

const FALLBACK_TAXONOMY: ShopTaxonomy = {
  women: ["Activewear", "Bottoms", "Outerwear", "Tops"],
  men: ["Activewear", "Bottoms", "Outerwear", "Tops"],
  home: ["Other"],
};

function buildShopColumns(taxonomy: ShopTaxonomy) {
  const makeGendered = (label: "Men" | "Women", categories: string[]) => {
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
  const home = {
    heading: "Home",
    items: [{ label: "All Home", href: "/shop/home", muted: true }],
  };
  return [
    makeGendered("Women", taxonomy.women),
    makeGendered("Men", taxonomy.men),
    home,
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
  const isHome = pathname === "/";
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

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
            <Link
              href="/guide"
              style={{
                fontSize: 14,
                fontWeight: 400,
                letterSpacing: "-0.005em",
                color: transparent
                  ? "rgba(255,255,255,0.92)"
                  : pathname === "/guide" || pathname.startsWith("/guide/")
                  ? "var(--ink)"
                  : "var(--ink-2)",
                textDecoration:
                  !transparent &&
                  (pathname === "/guide" || pathname.startsWith("/guide/"))
                    ? "underline"
                    : "none",
                textUnderlineOffset: 5,
                textDecorationThickness: 1,
                transition: "color 300ms ease",
                padding: "8px 0",
              }}
            >
              guide
            </Link>
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
          {/* Hidden on phones via CSS (.nav-desktop-only) — pure CSS so it
              never depends on hydration. iOS shows the App Store smart banner. */}
          <span className="nav-desktop-only" style={{ display: "inline-flex" }}>
            <NavSearch transparent={transparent} />
          </span>
          <a
            className="nav-desktop-only"
            href="https://apps.apple.com/us/app/toxome/id6748622034"
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: "inline-flex",
                alignItems: "center",
                height: 32,
                padding: "0 16px",
                borderRadius: 999,
                background: transparent
                  ? "rgba(255,255,255,0.14)"
                  : "var(--ink)",
                border: transparent
                  ? "1px solid rgba(255,255,255,0.32)"
                  : "1px solid var(--ink)",
                color: transparent
                  ? "rgba(255,255,255,0.96)"
                  : "var(--white)",
                fontSize: 13,
                letterSpacing: "-0.005em",
                textDecoration: "none",
                transition:
                  "background 200ms ease, border-color 200ms ease, color 200ms ease",
                whiteSpace: "nowrap",
              }}
            >
              download app
            </a>
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
          {/* Hamburger — phones only. Toggles the full-width mobile menu. */}
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

      {/* Mobile menu — full-width cream panel under the bar, phones only. */}
      {menuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--cream)",
            display: "flex",
            flexDirection: "column",
            padding: "16px 20px 40px",
            overflowY: "auto",
          }}
        >
          {MOBILE_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: active ? "var(--ink)" : "var(--ink-2)",
                  textDecoration: "none",
                  padding: "18px 0",
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href="https://apps.apple.com/us/app/toxome/id6748622034"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 50,
              marginTop: 24,
              borderRadius: 999,
              background: "var(--ink)",
              color: "var(--white)",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-0.005em",
              textDecoration: "none",
            }}
          >
            download app
          </a>
        </div>
      )}
    </nav>
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
