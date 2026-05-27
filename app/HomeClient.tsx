"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ScanPreview from "@/components/ScanPreview";
import WhatWeCheck from "@/components/WhatWeCheck";
import Faq from "@/components/Faq";
import ClosingCta from "@/components/ClosingCta";
import Footer from "@/components/Footer";
import ShopClient from "@/app/shop/ShopClient";
import type { Product } from "@/types/product";

function TabBar({ active }: { active: "discover" | "shop" }) {
  return (
    <div style={{
      position: "sticky", top: 64, zIndex: 39,
      background: "rgba(231,230,222,0.88)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--hairline)",
      padding: "10px 0",
    }}>
      <div className="shell" style={{ display: "flex", gap: 8 }}>
        <a
          href="/"
          style={{
            padding: "7px 18px", borderRadius: 999, fontSize: 13.5,
            fontWeight: 500, letterSpacing: "-0.005em", textDecoration: "none",
            transition: "all 180ms cubic-bezier(.22,.61,.36,1)",
            border: active === "discover" ? "0" : "1px solid rgba(20,24,27,0.14)",
            background: active === "discover" ? "#14181B" : "transparent",
            color: active === "discover" ? "#fff" : "#3B3C3A",
          }}
        >
          Discover
        </a>
        <a
          href="/?view=shop"
          style={{
            padding: "7px 18px", borderRadius: 999, fontSize: 13.5,
            fontWeight: 500, letterSpacing: "-0.005em", textDecoration: "none",
            transition: "all 180ms cubic-bezier(.22,.61,.36,1)",
            border: active === "shop" ? "0" : "1px solid rgba(20,24,27,0.14)",
            background: active === "shop" ? "#14181B" : "transparent",
            color: active === "shop" ? "#fff" : "#3B3C3A",
          }}
        >
          Shop
        </a>
      </div>
    </div>
  );
}

function HomeInner({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const active = searchParams.get("view") === "shop" ? "shop" : "discover";

  return (
    <div style={{ background: "var(--bg)" }}>
      <Nav />
      <TabBar active={active} />
      {active === "shop" ? (
        <ShopClient products={products} />
      ) : (
        <main style={{ background: "var(--bg)" }}>
          <Hero />
          <HowItWorks />
          <ScanPreview />
          <WhatWeCheck />
          <Faq />
          <ClosingCta />
        </main>
      )}
      <Footer />
    </div>
  );
}

export default function HomeClient({ products }: { products: Product[] }) {
  return (
    <Suspense fallback={null}>
      <HomeInner products={products} />
    </Suspense>
  );
}
