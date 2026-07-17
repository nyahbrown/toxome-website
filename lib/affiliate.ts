// Outbound affiliate link generation.
//
// The rule: `products.item_url` is the source of truth for WHERE a link goes.
// This module only decides how to WRAP it. Nothing here is ever hand-pasted onto
// a product row, because 700+ hand-pasted links is 700+ rows to re-do the day a
// brand switches networks. One row in `brand_affiliate_programs` re-routes every
// product for that brand instead.
//
// The resolved link is served by /out/[productId], so a product page never bakes
// a network URL into its HTML.
//
// ── On the templates below ───────────────────────────────────────────────────
// A WRONG tracking URL is worse than no tracking URL: the click still converts,
// the buyer still buys, and the commission silently goes to nobody. So a network
// is only implemented here if its template was verified against the network's own
// documentation. Unverified networks fall through to the plain item_url (see
// UNIMPLEMENTED_NETWORKS) rather than shipping a guess.

// Skimlinks rewrites every outbound link on the site. Left alone it will also
// rewrite a DIRECT affiliate link and take that commission with it, which is the
// one thing this whole system exists to prevent. `noskim` opts an individual link
// out.
//
// `noskim` is NOT on this constant, deliberately. Opting a link out of Skimlinks
// only protects a commission when the link already carries a wrapper of its own.
// Nothing does yet: brand_affiliate_programs is empty, 0 of 733 published products
// have an affiliate_url, and no page links to /out/[productId]. So Skimlinks is
// currently the only thing earning on every outbound link, and a blanket noskim
// would take all 733 from monetized to unmonetized in one deploy.
//
// Add it back PER-LINK, not as a blanket constant — at the point where a link is
// known to be resolved (resolveAffiliateLink returned a network other than
// 'none'), as each brand's program row lands.
//
// Belt-and-braces either way: the real fix is the Network Overwrite setting plus
// the merchant exclusion list in the Sovrn dashboard. Both are manual, and neither
// is visible from here.
export const OUTBOUND_REL = "noopener noreferrer sponsored";

export type AffiliateNetwork =
  | "impact"
  | "awin"
  | "rakuten"
  | "flexoffers"
  | "partnerize"
  | "refersion"
  | "uppromote"
  | "direct";

// A row of `brand_affiliate_programs`.
export type BrandAffiliateProgram = {
  brand: string;
  network: string;
  advertiser_id: string | null;
  publisher_id: string | null;
  network_extra: Record<string, unknown> | null;
  base_link: string | null;
  commission_rate: number | null;
  cookie_days: number | null;
  coupon_code: string | null;
  active: boolean;
};

// Just enough of a product row to build a link.
export type LinkableProduct = {
  id: string;
  brand: string;
  item_url: string | null;
  affiliate_url: string | null;
};

// Networks we can name but deliberately do NOT build a link for. Listed
// explicitly so a program row for one of these degrades to the item_url
// (Skimlinks floor) and says so, instead of being silently ignored as an
// unknown string.
//
// - flexoffers: no trustworthy public template. FlexOffers' own docs say deep
//   linking is not even available on every advertiser ("Not all advertisers
//   allow deep linking" — it's gated per-advertiser behind a Flexlinks-Enabled
//   flag), the tracking domain is ambiguous between track.flexlinks.com and
//   track.flexlinkspro.com across sources of different ages, and the
//   foid/foc/fot/fos params are defined in no doc we could find. FlexOffers
//   expects you to use its Deep Link Generator per advertiser.
// - partnerize: the path-segment shape (prf.hn/click/camref:…/destination:…) IS
//   documented, but whether `destination:` must be percent-encoded is NOT, and
//   that is exactly the detail that decides whether a product URL carrying a
//   `?variant=` query string survives the redirect. Legacy Pepperjam/Ascend
//   (pjatr.com / pjtra.com) is a different, undocumented format again.
//
// For BOTH: if we ever join them, generate the link in their dashboard tool and
// store it per-product on products.affiliate_url, or per-brand as base_link with
// network='direct'. Do not template these by hand off a reconstructed spec.
const UNIMPLEMENTED_NETWORKS = new Set(["flexoffers", "partnerize"]);

function encode(url: string): string {
  return encodeURIComponent(url);
}

// Impact tracking links are per-publisher-account, not per-brand: the domain and
// the ad/campaign ids all come from the partner dashboard.
//
// VERIFIED against help.impact.com "Create a Deep Link for an Ad" and "Tracking
// Link Parameters Explained":
//   https://<tracking-domain>/c/<media-partner-id>/<ad-id>/<campaign-id>?u=<encoded>
// Segment order is publisher -> ad -> campaign (confirmed on both pages). `u` is
// the deep-link param and the docs require it percent-encoded. `subId1` is the
// partner-only sub-id (alphanumeric, <=255 chars).
function impactLink(
  program: BrandAffiliateProgram,
  destination: string,
  subId: string
): string | null {
  const extra = program.network_extra ?? {};
  const domain = str(extra.tracking_domain);
  const adId = str(extra.ad_id);
  const campaignId = program.advertiser_id; // Impact calls the brand's program a "campaign"
  const publisherId = program.publisher_id;

  // Every segment is load-bearing. A link missing one is not a degraded link,
  // it is a 404 or an untracked click, so refuse to build it.
  if (!domain || !adId || !campaignId || !publisherId) return null;

  const base = `https://${domain}/c/${publisherId}/${adId}/${campaignId}`;
  // subId1 is documented as alphanumeric; strip the UUID's hyphens rather than
  // find out the hard way that they are dropped somewhere in Impact's reporting.
  return `${base}?u=${encode(destination)}&subId1=${subId.replace(/-/g, "")}`;
}

// VERIFIED against success.awin.com "What does an affiliate link look like?":
//   https://www.awin1.com/cread.php?awinmid=<advertiser>&awinaffid=<publisher>&ued=<encoded>
// awin1.com is the tracking domain for ALL advertisers (unlike Impact), so only
// the two ids vary. `ued` is the deep-link param and takes an encoded URL.
//
// `clickref` is the sub-id: max 50 chars, and Awin prohibits `# + " ; & | '` in
// the value. A product UUID is lowercase hex + hyphens (36 chars), so it is
// already inside both limits.
//
// NOT included: `platform=dl`, which shows up in Awin links captured in the wild
// but appears in none of Awin's own docs. It looks like something their Link
// Builder appends, not something a publisher must add. Left off deliberately —
// see the report; confirm against a real Link Builder link before adding it.
function awinLink(
  program: BrandAffiliateProgram,
  destination: string,
  subId: string
): string | null {
  const awinmid = program.advertiser_id;
  const awinaffid = program.publisher_id;
  if (!awinmid || !awinaffid) return null;

  return (
    `https://www.awin1.com/cread.php?awinmid=${encodeURIComponent(awinmid)}` +
    `&awinaffid=${encodeURIComponent(awinaffid)}` +
    `&clickref=${encodeURIComponent(subId)}` +
    `&ued=${encode(destination)}`
  );
}

// VERIFIED against Rakuten's Publisher Help Center "Create Deep Links Manually":
//   https://click.linksynergy.com/deeplink?id=<publisher>&mid=<merchant>&murl=<encoded>
// `id` is the publisher's 11-char, CASE-SENSITIVE affiliate id; `mid` is the
// merchant id; `murl` is the destination and the docs require it percent-encoded.
//
// `u1` is Rakuten's sub-id, but unlike Impact's subId1 and Awin's clickref it is
// only available to publishers enabled for "Signature" tracking. So it is opt-in
// via network_extra.u1_enabled rather than always-on: sending u1 on an account
// that isn't Signature-enabled is untested, and an untested param on the link
// that carries the money is not worth the convenience.
function rakutenLink(
  program: BrandAffiliateProgram,
  destination: string,
  subId: string
): string | null {
  const id = program.publisher_id;
  const mid = program.advertiser_id;
  if (!id || !mid) return null;

  let url =
    `https://click.linksynergy.com/deeplink?id=${encodeURIComponent(id)}` +
    `&mid=${encodeURIComponent(mid)}` +
    `&murl=${encode(destination)}`;

  if (program.network_extra?.u1_enabled === true) {
    url += `&u1=${encodeURIComponent(subId)}`;
  }
  return url;
}

// VERIFIED against the live merchant (wayvewear.com, 2026-07-16) rather than a
// doc, because UpPromote publishes no publisher-facing link spec.
//
// UpPromote is a per-merchant Shopify app, not a network: there is no wrapper
// domain and no encoding step. `sca_ref` is an ordinary query param appended to
// any URL on the merchant's own domain, so a product link IS buildable and the
// store-level base_link below is not the only option.
//
// Confirmed end-to-end on the hardest row in the catalog — `/products/quad-short
// ?variant=50828305236252`, a stale handle that already carries its own query
// string:
//   - Shopify 301'd the stale handle to /products/quad-short-natural-fiber-short
//   - sca_ref survived the redirect, and so did `variant`
//   - UpPromote set its attribution cookies crediting the publisher id
// So stale item_urls are safe here, and `?`-vs-`&` is handled by URL/searchParams
// rather than string concatenation.
//
// `sca_source` is UpPromote's own sub-id: it segments the affiliate dashboard by
// surface, which is what lets us later show a brand which Toxome surface drove
// their revenue. Optional — omitted when network_extra doesn't configure it.
//
// Do NOT paste the link UpPromote's own "Get product link" tool emits. It
// prepends the affiliate's source as utm_source/utm_medium and then appends the
// merchant's program defaults on top, so the URL carries utm_source TWICE
// (verified: `utm_source=toxome.app` and `utm_source=wayve_collective` in one
// link). Which one wins is parser-dependent, so the brand's GA may credit their
// own program instead of Toxome. Composing here keeps exactly one of each.
function uppromoteLink(
  program: BrandAffiliateProgram,
  destination: string
): string | null {
  const ref = program.publisher_id;
  if (!ref) return null;

  const extra = program.network_extra ?? {};
  const refParam = str(extra.ref_param) ?? "sca_ref";
  const sourceParam = str(extra.source_param);
  const sourceValue = str(extra.source_value);

  try {
    const u = new URL(destination);
    // set(), not append(): destination already carries utm_source/utm_medium from
    // withUtm, and a second copy of any param is the exact bug described above.
    u.searchParams.set(refParam, ref);
    if (sourceParam && sourceValue) u.searchParams.set(sourceParam, sourceValue);
    return u.toString();
  } catch {
    // Malformed item_url: fall through to the caller's degrade path rather than
    // hand back a half-built link.
    return null;
  }
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// A brand can genuinely carry more than one active program: Lilysilk, MATE and
// Allbirds are each on both Awin and Impact, and UNIQUE(brand, network) permits
// exactly that. So the pick has to be deliberate, not "whatever row Postgres
// hands back first".
//
// Owned deals rank above networks on purpose. That is the whole thesis of the
// sprint: a direct relationship carries a better rate and an attributed code,
// and a code is the only thing that proves Toxome drove a sale once Safari has
// blocked the cookie. A network default is the fallback, never the preference.
const NETWORK_PREFERENCE: string[] = [
  "direct",
  "refersion",
  "uppromote",
  "impact",
  "awin",
  "rakuten",
];

export function pickProgram(
  programs: BrandAffiliateProgram[]
): BrandAffiliateProgram | null {
  const active = programs.filter((p) => p.active);
  if (!active.length) return null;

  return (
    active
      .map((p) => {
        const rank = NETWORK_PREFERENCE.indexOf(p.network.toLowerCase().trim());
        // An unrecognized network sorts last rather than first: it resolves to
        // the item_url anyway, so it must never shadow a program we can build.
        return { p, rank: rank === -1 ? NETWORK_PREFERENCE.length : rank };
      })
      .sort((a, b) => a.rank - b.rank)[0]?.p ?? null
  );
}

export type ResolvedLink = {
  url: string;
  // Which wrapper actually applied. 'none' means we fell through to item_url and
  // Skimlinks is the only thing monetizing the click.
  network: AffiliateNetwork | "none";
};

// Given a product and its brand's program (or null), return the URL to send a
// buyer to. Never throws and never returns an empty URL when the product has an
// item_url: a broken program row must degrade to an ordinary product link, not
// to a dead end for the buyer.
export function resolveAffiliateLink(
  product: LinkableProduct,
  program: BrandAffiliateProgram | null
): ResolvedLink | null {
  const destination = product.item_url;

  // A link hand-set on the product row wins over the brand's program: it is how
  // a one-off (a single negotiated product link, a landing page for one item)
  // overrides the generated default.
  if (product.affiliate_url) {
    return { url: product.affiliate_url, network: "direct" };
  }

  if (!destination) return null;

  // No program, inactive program, or a network we can't build for: hand back the
  // plain product URL so the buyer still reaches the brand.
  //
  // network:'none' means NOBODY is paid for this click once it is served through
  // /out — Skimlinks only earns on a link the browser follows itself. Callers
  // should treat 'none' as a reason not to route through /out at all, not as a
  // monetized floor.
  if (!program || !program.active) return { url: destination, network: "none" };

  const network = program.network.toLowerCase().trim();
  if (UNIMPLEMENTED_NETWORKS.has(network)) {
    return { url: destination, network: "none" };
  }

  switch (network) {
    case "impact": {
      const url = impactLink(program, destination, product.id);
      return url ? { url, network: "impact" } : { url: destination, network: "none" };
    }
    case "awin": {
      const url = awinLink(program, destination, product.id);
      return url ? { url, network: "awin" } : { url: destination, network: "none" };
    }
    case "rakuten": {
      const url = rakutenLink(program, destination, product.id);
      return url ? { url, network: "rakuten" } : { url: destination, network: "none" };
    }
    // UpPromote appends its ref to the merchant's own product URL, so unlike
    // refersion/direct below there IS a template and the buyer keeps the product
    // they clicked. Degrades to base_link (store-level) only if publisher_id is
    // missing or item_url won't parse — a homepage landing still converts, a
    // half-built link does not.
    case "uppromote": {
      const url = uppromoteLink(program, destination);
      if (url) return { url, network: "uppromote" };
      const base = str(program.base_link);
      return base
        ? { url: base, network: "uppromote" }
        : { url: destination, network: "none" };
    }
    // Refersion is a per-merchant app where the merchant issues a finished link
    // and there is no template to build. Whatever they gave us is stored in
    // base_link and used as-is.
    //
    // NOTE these are usually STORE-level links, which land the buyer on the
    // brand's homepage and throw away the product they clicked. Use the tool's
    // own per-product link generator and store that per-product link on
    // products.affiliate_url instead, which is checked above. A homepage link
    // converts far worse than a product link.
    case "refersion":
    case "direct": {
      const base = str(program.base_link);
      if (!base) return { url: destination, network: "none" };
      return { url: base, network: network as AffiliateNetwork };
    }
    default:
      // Unknown network string: degrade to the product URL rather than guess.
      return { url: destination, network: "none" };
  }
}
