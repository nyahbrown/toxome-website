/**
 * Apple App Site Association — the file iOS fetches to decide whether a
 * toxome.app link should open the Toxome app instead of Safari.
 *
 * Served as a Route Handler rather than a file in `public/` because Apple
 * requires `application/json` on a URL with no extension, which a static asset
 * cannot guarantee.
 *
 * Paired with `com.apple.developer.associated-domains` (`applinks:toxome.app`)
 * in the Flutter app's `ios/Runner/Runner.entitlements`. Both sides must agree
 * or the link silently falls back to the browser, which is a safe failure: the
 * web page is always a valid destination.
 *
 * iOS caches this file, so changes reach existing installs slowly (on app
 * update or reinstall). Treat it as close to append-only.
 */

// The app's Team ID + bundle identifier, from the Xcode project.
const APP_ID = "YQY5N9YPKK.app.toxome.main";

const association = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        // Order matters: the first matching component wins, so every non-product
        // page that lives under /shop is excluded BEFORE the /shop/* catch-all.
        // Without these, /shop/women and /shop/collection/* would open the app
        // with "women" as a product id.
        components: [
          { "/": "/shop", exclude: true, comment: "Shop index, not a product." },
          { "/": "/shop/", exclude: true, comment: "Shop index with a trailing slash." },
          { "/": "/shop/women*", exclude: true, comment: "Department page." },
          { "/": "/shop/men*", exclude: true, comment: "Department page." },
          { "/": "/shop/kids*", exclude: true, comment: "Department page." },
          { "/": "/shop/home*", exclude: true, comment: "Department page." },
          { "/": "/shop/fibers*", exclude: true, comment: "Fiber browse page." },
          { "/": "/shop/collection*", exclude: true, comment: "Collection pages." },
          { "/": "/shop/collections*", exclude: true, comment: "Collections index." },
          { "/": "/shop/*/pin*", exclude: true, comment: "Pinterest image route." },
          {
            "/": "/shop/*",
            comment: "Product detail. The only path the app claims.",
          },
        ],
      },
    ],
  },
};

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(association, null, 2), {
    headers: {
      "Content-Type": "application/json",
      // iOS refetches rarely; a day is long enough to be cheap and short enough
      // that a fix is not stuck behind a week of CDN cache.
      "Cache-Control": "public, max-age=86400",
    },
  });
}
