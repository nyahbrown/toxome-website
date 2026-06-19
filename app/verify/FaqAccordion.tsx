"use client";

import { useState } from "react";

type Item = { q: string; a: string };

// Smooth drop-down FAQ. Uses the grid-template-rows 0fr -> 1fr trick so the
// panel height animates fluidly (no max-height guesswork), with a caret that
// rotates 180deg on open.
export default function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="vf-faq" data-open={isOpen}>
            <button
              type="button"
              className="vf-faq__q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{f.q}</span>
              <svg
                className="vf-faq__caret"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="vf-faq__panel">
              <div className="vf-faq__panelInner">
                <p className="vf-faq__a">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
