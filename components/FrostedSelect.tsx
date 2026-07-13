"use client";

import { useEffect, useRef, useState } from "react";

// An option can be a bare string (value === label) or a value/label pair when
// the two differ, e.g. the cert filter's slug "oeko-tex-standard-100" → "OEKO-TEX".
// `meta` renders right-aligned and muted, used for match counts.
export type SelectOption = { value: string; label: string; meta?: string };

function toOption(o: string | SelectOption): SelectOption {
  return typeof o === "string" ? { value: o, label: o } : o;
}

type Props = {
  label: string;
  options: (string | SelectOption)[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
  align?: "left" | "right";
  hideAll?: boolean;
  // Render option + trigger labels in Title Case, overriding the site-wide
  // lowercase. Used for the fiber filter so fiber names read as proper labels.
  capitalize?: boolean;
  // Keep the static label on the trigger even when a value is selected (the
  // active selection is shown by a removable chip below instead). The trigger
  // still picks up the "active" styling as a subtle cue.
  stickyLabel?: boolean;
  // "pill" (default) is the bordered pill trigger. "text" renders the trigger
  // as bare underlined text — used for the mobile Sort control.
  variant?: "pill" | "text";
  // Multi-select mode: checkboxes instead of radios, the menu stays open across
  // picks, and selection lives in `values`. `onChange` fires with the toggled
  // option's value, or "All" when the shopper clears. Parent owns the toggle.
  multiple?: boolean;
  values?: string[];
  // Multi-select only: a "Select all" row that checks every option at once.
  onSelectAll?: () => void;
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

function Check({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        flexShrink: 0,
        width: 16,
        height: 16,
        borderRadius: 5,
        border: `1px solid ${checked ? "var(--ink)" : "var(--hairline-strong)"}`,
        background: checked ? "var(--ink)" : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 160ms var(--ease), background 160ms var(--ease)",
      }}
    >
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
        <path
          d="M1 3.6L3.3 5.9L8 1.2"
          stroke="var(--cream)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: checked ? 1 : 0, transition: "opacity 160ms var(--ease)" }}
        />
      </svg>
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
  hideAll = false,
  capitalize = false,
  stickyLabel = false,
  variant = "pill",
  multiple = false,
  values = [],
  onSelectAll,
}: Props) {
  const isText = variant === "text";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // Horizontal nudge (px) that keeps the open menu inside the viewport. Without
  // it, a pill on the right side of a phone row opens a 240px menu that runs off
  // the right edge of the screen.
  const [shiftX, setShiftX] = useState(0);
  const opts = options.map(toOption);
  const isActive = multiple
    ? values.length > 0
    : hideAll
      ? true
      : value !== "All";

  // After the menu renders, measure it and shift it back on-screen if either
  // edge spills past the viewport (12px breathing room).
  useEffect(() => {
    if (!open) {
      setShiftX(0);
      return;
    }
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 12;
    let dx = 0;
    if (rect.right > window.innerWidth - pad) dx = window.innerWidth - pad - rect.right;
    if (rect.left + dx < pad) dx = pad - rect.left;
    setShiftX(dx);
  }, [open]);

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

  // In multi-select, one pick reads as itself and several read as a count, so the
  // pill never grows into a run-on list of cert names.
  const multiLabel =
    values.length === 1
      ? opts.find((o) => o.value === values[0])?.label ?? label
      : `${label} · ${values.length}`;
  const triggerLabel = !isActive || stickyLabel
    ? label
    : multiple
      ? multiLabel
      : value;

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
        style={
          isText
            ? {
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                padding: 0,
                fontSize: 13,
                color: "var(--ink)",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                letterSpacing: "-0.005em",
                lineHeight: 1,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }
            : {
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
                transition:
                  "background 180ms var(--ease), border-color 180ms var(--ease)",
              }
        }
      >
        <span style={capitalize ? { textTransform: "capitalize" } : undefined}>
          {triggerLabel}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          ref={menuRef}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            [align]: 0,
            marginLeft: shiftX,
            minWidth: 240,
            // Never exceed the screen on a phone (leaves 12px on each side).
            maxWidth: "calc(100vw - 24px)",
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
          {!hideAll && (
            <DropdownItem
              isSelected={multiple ? values.length === 0 : value === "All"}
              onClick={() => {
                onChange("All");
                if (!multiple) setOpen(false);
              }}
              label={allLabel}
              muted
              multiple={multiple}
            />
          )}
          {multiple && onSelectAll && (
            <DropdownItem
              isSelected={values.length === opts.length}
              onClick={onSelectAll}
              label="Select all"
              muted
              multiple
            />
          )}
          {opts.map((opt) => (
            <DropdownItem
              key={opt.value}
              isSelected={
                multiple ? values.includes(opt.value) : value === opt.value
              }
              onClick={() => {
                onChange(opt.value);
                if (!multiple) setOpen(false);
              }}
              label={opt.label}
              meta={opt.meta}
              capitalize={capitalize}
              multiple={multiple}
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
  meta,
  isSelected,
  onClick,
  muted = false,
  capitalize = false,
  multiple = false,
}: {
  label: string;
  meta?: string;
  isSelected: boolean;
  onClick: () => void;
  muted?: boolean;
  capitalize?: boolean;
  multiple?: boolean;
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
        textTransform: capitalize ? "capitalize" : undefined,
        transition: "background 140ms var(--ease)",
      }}
    >
      {multiple ? <Check checked={isSelected} /> : <Radio checked={isSelected} />}
      <span style={{ flex: 1 }}>{label}</span>
      {meta && (
        <span
          style={{
            flexShrink: 0,
            fontSize: 12,
            color: "var(--ink-3)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {meta}
        </span>
      )}
    </button>
  );
}
