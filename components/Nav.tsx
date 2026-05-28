"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NavDropdown from "./NavDropdown";

const SHOP_CATEGORIES = [
  "Outerwear",
  "Tops",
  "Bottoms",
  "Pajamas",
  "Activewear",
  "Undergarments",
];

const JOURNAL_TOPICS = [
  { label: "Fibers", topic: "fibers" },
  { label: "Toxicology", topic: "toxicology" },
  { label: "Wellness", topic: "wellness" },
  { label: "Style", topic: "style" },
];

function buildShopColumns() {
  const make = (gender: "men" | "women") => ({
    heading: gender === "men" ? "Men" : "Women",
    items: [
      {
        label: `All ${gender === "men" ? "Men" : "Women"}`,
        href: `/shop?gender=${gender}`,
        muted: true,
      },
      ...SHOP_CATEGORIES.map((c) => ({
        label: c,
        href: `/shop?gender=${gender}&category=${encodeURIComponent(c)}`,
      })),
    ],
  });
  return [make("women"), make("men")];
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

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;
  const { user, wishlist } = useAuth();
  const wishlistCount = wishlist.size;

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
        borderBottom: transparent ? "none" : "1px solid var(--hairline)",
        transition: "background 300ms ease, border-color 300ms ease",
      }}
    >
      <div
        className="shell"
        style={{
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
              columns={buildShopColumns()}
            />
            <NavDropdown
              label="journal"
              href="/journal"
              transparent={transparent}
              active={pathname === "/journal" || pathname.startsWith("/journal/")}
              columns={buildJournalColumns()}
              panelWidth={240}
            />
          </div>
        </div>

        {/* Account */}
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
          {user && wishlistCount > 0 ? `wishlist (${wishlistCount})` : "account"}
        </Link>
      </div>
    </nav>
  );
}
