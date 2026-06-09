"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AdminTabs from "@/components/admin/AdminTabs";
import ContentBoard from "@/components/admin/ContentBoard";

// Content approval dashboard. Auth mirrors the products + analytics pages: the
// Firebase session is shared, so signing in on /admin carries over here. Anyone
// not the admin is pointed back to /admin to sign in.
const ADMIN_EMAIL = "nyah@toxome.app";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        background: "var(--cream)",
        minHeight: "100vh",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {children}
    </main>
  );
}

export default function AdminContentPage() {
  const { user, loading, signOut } = useAuth();
  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  const token = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    return user.getIdToken();
  }, [user]);

  if (loading) {
    return (
      <Centered>
        <span style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-3)" }}>
          Loading…
        </span>
      </Centered>
    );
  }

  if (!isAdmin) {
    return (
      <Centered>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: 10,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginBottom: 8,
            }}
          >
            Toxome Admin
          </div>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontSize: 28,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
            }}
          >
            {user ? "Access denied" : "Sign in"}
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              color: "var(--ink-2)",
              margin: "0 0 20px",
            }}
          >
            {user
              ? `Signed in as ${user.email}. This dashboard is private.`
              : "Sign in on the Admin page to review content."}
          </p>
          <Link
            href="/admin"
            style={{
              display: "inline-block",
              fontFamily: "var(--sans)",
              fontSize: 13,
              padding: "9px 18px",
              borderRadius: 999,
              border: "1px solid var(--ink)",
              background: "var(--ink)",
              color: "var(--white)",
              textDecoration: "none",
            }}
          >
            Go to Admin
          </Link>
        </div>
      </Centered>
    );
  }

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", color: "var(--ink)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          background: "var(--cream)",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.025em" }}>
            Toxome
          </span>
          <span
            style={{
              fontFamily: "var(--sans)",
              fontSize: 10,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            Admin
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>
            {user.email}
          </span>
          <button
            onClick={() => signOut()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--ink-2)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px 80px" }}>
        <AdminTabs active="content" />
        <ContentBoard getToken={token} />
      </div>
    </main>
  );
}
