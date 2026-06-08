"use client";

import { useEffect, useState } from "react";
import ConsentNote from "./ConsentNote";
import { CONSENT_KEY, CONSENT_EVENT, consentResolved } from "@/lib/consent";

const STORAGE_KEY = "toxome-newsletter-popup";
const DELAY_MS = 8000;

type State = "idle" | "submitting" | "success" | "error";

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const past = localStorage.getItem(STORAGE_KEY);
      if (past) return; // already dismissed or submitted
    } catch {
      // ignore storage errors
    }

    function scheduleShow() {
      if (cancelled || timeoutId) return;
      timeoutId = setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, DELAY_MS);
    }

    // Don't surface the popup while the cookie banner is still up — the two
    // live in the same bottom-corner space and would overlap. For EU/UK
    // visitors that means waiting until they've accepted/rejected; non-EU
    // visitors get no banner, so consentResolved() is already true for them.
    if (consentResolved()) {
      scheduleShow();
      return () => {
        cancelled = true;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    const onConsent = () => scheduleShow();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY && e.newValue) scheduleShow();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener(CONSENT_EVENT, onConsent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function persist(reason: "submitted" | "dismissed") {
    try {
      localStorage.setItem(STORAGE_KEY, reason);
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "submitting") return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setState("submitting");
    setErrorMessage("");
    try {
      // Posts to /api/newsletter, which captures to Supabase AND syncs to
      // beehiiv server-side. Going through the API also keeps the ~200KB
      // Supabase client out of the homepage bundle entirely.
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "homepage_popup" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong.");
      }
      persist("submitted");
      setState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setState("error");
    }
  }

  function close() {
    persist("dismissed");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Newsletter signup"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 65,
        width: "min(380px, calc(100vw - 32px))",
        background: "var(--white)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 16,
        padding: 22,
        boxShadow:
          "0 18px 48px -12px rgba(59,60,58,0.22), 0 4px 14px -6px rgba(59,60,58,0.12)",
        animation: "newsletterFadeIn 280ms cubic-bezier(.22,.61,.36,1)",
      }}
    >
      <button
        onClick={close}
        aria-label="Dismiss newsletter signup"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 26,
          height: 26,
          border: "none",
          background: "transparent",
          color: "var(--ink-3)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>

      {state === "success" ? (
        <>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              margin: "0 0 10px",
            }}
          >
            you&apos;re in
          </p>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 22,
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
              margin: "0 0 6px",
              fontWeight: 500,
            }}
          >
            Welcome to Toxome.
          </p>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--ink-2)",
              margin: 0,
            }}
          >
            Our weekly report on the state of fashion wellness, in your
            inbox. Fiber stories, new scans, and the things we&apos;re
            unlearning.
          </p>
        </>
      ) : (
        <>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              margin: "0 0 10px",
            }}
          >
            the weekly report
          </p>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 22,
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
              margin: "0 0 6px",
              fontWeight: 500,
            }}
          >
            What&apos;s actually in your clothes.
          </p>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--ink-2)",
              margin: "0 0 14px",
            }}
          >
            Our weekly report on the state of fashion wellness: fibers,
            dyes, and the science underneath what you wear. No spam.
          </p>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <input
              type="email"
              required
              placeholder="email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={{
                width: "100%",
                height: 40,
                padding: "0 14px",
                border: "1px solid var(--hairline-strong)",
                borderRadius: 999,
                background: "var(--cream)",
                color: "var(--ink)",
                fontFamily: "var(--sans)",
                fontSize: 14,
                outline: "none",
                letterSpacing: "-0.005em",
              }}
            />
            <button
              type="submit"
              disabled={state === "submitting"}
              style={{
                height: 40,
                borderRadius: 999,
                border: "1px solid var(--ink)",
                background: "var(--ink)",
                color: "var(--white)",
                fontFamily: "var(--sans)",
                fontSize: 14,
                letterSpacing: "-0.005em",
                cursor: state === "submitting" ? "not-allowed" : "pointer",
                opacity: state === "submitting" ? 0.6 : 1,
              }}
            >
              {state === "submitting" ? "..." : "Subscribe"}
            </button>
            {state === "error" && errorMessage && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--red)",
                  margin: "4px 0 0",
                }}
              >
                {errorMessage}
              </p>
            )}
            <ConsentNote
              lead='By clicking "subscribe," you agree to receive emails from Toxome and accept our'
              align="left"
              style={{ marginTop: 12 }}
            />
          </form>
        </>
      )}

      <style jsx>{`
        @keyframes newsletterFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
