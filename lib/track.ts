// First-party, anonymous analytics → the Supabase `events` table.
//
// Every event carries a random device id (no PII) and, when the visitor is
// signed in, their Firebase UID. Data goes ONLY to our own Supabase project, no
// third-party trackers. The same `events` table powers the per-brand traffic
// reports (Brand Intelligence), so `brand` is the key field on every row.
//
// CONSENT: the device id lives in localStorage, which EU/UK ePrivacy rules
// (Art 5(3)) treat as a non-essential identifier requiring PRIOR opt-in, being
// first-party does not exempt it. So track() and the id are gated by
// analyticsAllowed(): EU/UK visitors must accept the banner first; everyone else
// is unaffected. See lib/consent.ts.

import { supabase } from "./supabase";
import { analyticsAllowed } from "./consent";
import { mpTrack } from "./mixpanel";

const ANON_KEY = "toxome_anon_id";

// A stable per-device id stored in localStorage. No PII, just lets us tell
// "10 clicks from 10 people" apart from "10 clicks from 1 person" in reports.
function getAnonId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage blocked, still record the event, just without a
    // stable id for this visitor.
    return "no-storage";
  }
}

// Tag an outbound brand link so the brand can verify Toxome-referred traffic in
// their OWN analytics (the credibility unlock for the B2B reports), and so the
// visit reads as a referral instead of direct.
export function withUtm(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "toxome.app");
    u.searchParams.set("utm_medium", "referral");
    return u.toString();
  } catch {
    // Relative or malformed URL, leave it untouched.
    return url;
  }
}

export type TrackPayload = {
  brand?: string | null;
  productId?: string | null;
  productName?: string | null;
  category?: string | null;
  scoreAtTime?: number | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

// Fire-and-forget. Analytics must never block navigation or surface an error
// into the UI, so failures are swallowed (logged in dev only).
export function track(eventType: string, payload: TrackPayload = {}): void {
  if (typeof window === "undefined") return;
  // EU/UK visitors: nothing is stored or sent until they opt in via the banner.
  // Non-EU visitors: first-party analytics needs no prior consent.
  if (!analyticsAllowed()) return;
  // Don't record events from local development, keeps the brand pitch numbers
  // clean so your own testing on localhost never inflates them.
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return;
  }
  void supabase
    .from("events")
    .insert({
      event_type: eventType,
      anon_id: getAnonId(),
      user_id: payload.userId ?? null,
      brand: payload.brand ?? null,
      product_id: payload.productId ?? null,
      product_name: payload.productName ?? null,
      category: payload.category ?? null,
      score_at_time: payload.scoreAtTime ?? null,
      source: "web",
      metadata: payload.metadata ?? {},
    })
    .then(({ error }) => {
      if (error && process.env.NODE_ENV !== "production") {
        console.warn("track() failed:", error.message);
      }
    });

  // Mirror the same event into Mixpanel (one project shared with the app) so a
  // signed-in user threads web + app into a single funnel. Same consent/dev
  // gates already applied above; mpTrack re-checks them defensively.
  mpTrack(eventType, {
    brand: payload.brand ?? undefined,
    product_id: payload.productId ?? undefined,
    product_name: payload.productName ?? undefined,
    category: payload.category ?? undefined,
    score_at_time: payload.scoreAtTime ?? undefined,
    source: "web",
    ...(payload.metadata ?? {}),
  });
}
