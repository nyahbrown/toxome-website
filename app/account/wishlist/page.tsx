"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { WishlistItem } from "@/lib/firestore";
import { DEV_WISHLIST } from "@/lib/devAccountData";
import WishlistHeart from "@/components/WishlistHeart";

function WishlistCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: () => void;
}) {
  const shopUrl = item.affiliate_url || item.item_url;

  return (
    <div style={{ position: "relative" }}>
      <a
        href={shopUrl || "#"}
        target={shopUrl ? "_blank" : undefined}
        rel={shopUrl ? "noopener noreferrer sponsored" : undefined}
        style={{ textDecoration: "none", display: "block" }}
      >
        <div
          style={{
            background: "var(--white)",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(59,60,58,.06)",
          }}
        >
          {/* Image */}
          <div
            style={{
              position: "relative",
              paddingBottom: "100%",
              background: "var(--tan)",
              overflow: "hidden",
            }}
          >
            {item.item_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.item_image}
                alt={item.item_name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--tan)",
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
            )}
            {item.brand_verified && (
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: "var(--ink)",
                  color: "var(--white)",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                Featured
              </span>
            )}
            <WishlistHeart
              isWishlisted
              onClick={onRemove}
              stopPropagation
            />
          </div>

          {/* Info */}
          <div style={{ padding: "14px 16px 18px" }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 5,
              }}
            >
              {item.brand}
            </div>
            <div
              style={{
                fontSize: 14.5,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                marginBottom: 6,
              }}
            >
              {item.item_name}
            </div>
            {item.item_price != null && (
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
                ${item.item_price.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}

export default function WishlistPage() {
  const { user, loading, wishlistItems, toggleWishlist } = useAuth();
  const router = useRouter();

  // Dev preview (?dev=1) bypasses auth and shows the mock saved items.
  const [devMode, setDevMode] = useState(false);
  const [devChecked, setDevChecked] = useState(false);
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("dev");
    setDevMode(d === "1" || d === "premium");
    setDevChecked(true);
  }, []);

  useEffect(() => {
    if (devChecked && !devMode && !loading && !user) {
      router.replace("/login?return=/account/wishlist");
    }
  }, [devChecked, devMode, user, loading, router]);

  if (!devChecked) return null;
  if (!devMode && (loading || !user)) return null;

  const items = devMode ? DEV_WISHLIST : wishlistItems;

  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingTop: 64,
        paddingBottom: 120,
      }}
    >
      <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 44 }}>
        <h1
          style={{
            fontFamily: "var(--sans)",
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            margin: "0 auto",
            maxWidth: 780,
            padding: "0 24px",
          }}
        >
          saved items
        </h1>
      </div>

      <div className="shell">
        {items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "var(--ink-3)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            nothing saved yet.{" "}
            <Link
              href="/shop"
              style={{
                color: "var(--ink-2)",
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              browse the shop
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((item) => (
              <WishlistCard
                key={item.productId}
                item={item}
                onRemove={() => {
                  if (devMode) return;
                  // Build a minimal Product-shaped object for toggleWishlist
                  toggleWishlist({
                    id: item.productId,
                    item_name: item.item_name,
                    brand: item.brand,
                    item_price: item.item_price,
                    item_image: item.item_image,
                    affiliate_url: item.affiliate_url,
                    item_url: item.item_url,
                    brand_verified: item.brand_verified,
                    // required Product fields with defaults
                    currency: "",
                    budget: null,
                    category: null,
                    gender: null,
                    region: null,
                    affiliate_program: null,
                    commission_rate: null,
                    toxome_score: null,
                    risk_level: null,
                    fabric_composition: null,
                    tags: null,
                    added_by: "",
                    published: true,
                    created_at: "",
                    updated_at: "",
                    images: null,
                    description: null,
                    materials_text: null,
                    certifications: null,
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
