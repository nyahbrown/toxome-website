import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveOutbound } from "@/lib/affiliatePrograms";

// GET /out/[productId] — the single door every outbound product click goes
// through.
//
// Why a redirect layer instead of just putting the affiliate link on the page:
//
// 1. One row, not 40 pages. When a brand switches networks (or we finally close
//    a direct deal and drop the network default) we change one row in
//    brand_affiliate_programs. Every product for that brand re-routes on the
//    next click. Baking links into product rows means re-doing them all.
// 2. Our own click log. Every network reports its own clicks and marks its own
//    homework. outbound_clicks is the independent number to check them against.
// 3. Nothing is baked into HTML. A product page that hardcoded a network URL
//    would serve a stale one from the CDN long after the deal changed.
//
// ⚠ WIRED PER-BRAND ONLY. Routing a click through this door BYPASSES SKIMLINKS:
// Skimlinks rewrites merchant hrefs in the DOM client-side, and a same-origin
// /out link gives its script nothing to recognize, so the 302 to the brand
// happens where Skimlinks can never see it. That is fine for a brand with a
// program row (we wrapped the link ourselves and earn more) and a straight
// revenue loss for one without (Skimlinks was the only earner).
//
// So pages must NOT link here unconditionally. They ask outboundHrefFor()
// (lib/affiliatePrograms.ts), which returns /out only when a wrapper actually
// applied and a direct merchant href otherwise, leaving Skimlinks to earn on the
// brands we have no program for. Brands flip over as their rows land.
//
// Live as of 2026-07-16: Wayve Wear (uppromote), 3 of 727 published products.
// The other 154 brands still have no row and still go direct to Skimlinks.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Attribution params (as/am/ac, set by attachOutboundAttribution() in
// lib/attribution.ts) come off the query string of a client-built URL, so
// treat them as untrusted input, not as our own JSON: cap length and reject
// anything outside the lowercase-slug shape a UTM source/medium/campaign
// actually takes, rather than writing junk into outbound_clicks.
const ATTR_VALUE_RE = /^[a-z0-9_-]{1,64}$/;

function sanitizeAttrParam(value: string | null): string | null {
  if (!value) return null;
  return ATTR_VALUE_RE.test(value) ? value : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const url = new URL(req.url);

  // Shape-check before touching the database: /out/<junk> is a bot, not a buyer.
  if (!UUID_RE.test(productId)) {
    return new Response("Not found", { status: 404 });
  }

  // Absent when the visitor has no first-touch attribution on file (organic,
  // consent not given, etc.) — sanitizeAttrParam() also returns null for
  // anything absent or malformed, so a missing param and a bad one log
  // identically: NULL, not a guess.
  const attrSource = sanitizeAttrParam(url.searchParams.get("as"));
  const attrMedium = sanitizeAttrParam(url.searchParams.get("am"));
  const attrCampaign = sanitizeAttrParam(url.searchParams.get("ac"));

  // Deliberately NOT filtered on `published`. An unpublished product is absent
  // from the shop grid, but its link can still be live in a wishlist, an old
  // newsletter, or an indexed Journal article, and those buyers should still
  // reach the brand. The destination comes from our own catalog either way, so
  // this is not an open redirect.
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, brand, item_url, affiliate_url")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    console.error("outbound product fetch error:", productError.message);
    return new Response("Not found", { status: 404 });
  }
  if (!product) return new Response("Not found", { status: 404 });

  // Shared with the pages that decide whether to link here, so the two can never
  // disagree about what resolves. A lookup failure inside degrades to no program
  // rather than throwing: the buyer still reaches the brand and buys. The
  // commission on that click is lost (nothing wraps it, and Skimlinks can't see a
  // server redirect, see the header note), but a dead end would lose the sale.
  const resolved = await resolveOutbound(product);

  // No item_url and no affiliate link: there is nowhere to send them. Back to
  // the product page rather than a dead end.
  if (!resolved) {
    return Response.redirect(new URL(`/shop/${product.id}`, req.url), 302);
  }

  // after() runs once the response is already on its way, so the buyer never
  // waits on our bookkeeping. A dropped click row is an acceptable loss; a
  // delayed redirect is not.
  after(async () => {
    const { error } = await supabaseAdmin.from("outbound_clicks").insert({
      product_id: product.id,
      brand: product.brand,
      network: resolved.network,
      referrer: req.headers.get("referer"),
      attr_source: attrSource,
      attr_medium: attrMedium,
      attr_campaign: attrCampaign,
    });
    if (error) console.error("outbound click log error:", error.message);
  });

  // 302, not 301: the destination changes the day a brand switches networks, and
  // a 301 would be cached by browsers and pin buyers to the old link.
  return new Response(null, {
    status: 302,
    headers: {
      Location: resolved.url,
      // A tracking redirect must never be cached, by the CDN or the browser:
      // a cached hop is a click we never see and a link we can no longer change.
      "Cache-Control": "no-store, max-age=0",
      // Don't leak the Toxome page path onward to the network or the brand.
      "Referrer-Policy": "no-referrer",
    },
  });
}
