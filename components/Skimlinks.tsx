"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { analyticsAllowed, CONSENT_EVENT } from "@/lib/consent";

// Skimlinks (publisher 304888X1793079) rewrites outbound merchant links into
// affiliate links so Toxome earns commission without per-brand network approval.
// It drops a third-party tracking cookie, so it's gated behind the same consent
// check as our first-party analytics: US / rest-of-world load it immediately;
// EU/UK visitors only after an explicit opt-in via the cookie banner. We re-check
// on CONSENT_EVENT so it activates the moment an EU visitor accepts.
export default function Skimlinks() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => setAllowed(analyticsAllowed());
    check();
    window.addEventListener(CONSENT_EVENT, check);
    return () => window.removeEventListener(CONSENT_EVENT, check);
  }, []);

  if (!allowed) return null;

  return (
    <Script
      src="https://s.skimresources.com/js/304888X1793079.skimlinks.js"
      strategy="afterInteractive"
    />
  );
}
