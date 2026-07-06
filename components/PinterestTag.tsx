"use client";

// Pinterest Tag — the base pixel + a PageVisit on every route. This is what
// turns Pinterest's "Conversion insights" from 0 page visits into real
// attribution for the outbound clicks our pins earn. Off by default: it does
// nothing unless NEXT_PUBLIC_PINTEREST_TAG_ID is set (grab the id from Pinterest
// Ads → Conversions → Pinterest tag, then add it to the Vercel env).
//
// It is a third-party tracker, so it obeys the SAME consent gate as our
// first-party analytics (lib/consent.ts): EU/UK visitors only after they accept
// the cookie banner, everyone else immediately. When an EU visitor accepts
// later, the banner fires CONSENT_EVENT and we start then.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { analyticsAllowed, CONSENT_EVENT } from "@/lib/consent";

const TAG_ID = process.env.NEXT_PUBLIC_PINTEREST_TAG_ID;

type PintrkFn = ((...args: unknown[]) => void) & {
  queue?: unknown[][];
  version?: string;
};

declare global {
  interface Window {
    pintrk?: PintrkFn;
  }
}

// Inject the Pinterest base code once and fire the initial `load`. Idempotent:
// SPA navigations never reload it, and a second call is a no-op.
function loadPinterestBase() {
  if (typeof window === "undefined" || window.pintrk) return;
  const fn = ((...args: unknown[]) => {
    fn.queue!.push(args);
  }) as PintrkFn;
  fn.queue = [];
  fn.version = "3.0";
  window.pintrk = fn;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://s.pinimg.com/ct/core.js";
  document.head.appendChild(s);
  window.pintrk("load", TAG_ID as string);
}

export default function PinterestTag() {
  const pathname = usePathname();
  const [started, setStarted] = useState(false);
  const lastPath = useRef<string | null>(null);

  // Load the base once consent allows it. EU/UK: wait for an explicit accept
  // (re-checked when the banner fires CONSENT_EVENT). Everyone else: now.
  useEffect(() => {
    if (!TAG_ID || started) return;
    function start() {
      if (!analyticsAllowed()) return;
      loadPinterestBase();
      setStarted(true);
    }
    start();
    window.addEventListener(CONSENT_EVENT, start);
    return () => window.removeEventListener(CONSENT_EVENT, start);
  }, [started]);

  // A PageVisit per unique path — the initial one plus every client-side
  // navigation (the base code loads only once, so SPA routes need this).
  useEffect(() => {
    if (!TAG_ID || !started || !pathname) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    window.pintrk?.("page");
  }, [started, pathname]);

  return null;
}
