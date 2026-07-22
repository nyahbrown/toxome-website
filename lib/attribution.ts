// First-touch UTM attribution, kept separate from lib/track.ts because it
// answers a different question. track() logs WHAT a visitor did; this module
// remembers WHERE they first came from, so a `visit` counted today and a Buy
// click a week later can both be credited to the channel that actually
// brought them in.
//
// FIRST TOUCH ONLY: once a record exists we never overwrite it. A visitor who
// lands from a Substack link and comes back later through a Pinterest pin
// should stay credited to Substack — that's the channel that did the work of
// acquiring them, not the one that happened to re-engage them.
//
// CONSENT: same rule as lib/track.ts — this writes a persistent identifier
// (first-touch source) to localStorage, which EU/UK ePrivacy (Art 5(3)) gates
// on prior opt-in. analyticsAllowed() is the single gate; see lib/consent.ts.

import { analyticsAllowed } from "./consent";

const ATTR_KEY = "toxome_attr";

export type StoredAttribution = {
  source: string;
  medium: string | null;
  campaign: string | null;
  landingPath: string;
  ts: number;
};

function isDevHost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

// Read the UTM params off the current URL and, if nothing is stored yet, write
// them as the visitor's permanent first touch. No-ops entirely (no read, no
// write) for EU/UK visitors who haven't consented, and for local dev so
// testing never pollutes the channel numbers.
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  if (!analyticsAllowed()) return;
  if (isDevHost()) return;

  try {
    // A record already exists — first touch wins, nothing to do.
    if (localStorage.getItem(ATTR_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source");
    // No utm_source means nothing to attribute this arrival to (e.g. direct,
    // or a bare in-site navigation) — leave attribution unset rather than
    // inventing a source.
    if (!source) return;

    const record: StoredAttribution = {
      source,
      medium: params.get("utm_medium"),
      campaign: params.get("utm_campaign"),
      landingPath: window.location.pathname,
      ts: Date.now(),
    };
    localStorage.setItem(ATTR_KEY, JSON.stringify(record));
  } catch {
    // Private mode / storage blocked. Not fatal, this visit just goes
    // unattributed.
  }
}

// Read back the stored first touch, tolerating a missing or malformed record
// (an older schema, hand-edited storage, etc.) by returning null rather than
// throwing.
export function getAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  if (!analyticsAllowed()) return null;

  try {
    const raw = localStorage.getItem(ATTR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || typeof parsed.source !== "string") {
      return null;
    }
    return {
      source: parsed.source,
      medium: typeof parsed.medium === "string" ? parsed.medium : null,
      campaign: typeof parsed.campaign === "string" ? parsed.campaign : null,
      landingPath: typeof parsed.landingPath === "string" ? parsed.landingPath : "",
      ts: typeof parsed.ts === "number" ? parsed.ts : 0,
    };
  } catch {
    return null;
  }
}

// app/out/[productId]/route.ts runs server-side and can't read localStorage,
// so the attribution has to ride along as query params on the /out href
// itself. Short keys (as/am/ac) because these land on a link that's already
// carrying a UUID. Only touches hrefs that actually resolve to /out — a direct
// merchant link (the Skimlinks path) must stay untouched, see the header
// comment on outboundHrefFor() in lib/affiliatePrograms.ts.
export function attachOutboundAttribution(href: string | null): string | null {
  if (!href || !href.startsWith("/out/")) return href;
  const attribution = getAttribution();
  if (!attribution) return href;

  const params = new URLSearchParams();
  params.set("as", attribution.source);
  if (attribution.medium) params.set("am", attribution.medium);
  if (attribution.campaign) params.set("ac", attribution.campaign);

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${params.toString()}`;
}
