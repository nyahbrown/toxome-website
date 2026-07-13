"use client";

import { useState } from "react";
import ConsentNote from "./ConsentNote";
import { subscribeNewsletter } from "@/lib/newsletter";

// Reusable email capture for pages that aren't the homepage or a journal
// article — currently the fiber guides (/guide/[slug]) and the shop. Those are
// the pages search actually lands strangers on, and until this existed they had
// no way to capture an email at all.
//
// Self-contained styling on purpose: it drops into any page without depending on
// that page's local classes (the journal card leans on .article-cta, which only
// exists inside article prose). `source` is required so each placement's
// conversion rate can be compared in Vercel + Supabase.

type State = "idle" | "submitting" | "success" | "error";

export default function NewsletterCard({
  source,
  align = "left",
}: {
  source: string;
  align?: "left" | "center";
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    setErrorMessage("");

    const result = await subscribeNewsletter(email, source);
    if (result.ok) {
      setState("success");
    } else {
      setErrorMessage(result.error);
      setState("error");
    }
  }

  const inputId = `nl-${source}`;

  return (
    <aside
      className="nl-card"
      style={{
        background: "var(--white)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 16,
        padding: "28px 26px",
        textAlign: align,
        textTransform: "none",
      }}
    >
      {state === "success" ? (
        <>
          <p className="nl-card__eyebrow">you&apos;re in</p>
          <p className="nl-card__headline">Welcome to Toxome.</p>
          <p className="nl-card__body" style={{ margin: 0 }}>
            The newsletter is on its way. Fiber, dyes, and what your clothes do
            to your body.
          </p>
        </>
      ) : (
        <>
          <p className="nl-card__eyebrow">the newsletter</p>
          <p className="nl-card__headline">know what&apos;s in your clothes.</p>
          <p className="nl-card__body">
            Weekly notes on fiber, dyes, and what your clothes do to your body.
          </p>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 360,
              margin: align === "center" ? "0 auto" : undefined,
            }}
          >
            <label htmlFor={inputId} className="nl-card__label">
              email address
            </label>
            <input
              id={inputId}
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
              {state === "submitting" ? "..." : "subscribe"}
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
              align={align}
              style={{ marginTop: 12 }}
            />
          </form>
        </>
      )}

      <style>{`
        .nl-card__eyebrow {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin: 0 0 10px;
        }
        .nl-card__headline {
          font-family: var(--sans);
          font-size: 22px;
          font-weight: 500;
          line-height: 1.2;
          letter-spacing: -0.015em;
          color: var(--ink);
          margin: 0 0 6px;
        }
        .nl-card__body {
          font-size: 16px;
          line-height: 1.5;
          color: var(--ink-2);
          margin: 0 0 16px;
        }
        .nl-card__label {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--ink-3);
          text-align: left;
        }
      `}</style>
    </aside>
  );
}
