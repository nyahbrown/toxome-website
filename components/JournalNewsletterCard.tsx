"use client";

import { useState } from "react";
import ConsentNote from "./ConsentNote";

// End-of-article newsletter capture. Sits above ArticleCta so the editorial
// app/shop CTA still closes the page. Source tag "journal_article" lets us
// measure conversion from the inline card separately from the timed popup.
type State = "idle" | "submitting" | "success" | "error";

export default function JournalNewsletterCard() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
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
        body: JSON.stringify({ email: trimmed, source: "journal_article" }),
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

  return (
    <aside className="article-cta" style={{ margin: "48px 0 20px" }}>
      {state === "success" ? (
        <>
          <p className="article-cta__eyebrow">you&apos;re in.</p>
          <p className="article-cta__headline">Welcome to Toxome.</p>
          <p className="article-cta__body">
            The newsletter is on its way. Fiber, dyes, and what your clothes
            do to your body.
          </p>
        </>
      ) : (
        <>
          <p className="article-cta__eyebrow">the newsletter</p>
          <p className="article-cta__headline">
            know what&apos;s in your clothes.
          </p>
          <p className="article-cta__body">
            Weekly notes on fiber, dyes, and what your clothes do to your
            body.
          </p>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 340,
              margin: "0 auto",
            }}
          >
            <label
              htmlFor="jnl-email"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                textAlign: "left",
              }}
            >
              email address
            </label>
            <input
              id="jnl-email"
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={{
                width: "100%",
                height: 40,
                padding: "0 14px",
                border: "1px solid var(--hairline-strong)",
                borderRadius: 999,
                background: "var(--white)",
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
              {state === "submitting" ? "..." : "subscribe"}
            </button>
            {state === "error" && errorMessage && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--red)",
                  margin: "4px 0 0",
                  textAlign: "center",
                }}
              >
                {errorMessage}
              </p>
            )}
            <ConsentNote
              lead='By clicking "subscribe," you agree to receive emails from Toxome and accept our'
              align="center"
              style={{ marginTop: 12 }}
            />
          </form>
        </>
      )}
    </aside>
  );
}
