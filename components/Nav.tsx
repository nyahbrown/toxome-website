"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { href: "/shop", label: "shop" },
  { href: "/journal", label: "journal" },
];

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
          <div style={{ display: "flex", gap: 28 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    letterSpacing: "-0.005em",
                    color: transparent
                      ? "rgba(255,255,255,0.92)"
                      : active
                      ? "var(--ink)"
                      : "var(--ink-2)",
                    textDecoration: !transparent && active ? "underline" : "none",
                    textUnderlineOffset: 5,
                    textDecorationThickness: 1,
                    transition: "color 300ms ease",
                  }}
                >
                  {label}
                </Link>
              );
            })}
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
