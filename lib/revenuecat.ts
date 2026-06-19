// Web checkout via RevenueCat Web Purchase Links, backed by Stripe Billing with
// Managed Payments.
//
// How cross-platform access works: the purchase is attributed to whatever App
// User ID we put in the link path. We set that to the user's Firebase UID — the
// exact same ID the Flutter app logs into RevenueCat with
// (revenue_cat_util.dart → Purchases.logIn(uid)). So a purchase here unlocks the
// "Toxome Premium" entitlement on the same RevenueCat customer the app reads
// live, and access carries over to the phone with zero app-side changes. Stripe
// is the merchant of record and handles global VAT/sales tax; the deployed
// revenueCatWebhook also mirrors is_premium into Firestore for the website UI.

// Must match the entitlement identifier in the RevenueCat dashboard AND the one
// the app checks (m_y_closet_widget.dart → isEntitled('Toxome Premium')).
export const PREMIUM_ENTITLEMENT_ID = "Toxome Premium";

// Base Web Purchase Link from RevenueCat → Funnels → Purchase Links, e.g.
// "https://pay.rev.cat/abcd1234". The offering behind it holds both the monthly
// and annual packages, so customers choose the plan on RevenueCat's page.
const PURCHASE_LINK_BASE =
  process.env.NEXT_PUBLIC_REVENUECAT_PURCHASE_LINK ?? "";

// True only once the link is configured. Until then the UI falls back to the
// App Store CTA so the account page never breaks.
export const webBillingEnabled = PURCHASE_LINK_BASE.length > 0;

// Package identifiers in the RevenueCat `web` offering. Passing one via the
// package_id param pre-selects that plan so the customer goes straight toward
// Stripe Checkout instead of RevenueCat's plan picker.
export const PACKAGE_MONTHLY = "$rc_monthly";
export const PACKAGE_ANNUAL = "$rc_annual";

// Build the checkout URL for a specific user. RevenueCat takes the App User ID
// as a URL-encoded path segment appended to the base link; an optional
// packageId pre-selects a plan.
export function purchaseLinkForUser(uid: string, packageId?: string): string {
  const base = PURCHASE_LINK_BASE.replace(/\/+$/, "");
  const url = `${base}/${encodeURIComponent(uid)}`;
  return packageId ? `${url}?package_id=${encodeURIComponent(packageId)}` : url;
}
