"use client";

import { useEffect, useState } from "react";

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
    timeoutId = setTimeout(() => {
      if (!cancelled) setVisible(true);
    }, DELAY_MS);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
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
      // Imported lazily so the ~200KB Supabase client stays out of the
      // homepage's initial JS bundle. The popup only appears after 8s and the
      // client is only needed on submit, so eager-loading it just delayed
      // hydration (and made the nav feel dead) for no benefit.
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase
        .from("newsletter_signups")
        .insert({ email: trimmed, source: "homepage_popup" });
      if (error) {
        // Duplicate email is treated as success — the user signed up before,
        // we honor that and don't pester them again.
        if (error.code === "23505") {
          persist("submitted");
          setState("success");
          return;
        }
        throw error;
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
            We&apos;ll send a quiet letter on Sundays — fiber stories, new
            scans, and the things we&apos;re unlearning.
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
            the toxome letter
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
            A Sunday letter on fibers, dyes, and the science underneath
            wellness fashion. No spam.
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
