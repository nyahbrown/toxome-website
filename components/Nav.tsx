"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const APP_STORE_URL = "https://apps.apple.com/us/app/toxome/id6748622034";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(231,230,222,0.78)",
      backdropFilter: "blur(20px) saturate(160%)",
      WebkitBackdropFilter: "blur(20px) saturate(160%)",
      borderBottom: "1px solid var(--hairline)",
    }}>
      <div className="shell" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/toxome-logo.png" alt="" width={40} height={26} style={{ display: "block" }} />
          <span style={{ fontFamily: "var(--sans)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>
            Toxome
          </span>
        </div>

        {/* Desktop links */}
        <div style={{ display: "flex", alignItems: "center", gap: 36, fontSize: 14, color: "var(--ink-2)" }}
          className="hidden md:flex">
          <a href="#how" style={{ fontWeight: 500 }}>How it works</a>
          <a href="#what" style={{ fontWeight: 500 }}>What we check</a>
          <Link href="/shop" style={{ fontWeight: 500 }}>Shop</Link>
          <Link href="/blog" style={{ fontWeight: 500 }}>Blog</Link>
        </div>

        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"
          className="pill-cta hidden md:inline-flex"
          style={{ height: 40, padding: "8px 18px", fontSize: 14 }}>
          Get the app
        </a>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="Menu">
          <div style={{ width: 20, height: 1.5, background: "var(--ink)", transition: "all .2s", transform: open ? "rotate(45deg) translate(0,5px)" : "none" }} />
          <div style={{ width: 20, height: 1.5, background: "var(--ink)", margin: "4px 0", opacity: open ? 0 : 1, transition: "all .2s" }} />
          <div style={{ width: 20, height: 1.5, background: "var(--ink)", transition: "all .2s", transform: open ? "rotate(-45deg) translate(0,-5px)" : "none" }} />
        </button>
      </div>

      {open && (
        <div style={{ background: "rgba(231,230,222,0.97)", borderTop: "1px solid var(--hairline)", padding: "16px 20px 20px" }}
          className="md:hidden flex flex-col gap-4 text-sm">
          <a href="#how" onClick={() => setOpen(false)} style={{ fontWeight: 500, color: "var(--ink-2)" }}>How it works</a>
          <a href="#what" onClick={() => setOpen(false)} style={{ fontWeight: 500, color: "var(--ink-2)" }}>What we check</a>
          <Link href="/shop" onClick={() => setOpen(false)} style={{ fontWeight: 500, color: "var(--ink-2)" }}>Shop</Link>
          <Link href="/blog" onClick={() => setOpen(false)} style={{ fontWeight: 500, color: "var(--ink-2)" }}>Blog</Link>
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"
            className="pill-cta" style={{ justifyContent: "center", marginTop: 4 }}>
            Get the app
          </a>
        </div>
      )}
    </nav>
  );
}
