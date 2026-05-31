"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavDropdown from "./NavDropdown";
import type { ShopTaxonomy } from "@/lib/supabase";

const FALLBACK_TAXONOMY: ShopTaxonomy = {
  women: ["Activewear", "Bottoms", "Outerwear", "Tops"],
  men: ["Activewear", "Bottoms", "Outerwear", "Tops"],
  home: ["Other"],
};

const JOURNAL_TOPICS = [
  { label: "Fibers", topic: "fibers" },
  { label: "Toxicology", topic: "toxicology" },
  { label: "Wellness", topic: "wellness" },
  { label: "Style", topic: "style" },
];

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

function buildJournalColumns() {
  return [
    {
      heading: "Read",
      items: [
        { label: "All articles", href: "/journal", muted: true },
        ...JOURNAL_TOPICS.map((t) => ({
          label: t.label,
          href: `/journal?topic=${t.topic}`,
        })),
      ],
    },
  ];
}

export default function Nav({
  taxonomy = FALLBACK_TAXONOMY,
}: {
  taxonomy?: ShopTaxonomy;
} = {}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/" aria-label="Toxome home">
            <Image
              src="/toxome-logo.png"
              alt=""
              width={64}
              height={42}
              priority
              style={{ display: "block" }}
            />
          </Link>
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <NavDropdown
              label="shop"
              href="/shop"
              transparent={transparent}
              active={pathname === "/shop" || pathname.startsWith("/shop/")}
              columns={buildShopColumns(taxonomy)}
              topRow={{ label: "Shop all", href: "/shop", muted: true }}
            />
            <NavDropdown
              label="journal"
              href="/journal"
              transparent={transparent}
              active={pathname === "/journal" || pathname.startsWith("/journal/")}
              columns={buildJournalColumns()}
              panelWidth={240}
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
        </div>
      </div>
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
