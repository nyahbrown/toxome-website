"use client";

import { useState } from "react";
import Link from "next/link";

// Coming-soon email capture for the Chrome extension. Reuses the same
// /api/newsletter endpoint (Supabase + beehiiv) with its own source tag so the
// waitlist is segmentable. When the extension ships, swap this for the real
// "Add to Chrome" button (see CHROME_STORE_URL in app/extension/page.tsx).
export default function ExtensionWaitlist() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "submitting") return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setState("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "extension_waitlist" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong.");
      }
      setState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--ink-2)",
          margin: "0 auto",
          maxWidth: 460,
        }}
      >
        You&apos;re on the list. We&apos;ll email you the moment it goes live.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 460, margin: "0 auto" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          height: 52,
          paddingRight: 5,
          borderRadius: 999,
          border: "1px solid var(--hairline-strong)",
          background: "var(--white)",
        }}
      >
        <input
          type="email"
          required
          placeholder="email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            padding: "0 8px 0 20px",
            border: "none",
            borderRadius: 999,
            background: "transparent",
            color: "var(--ink)",
            fontFamily: "var(--sans)",
            fontSize: 15,
            outline: "none",
            letterSpacing: "-0.005em",
          }}
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          style={{
            height: 42,
            flex: "0 0 auto",
            padding: "0 22px",
            borderRadius: 999,
            border: "none",
            background: "var(--ink)",
            color: "var(--cream)",
            fontFamily: "var(--sans)",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
            cursor: state === "submitting" ? "not-allowed" : "pointer",
            opacity: state === "submitting" ? 0.6 : 1,
          }}
        >
          {state === "submitting" ? "..." : "Notify me"}
        </button>
      </form>
      {state === "error" && errorMessage && (
        <p style={{ fontSize: 12, color: "var(--red)", margin: "10px 0 0" }}>
          {errorMessage}
        </p>
      )}
      <p
        style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--ink-3)",
          margin: "14px auto 0",
          maxWidth: 420,
        }}
      >
        One email when it launches. No spam. See our{" "}
        <Link
          href="/privacy"
          style={{ color: "var(--ink-2)", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
