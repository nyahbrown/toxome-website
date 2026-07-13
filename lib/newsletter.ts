// Client-side newsletter subscribe. The single path every email capture on the
// site goes through (homepage band, timed popup, journal card, guide card, shop
// card, login, extension waitlist).
//
// Centralised for one reason: the analytics call. Before this existed each form
// hand-rolled its own fetch to /api/newsletter and none of them recorded a
// conversion event, so newsletter signups were invisible in Vercel Analytics and
// the only way to count them was to query Supabase by hand. Any new capture form
// must call this rather than fetching /api/newsletter directly.
//
// Records to both systems on success, matching recordSignup() in AuthContext:
// Vercel (powers the Analytics funnel view) and our Supabase `events` table
// (source of truth, no plan limits). `source` is carried into both so the
// conversion rate of each placement can be compared.

import { track as vaTrack } from "@vercel/analytics";
import { track } from "./track";

export type SubscribeResult = { ok: true } | { ok: false; error: string };

const FALLBACK_ERROR = "Something went wrong.";

export async function subscribeNewsletter(
  email: string,
  source: string
): Promise<SubscribeResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Please enter a valid email." };

  try {
    // The API route captures to Supabase AND syncs to beehiiv server-side.
    // Going through it also keeps the ~200KB Supabase client out of the bundle.
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed, source }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || FALLBACK_ERROR };
    }
  } catch {
    return { ok: false, error: FALLBACK_ERROR };
  }

  // Only after the server confirmed the save, so the count stays honest.
  vaTrack("newsletter_signup", { source });
  track("newsletter_signup", { metadata: { source } });

  return { ok: true };
}
