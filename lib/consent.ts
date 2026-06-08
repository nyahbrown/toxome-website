// Single source of truth for analytics consent + region.
//
// Why this exists: our first-party analytics (lib/track.ts) stores a persistent
// random id in localStorage. Under the EU/UK ePrivacy rules (Art 5(3)) storing a
// non-essential identifier on the device requires PRIOR opt-in consent, being
// first-party and anonymous does not exempt it. US/rest-of-world law (e.g. CCPA)
// has no such prior-consent requirement for first-party analytics we don't sell.
//
// So we gate analytics by region: the EU/UK visitor must opt in via the cookie
// banner before anything is stored; everyone else is tracked as before. The
// region is decided server-side in proxy.ts (from the visitor's IP country) and
// handed to the client as the readable `tox_region` cookie.

export const REGION_COOKIE = "tox_region";
// localStorage key the banner writes the visitor's choice to.
export const CONSENT_KEY = "toxome-cookie-consent";
// Window event the banner fires the moment a choice is made, so other
// bottom-corner UI (the newsletter popup) can react without polling.
export const CONSENT_EVENT = "toxome-cookie-consent";

export type Region = "eu" | "row";
export type ConsentChoice = "accepted" | "rejected";

/** Region as decided by proxy.ts. Defaults to "row" when the cookie is absent
 * (direct hits, dev, non-Vercel hosting), i.e. fail open to the no-banner path. */
export function getRegion(): Region {
  if (typeof document === "undefined") return "row";
  const m = document.cookie.match(/(?:^|;\s*)tox_region=(eu|row)/);
  return m?.[1] === "eu" ? "eu" : "row";
}

export function isEU(): boolean {
  return getRegion() === "eu";
}

export function getConsentChoice(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

/** May we run first-party analytics for this visitor right now?
 * EU/UK → only after an explicit "accept". Everyone else → yes. */
export function analyticsAllowed(): boolean {
  if (!isEU()) return true;
  return getConsentChoice() === "accepted";
}

/** Show the consent banner only to EU/UK visitors who haven't chosen yet. */
export function shouldShowConsentBanner(): boolean {
  return isEU() && getConsentChoice() === null;
}

/** Gate for the newsletter popup: don't surface it while the banner is still
 * pending (they share the bottom-corner space). Non-EU visitors never see the
 * banner, so there's nothing to wait on. Storage blocked → don't trap the popup. */
export function consentResolved(): boolean {
  if (!isEU()) return true;
  try {
    return !!localStorage.getItem(CONSENT_KEY);
  } catch {
    return true;
  }
}
