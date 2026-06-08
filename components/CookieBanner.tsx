"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CONSENT_KEY,
  CONSENT_EVENT,
  shouldShowConsentBanner,
} from "@/lib/consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only EU/UK visitors who haven't chosen yet see the banner. Everyone else
    // (US / rest-of-world) is tracked without a prior-consent requirement, so a
    // banner would just be noise. Region is decided in proxy.ts.
    if (shouldShowConsentBanner()) setVisible(true);
  }, []);

  function persist(choice: "accepted" | "rejected") {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // ignore
    }
    // Let the newsletter popup know the banner is resolved so it can start its
    // delay timer instead of stacking on top of this banner.
    try {
      window.dispatchEvent(new Event(CONSENT_EVENT));
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
          Essential cookies keep you signed in. With your okay, we also use a
          single first-party analytics id to understand which pages get visited.
          No ad trackers, no selling your data. Read more in our{" "}
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
