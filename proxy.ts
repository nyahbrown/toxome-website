import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Geo-gate for analytics consent.
//
// Decides each visitor's region from their IP country (Vercel injects this on
// every edge request) and hands it to the client as the readable `tox_region`
// cookie. lib/consent.ts reads that cookie to decide whether the EU consent
// banner shows and whether first-party analytics may run. See lib/consent.ts
// for the legal reasoning.
//
// NOTE: Next 16 renamed the `middleware` file convention to `proxy`.

// EU-27 + EEA (Iceland, Liechtenstein, Norway) + UK — the jurisdictions whose
// ePrivacy/GDPR rules require PRIOR opt-in before a non-essential analytics
// identifier is stored on the device.
const CONSENT_REQUIRED = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", // EU-27
  "IS", "LI", "NO", // EEA non-EU
  "GB",             // UK (UK GDPR + PECR)
]);

// Keep in sync with REGION_COOKIE in lib/consent.ts. Duplicated rather than
// imported so the edge proxy bundle stays free of the client consent module.
const REGION_COOKIE = "tox_region";

export function proxy(request: NextRequest) {
  const country =
    request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? "";

  // Dev/test override: `?region=eu` or `?region=row` pins the region so the
  // banner can be exercised on localhost, where no geo header exists.
  const override = request.nextUrl.searchParams.get("region");
  const region: "eu" | "row" =
    override === "eu" || override === "row"
      ? override
      : CONSENT_REQUIRED.has(country)
        ? "eu"
        : "row";

  // Only write the cookie when it would actually change. A response without a
  // Set-Cookie header stays cacheable, so returning visitors don't defeat the
  // CDN on every navigation.
  if (request.cookies.get(REGION_COOKIE)?.value === region && !override) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  // Readable by client code (not httpOnly). This cookie exists ONLY to deliver
  // the legally-required consent mechanism, so it is itself strictly necessary
  // and needs no consent.
  response.cookies.set(REGION_COOKIE, region, {
    path: "/",
    maxAge: 60 * 60 * 24, // refreshed on navigation; 1-day fallback
    sameSite: "lax",
  });
  return response;
}

export const config = {
  // Run on page requests only — skip API routes, static assets, image
  // optimization, and metadata files.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
