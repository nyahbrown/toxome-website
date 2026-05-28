"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
  align?: "left" | "right";
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
      style={{
        flexShrink: 0,
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

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        flexShrink: 0,
        width: 16,
        height: 16,
        borderRadius: 999,
        border: `1px solid ${checked ? "var(--ink)" : "var(--hairline-strong)"}`,
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 160ms var(--ease)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: "var(--ink)",
          opacity: checked ? 1 : 0,
          transition: "opacity 160ms var(--ease)",
        }}
      />
    </span>
  );
}

export default function FrostedSelect({
  label,
  options,
  value,
  onChange,
  allLabel = "All",
  align = "left",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const isActive = value !== "All";

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerLabel = isActive ? value : label;

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", display: "inline-flex" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          border: `1px solid ${
            open || isActive ? "var(--hairline-strong)" : "rgba(59,60,58,0.18)"
          }`,
          borderRadius: 999,
          padding: "8px 14px 8px 16px",
          fontSize: 13,
          color: isActive ? "var(--ink)" : "var(--ink-2)",
          background: open ? "rgba(252,251,247,0.65)" : "transparent",
          backdropFilter: open ? "blur(12px) saturate(160%)" : "none",
          WebkitBackdropFilter: open ? "blur(12px) saturate(160%)" : "none",
          cursor: "pointer",
          fontFamily: "var(--sans)",
          letterSpacing: "-0.005em",
          lineHeight: 1,
          transition: "background 180ms var(--ease), border-color 180ms var(--ease)",
        }}
      >
        <span>{triggerLabel}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            [align]: 0,
            minWidth: 240,
            maxHeight: 320,
            overflowY: "auto",
            padding: 8,
            background: "rgba(252,251,247,0.72)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid var(--hairline)",
            borderRadius: 18,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.5) inset, 0 18px 48px -12px rgba(59,60,58,0.18), 0 4px 14px -6px rgba(59,60,58,0.10)",
            zIndex: 40,
            animation: "frostedFadeIn 160ms var(--ease)",
          }}
        >
          <DropdownItem
            isSelected={value === "All"}
            onClick={() => {
              onChange("All");
              setOpen(false);
            }}
            label={allLabel}
            muted
          />
          {options.map((opt) => (
            <DropdownItem
              key={opt}
              isSelected={value === opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              label={opt}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes frostedFadeIn {
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

function DropdownItem({
  label,
  isSelected,
  onClick,
  muted = false,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  muted?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 12px",
        background: hovered ? "rgba(59,60,58,0.05)" : "transparent",
        border: "none",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "var(--sans)",
        fontSize: 14,
        letterSpacing: "-0.005em",
        color: muted && !isSelected ? "var(--ink-3)" : "var(--ink)",
        textAlign: "left",
        transition: "background 140ms var(--ease)",
      }}
    >
      <Radio checked={isSelected} />
      <span>{label}</span>
    </button>
  );
}
