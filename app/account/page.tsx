"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/shop");
  }

  if (loading || !user) return null;

  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        paddingTop: 64,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "64px 24px 80px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 16,
          }}
        >
          account
        </div>

        <h1
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            margin: "0 0 40px",
            wordBreak: "break-all",
          }}
        >
          {user.email}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link
            href="/account/wishlist"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--hairline-strong)",
              borderRadius: 8,
              padding: "16px 20px",
              background: "var(--white)",
              color: "var(--ink)",
              fontFamily: "var(--sans)",
              fontSize: 14,
              letterSpacing: "-0.005em",
              textDecoration: "none",
            }}
          >
            saved items
            <span style={{ color: "var(--ink-3)" }}>→</span>
          </Link>

          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              border: "1px solid var(--hairline-strong)",
              borderRadius: 999,
              padding: "12px 24px",
              background: "transparent",
              color: "var(--ink-3)",
              fontFamily: "var(--sans)",
              fontSize: 14,
              letterSpacing: "-0.005em",
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            sign out
          </button>
        </div>
      </div>
    </main>
  );
}
