import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { withUtm } from "@/lib/track";
import {
  pickProgram,
  resolveAffiliateLink,
  type BrandAffiliateProgram,
} from "@/lib/affiliate";

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
// ⚠ NOT WIRED, on purpose. No page links here yet, and routing a click through
// this door BYPASSES SKIMLINKS: Skimlinks rewrites merchant hrefs in the DOM
// client-side, and a same-origin /out link gives its script nothing to recognize,
// so the 302 to the brand happens where Skimlinks can never see it. That is fine
// for a brand with a program row (we wrapped the link ourselves and earn more) and
// a straight revenue loss for one without (Skimlinks was the only earner).
//
// brand_affiliate_programs is currently EMPTY, so wiring every buy button here
// today would take all 733 published products from monetized to unmonetized.
// Wire it per brand as each program row lands, not all at once.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROGRAM_COLUMNS =
  "brand, network, advertiser_id, publisher_id, network_extra, base_link, commission_rate, cookie_days, coupon_code, active";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  // Shape-check before touching the database: /out/<junk> is a bot, not a buyer.
  if (!UUID_RE.test(productId)) {
    return new Response("Not found", { status: 404 });
  }

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

  // Case-insensitive: catalog capitalization drifts ("MATE the Label" vs "MATE
  // The Label") and a program silently missing its brand is a link that silently
  // stops earning. `ilike` with no wildcards is an exact, case-insensitive match.
  const { data: programs, error: programError } = await supabaseAdmin
    .from("brand_affiliate_programs")
    .select(PROGRAM_COLUMNS)
    .ilike("brand", product.brand)
    .eq("active", true);

  if (programError) {
    // A program lookup failure must not cost the sale. Fall through with no
    // program: the buyer still reaches the brand and buys. The commission on that
    // click is lost (nothing wraps it, and Skimlinks can't see a server redirect
    // — see the header note), but a dead end would lose the sale itself.
    console.error("outbound program fetch error:", programError.message);
  }

  const program = pickProgram((programs ?? []) as BrandAffiliateProgram[]);

  // UTM goes on the DESTINATION, before the network wraps it, so the brand sees
  // the referral in their own GA. Tagging the wrapper instead would put
  // utm_source on awin1.com and tell the brand nothing.
  const resolved = resolveAffiliateLink(
    {
      id: product.id,
      brand: product.brand,
      item_url: product.item_url ? withUtm(product.item_url) : null,
      affiliate_url: product.affiliate_url,
    },
    program
  );

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
