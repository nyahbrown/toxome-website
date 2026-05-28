"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavItem = { label: string; href: string; muted?: boolean };
type Column = { heading: string; items: NavItem[] };

type Props = {
  label: string;
  transparent: boolean;
  active: boolean;
  columns: Column[];
  topRow?: NavItem;
  panelWidth?: number;
};

export default function NavDropdown({
  label,
  transparent,
  active,
  columns,
  topRow,
  panelWidth,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  const triggerColor = transparent
    ? "rgba(255,255,255,0.92)"
    : active || open
    ? "var(--ink)"
    : "var(--ink-2)";

  const computedWidth =
    panelWidth ??
    (columns.length === 1 ? 240 : columns.length === 2 ? 460 : 600);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: "-0.005em",
          color: triggerColor,
          textDecoration: !transparent && active ? "underline" : "none",
          textUnderlineOffset: 5,
          textDecorationThickness: 1,
          transition: "color 300ms ease",
          padding: "8px 0",
        }}
      >
        {label}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            width: computedWidth,
            padding: 14,
            background: "var(--cream)",
            border: "1px solid var(--hairline)",
            borderRadius: 18,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.5) inset, 0 18px 48px -12px rgba(59,60,58,0.18), 0 4px 14px -6px rgba(59,60,58,0.10)",
            zIndex: 60,
            animation: "navDropFade 160ms var(--ease)",
          }}
        >
          {topRow && (
            <div style={{ padding: 4, marginBottom: 4 }}>
              <NavMenuLink item={topRow} onNavigate={() => setOpen(false)} />
              <div
                style={{
                  height: 1,
                  background: "var(--hairline)",
                  margin: "6px 6px 0",
                }}
              />
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
              gap: columns.length > 1 ? 12 : 0,
            }}
          >
            {columns.map((col) => (
              <div key={col.heading} style={{ padding: 4 }}>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ink-3)",
                    padding: "6px 10px 8px",
                  }}
                >
                  {col.heading}
                </div>
                {col.items.map((item) => (
                  <NavMenuLink
                    key={item.href + item.label}
                    item={item}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes navDropFade {
          from {
            opacity: 0;
            transform: translateY(-4px);
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

function NavMenuLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={item.href}
      role="menuitem"
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        padding: "8px 10px",
        borderRadius: 10,
        fontSize: 14,
        letterSpacing: "-0.005em",
        color: item.muted ? "var(--ink-3)" : "var(--ink)",
        background: hovered ? "rgba(59,60,58,0.05)" : "transparent",
        textDecoration: "none",
        transition: "background 140ms var(--ease)",
      }}
    >
      {item.label}
    </Link>
  );
}
