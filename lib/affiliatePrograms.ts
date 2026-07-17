// Server-only lookup for `brand_affiliate_programs`.
//
// This exists so /out/[productId] and the pages that decide whether to LINK to
// /out resolve a brand identically. If a page thinks a brand is monetized and
// /out disagrees, the click earns nothing: /out bypasses Skimlinks (see
// lib/affiliate.ts), so a mismatch is worse than never routing there at all.
// One query, one pick, one resolve — imported by both sides.
//
// supabaseAdmin, not the anon client: this table holds publisher_id, which is
// the account credential every commission is paid against. It is not public.

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { withUtm } from "@/lib/track";
import {
  pickProgram,
  resolveAffiliateLink,
  type BrandAffiliateProgram,
  type LinkableProduct,
  type ResolvedLink,
} from "@/lib/affiliate";

const PROGRAM_COLUMNS =
  "brand, network, advertiser_id, publisher_id, network_extra, base_link, commission_rate, cookie_days, coupon_code, active";

// Case-insensitive: catalog capitalization drifts ("MATE the Label" vs "MATE The
// Label") and a program silently missing its brand is a link that silently stops
// earning. `ilike` with no wildcards is an exact, case-insensitive match.
export async function getActiveProgramsForBrand(
  brand: string
): Promise<BrandAffiliateProgram[]> {
  const { data, error } = await supabaseAdmin
    .from("brand_affiliate_programs")
    .select(PROGRAM_COLUMNS)
    .ilike("brand", brand)
    .eq("active", true);

  if (error) {
    // Never throw: callers must degrade to an ordinary outbound link, not fail
    // the page or the redirect. Losing a commission beats losing the sale.
    console.error("affiliate program fetch error:", error.message);
    return [];
  }
  return (data ?? []) as BrandAffiliateProgram[];
}

// The single resolve both /out and the product page use.
//
// UTM goes on the DESTINATION, before any network wraps it, so the brand sees
// the referral in their own GA. Tagging the wrapper instead would put utm_source
// on awin1.com and tell the brand nothing.
export async function resolveOutbound(
  product: LinkableProduct
): Promise<ResolvedLink | null> {
  const programs = await getActiveProgramsForBrand(product.brand);
  return resolveAffiliateLink(
    {
      id: product.id,
      brand: product.brand,
      item_url: product.item_url ? withUtm(product.item_url) : null,
      affiliate_url: product.affiliate_url,
    },
    pickProgram(programs)
  );
}

// What a page should put in an href.
//
// Returns "/out/<id>" ONLY when a wrapper actually applied. network:'none' means
// nothing of ours monetizes the click, and routing it through /out would strip
// the Skimlinks rewrite that currently earns on it — so those links stay direct
// merchant hrefs and Skimlinks keeps paying.
//
// This is the per-brand wiring the /out header note calls for: brands flip to
// /out as their program row lands, not all at once.
export async function outboundHrefFor(
  product: LinkableProduct
): Promise<string | null> {
  const resolved = await resolveOutbound(product);
  if (!resolved) return null;
  if (resolved.network === "none") return resolved.url;
  return `/out/${product.id}`;
}
