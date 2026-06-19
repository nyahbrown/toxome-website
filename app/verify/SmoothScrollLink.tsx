"use client";

import type { CSSProperties, ReactNode } from "react";

// In-page anchor link with smooth scrolling. We do this in JS (not a global
// `scroll-behavior: smooth`) because that global rule animates Next.js's
// scroll-to-top reset on every navigation. scrollIntoView with block:"start"
// honors the target's scroll-margin-top, so the heading clears the fixed nav.
export default function SmoothScrollLink({
  targetId,
  className,
  style,
  children,
}: {
  targetId: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = document.getElementById(targetId);
    if (!el) return; // let the browser fall back to the default jump
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${targetId}`);
  }

  return (
    <a href={`#${targetId}`} className={className} style={style} onClick={onClick}>
      {children}
    </a>
  );
}
