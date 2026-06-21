// Mixpanel web client. Shares the SAME project token as the iOS app
// (lib/config/mixpanel_config.dart → e6daa91a…) so web + app events land in ONE
// Mixpanel project. A signed-in visitor is identified by their Firebase UID —
// the same distinct_id the app uses — so the two surfaces stitch into a single
// cross-platform funnel (web product view → app install → paywall → purchase).
//
// CONSENT: mirrors lib/track.ts exactly. Mixpanel persists a distinct_id in
// localStorage, which EU/UK ePrivacy (Art 5(3)) treats as a non-essential
// identifier requiring PRIOR opt-in. So nothing initializes or sends until
// analyticsAllowed() is true — that single gate is the source of truth. We also
// skip localhost so dev traffic never pollutes the project. The SDK is loaded
// via dynamic import so its code/storage never touch a visitor who hasn't
// opted in.

import { analyticsAllowed } from "./consent";

// Public, client-side project token — same class of value as the app token and
// safe to ship to the browser (Mixpanel tokens are ingestion-only).
const MIXPANEL_TOKEN = "e6daa91a597ba9a6a2bc7c85f52535ee";

type MixpanelModule = typeof import("mixpanel-browser");
type MixpanelClient = MixpanelModule["default"];

let client: MixpanelClient | null = null;
let initStarted = false;

function isDevHost(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

function allowed(): boolean {
  return typeof window !== "undefined" && !isDevHost() && analyticsAllowed();
}

// Lazy, consent-gated init. Resolves to null whenever we're not allowed to
// track, so every caller can `?.` through safely.
async function ensureClient(): Promise<MixpanelClient | null> {
  if (!allowed()) return null;
  if (client) return client;
  if (initStarted) return client;
  initStarted = true;
  try {
    const mod = await import("mixpanel-browser");
    const mp = (mod.default ?? mod) as MixpanelClient;
    mp.init(MIXPANEL_TOKEN, { persistence: "localStorage", ip: false });
    // Mirror the app's platform super-property (app sends platform:'ios').
    mp.register({ platform: "web" });
    client = mp;
    return client;
  } catch {
    initStarted = false; // let a later call retry
    return null;
  }
}

// Drop null / empty-string props, matching the app's "omit, never send null".
function clean(props?: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!props) return out;
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v === "") continue;
    out[k] = v;
  }
  return out;
}

export function mpTrack(event: string, props?: Record<string, unknown>): void {
  if (!allowed()) return;
  void ensureClient().then((mp) => mp?.track(event, clean(props)));
}

// Tie events to the canonical user (Firebase UID = the app's distinct_id).
export function mpIdentify(uid: string): void {
  if (!uid || !allowed()) return;
  void ensureClient().then((mp) => mp?.identify(uid));
}

// Clear identity on logout so the next session doesn't merge in. No-op if the
// SDK was never initialized (nothing to clear).
export function mpReset(): void {
  if (!client) return;
  client.reset();
}
