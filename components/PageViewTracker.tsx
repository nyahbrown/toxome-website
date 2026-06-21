"use client";

// Fires a Mixpanel `page_view` on every route change so funnels and retention
// have the pageview backbone they need. Goes to Mixpanel ONLY (via mpTrack, not
// track()) on purpose — routing every navigation into the Supabase `events`
// table would flood it; that table is for product/brand events. Consent + dev
// gating live inside mpTrack. UTM attribution is captured once on first load.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { mpTrack, mpRegisterUtm } from "@/lib/mixpanel";
import { track } from "@/lib/track";

export default function PageViewTracker() {
  const pathname = usePathname();

  // First load: stamp the acquisition source onto the session + profile.
  useEffect(() => {
    mpRegisterUtm();
  }, []);

  // Every route change (and the first one): a pageview.
  useEffect(() => {
    if (!pathname) return;
    mpTrack("page_view", { path: pathname });
  }, [pathname]);

  // App Store CTA clicks = the website's REAL conversion (visitor → install).
  // There are ~10 App Store links across the site; one capturing-phase listener
  // catches every one (current and future) without touching each component.
  // Goes through track() so it lands in BOTH Mixpanel (boards) and Supabase
  // (source of truth / weekly check-in).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("a[href*='apps.apple.com']")) {
        track("app_store_click", { metadata: { path: window.location.pathname } });
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
