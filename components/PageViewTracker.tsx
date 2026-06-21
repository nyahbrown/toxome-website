"use client";

// Fires a Mixpanel `page_view` on every route change so funnels and retention
// have the pageview backbone they need. Goes to Mixpanel ONLY (via mpTrack, not
// track()) on purpose — routing every navigation into the Supabase `events`
// table would flood it; that table is for product/brand events. Consent + dev
// gating live inside mpTrack. UTM attribution is captured once on first load.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { mpTrack, mpRegisterUtm } from "@/lib/mixpanel";

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

  return null;
}
