"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavItem = { label: string; href: string; muted?: boolean };
type Column = { heading: string; items: NavItem[] };

type Props = {
  label: string;
  transparent: boolean;
  active: boolean;
  href: string;
  columns: Column[];
  panelWidth?: number;
};

const OPEN_DELAY = 120;
const CLOSE_DELAY = 220;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="9"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
      style={{
        marginLeft: 4,
        transition: "transform 180ms var(--ease)",
        transform: open ? "rotate(180deg)" : "none",
      }}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NavDropdown({
  label,
  transparent,
  active,
  href,
  columns,
  panelWidth,
}: Props) {
  const [open, setOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  function scheduleOpen() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (open) return;
    openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY);
  }

  function scheduleClose() {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }

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

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const triggerColor = transparent
    ? "rgba(255,255,255,0.92)"
    : active || open
    ? "var(--ink)"
    : "var(--ink-2)";

  const computedWidth = panelWidth ?? (columns.length > 1 ? 460 : 240);

  return (
    <div
      ref={wrapRef}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <Link
        href={href}
        onFocus={scheduleOpen}
        onClick={() => setOpen(false)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
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
        <Chevron open={open} />
      </Link>

      {open && (
        <div
          role="menu"
          onMouseEnter={scheduleOpen}
          onMouseLeave={scheduleClose}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            width: computedWidth,
            padding: 14,
            display: "grid",
            gridTemplateColumns: columns.length > 1 ? "1fr 1fr" : "1fr",
            gap: columns.length > 1 ? 12 : 0,
            background: "rgba(252,251,247,0.72)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid var(--hairline)",
            borderRadius: 18,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.5) inset, 0 18px 48px -12px rgba(59,60,58,0.18), 0 4px 14px -6px rgba(59,60,58,0.10)",
            zIndex: 60,
            animation: "navDropFade 160ms var(--ease)",
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
                <NavMenuLink key={item.href + item.label} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          ))}
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
