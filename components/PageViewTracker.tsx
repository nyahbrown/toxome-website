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
import { captureAttribution, getAttribution } from "@/lib/attribution";
import { CONSENT_EVENT } from "@/lib/consent";

export default function PageViewTracker() {
  const pathname = usePathname();

  // First load, before anything else fires: capture first-touch UTM
  // attribution so the very first pageview and every event after it already
  // carries the channel (see lib/track.ts). Runs ahead of mpRegisterUtm below
  // for that reason.
  //
  // Diffing "did a record exist before this call" against "does one exist
  // now" is how we know captureAttribution() just wrote a NEW first touch
  // (rather than a repeat visit with one already on file) without changing
  // its void signature — that's the "once per stored first-touch" trigger for
  // the visit event, which is what answers "how many clicks did channel X
  // send us" directly.
  //
  // Repeated on the consent event, not just on mount: an EU/UK visitor hasn't
  // answered the banner yet when this component mounts, so analyticsAllowed()
  // is false and the first call no-ops. Without the retry their first touch
  // would be lost for good, and every EU arrival from a tagged link would go
  // uncounted — a channel test that silently drops a whole region isn't a test.
  // Re-running on accept recovers them, provided they answer before navigating
  // away from the landing URL that carries the UTMs.
  useEffect(() => {
    function captureOnce() {
      const hadAttribution = !!getAttribution();
      captureAttribution();
      // track() reads the stored attribution itself (lib/track.ts), so the
      // event needs no explicit metadata here — just the trigger.
      if (!hadAttribution && getAttribution()) track("visit");
    }
    captureOnce();
    window.addEventListener(CONSENT_EVENT, captureOnce);
    return () => window.removeEventListener(CONSENT_EVENT, captureOnce);
  }, []);

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
