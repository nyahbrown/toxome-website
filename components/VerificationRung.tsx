"use client";

import { useEffect, useRef, useState } from "react";
import {
  resolveRung,
  RUNG_META,
  VERIFICATION_FIREWALL_LINE,
  type VerificationRung as Rung,
} from "@/lib/verification";

// A quieter sibling to the RiskChip: the RiskChip is the bold colored verdict;
// this is the outlined neutral confidence label. Tappable — opens a small
// popover explaining how the score was verified, with the firewall line.
export default function VerificationRung({
  certifications,
  verification_rung,
}: {
  certifications?: string[] | null;
  verification_rung?: Rung | null;
}) {
  const rung = resolveRung({ certifications, verification_rung });
  const meta = RUNG_META[rung];
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Verification: ${meta.label}. ${meta.title}`}
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontFamily: "var(--mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink)",
          background: "var(--white)",
          border: "1px solid var(--hairline-strong)",
          padding: "5px 11px",
          borderRadius: 999,
          cursor: "pointer",
          transition: "background 160ms ease, border-color 160ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--cream)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--white)";
        }}
      >
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: meta.dotColor,
            flexShrink: 0,
          }}
        />
        {meta.label}
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 13,
            height: 13,
            borderRadius: 999,
            border: "1px solid var(--hairline-strong)",
            fontSize: 8.5,
            lineHeight: 1,
            color: "var(--ink-3)",
            marginLeft: 1,
          }}
        >
          ?
        </span>
      </button>

      {open && (
        <span
          role="dialog"
          aria-label={`${meta.label} — ${meta.title}`}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 20,
            display: "block",
            width: "max-content",
            maxWidth: 280,
            background: "var(--white)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: 16,
            boxShadow: "0 16px 40px -16px rgba(44, 36, 32, 0.32)",
            padding: "16px 18px",
            textTransform: "none",
            textAlign: "left",
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 15,
              lineHeight: 1,
              color: "var(--ink-3)",
            }}
          >
            ×
          </button>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              margin: "0 0 6px",
              paddingRight: 14,
            }}
          >
            {meta.title}
          </p>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 13,
              lineHeight: 1.55,
              letterSpacing: "-0.005em",
              color: "var(--ink-2)",
              margin: "0 0 10px",
            }}
          >
            {meta.body}
          </p>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 11.5,
              lineHeight: 1.5,
              letterSpacing: "-0.003em",
              color: "var(--ink-3)",
              margin: 0,
            }}
          >
            {VERIFICATION_FIREWALL_LINE}
          </p>
          {(rung === "undisclosed" || rung === "self_disclosed") && (
            <a
              href="/verify"
              style={{
                display: "inline-block",
                marginTop: 10,
                fontFamily: "var(--sans)",
                fontSize: 11.5,
                lineHeight: 1.4,
                color: "var(--ink-3)",
                textDecoration: "none",
              }}
            >
              Are you the brand? Get verified for free →
            </a>
          )}
        </span>
      )}
    </span>
  );
}
