"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "toxome-cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const choice = localStorage.getItem(STORAGE_KEY);
      if (!choice) setVisible(true);
    } catch {
      // private mode / blocked storage — keep silent, don't show
    }
  }, []);

  function persist(choice: "accepted" | "rejected") {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 70,
        maxWidth: 760,
        margin: "0 auto",
        background: "var(--cream)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 16,
        padding: "18px 22px",
        boxShadow:
          "0 18px 48px -12px rgba(59,60,58,0.22), 0 4px 14px -6px rgba(59,60,58,0.12)",
        display: "flex",
        alignItems: "center",
        gap: 18,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 260 }}>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--ink)",
            margin: 0,
            letterSpacing: "-0.005em",
          }}
        >
          We use cookies to keep you signed in and to understand which pages
          you visit. No ad trackers, no selling your data. Read more in our{" "}
          <Link
            href="/privacy"
            style={{
              color: "var(--ink)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            privacy policy
          </Link>
          .
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => persist("rejected")}
          style={{
            height: 38,
            padding: "0 16px",
            borderRadius: 999,
            border: "1px solid var(--hairline-strong)",
            background: "transparent",
            color: "var(--ink-2)",
            fontFamily: "var(--sans)",
            fontSize: 13,
            letterSpacing: "-0.005em",
            cursor: "pointer",
          }}
        >
          Reject
        </button>
        <button
          onClick={() => persist("accepted")}
          style={{
            height: 38,
            padding: "0 18px",
            borderRadius: 999,
            border: "1px solid var(--ink)",
            background: "var(--ink)",
            color: "var(--white)",
            fontFamily: "var(--sans)",
            fontSize: 13,
            letterSpacing: "-0.005em",
            cursor: "pointer",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
