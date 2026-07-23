import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backward-compat for already-installed app versions that linked the old
  // /privacypolicy path. The canonical route is /privacy.
  async redirects() {
    return [
      // Vanity short-link for the founding-partner kit sent to prospective
      // brands. Temporary (307) so the destination can be re-pointed later
      // without browsers caching a permanent redirect.
      { source: "/kit", destination: "/partners/founding-kit.html", permanent: false },
      { source: "/privacypolicy", destination: "/privacy", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      // Elastane and spandex are the same fiber; merged into one page at /guide/elastane.
      { source: "/guide/spandex", destination: "/guide/elastane", permanent: true },
      // Rayon and viscose are the same fiber, and running a page for each split
      // the signal: Google suppressed /guide/viscose to 0 impressions while
      // /guide/rayon carried 1,637 on thinner copy. Merged at the URL that
      // already ranks, keeping viscose's richer body (heroStat, enviro tiles,
      // ethics). Same shape as the spandex merge above.
      { source: "/guide/viscose", destination: "/guide/rayon", permanent: true },
      // Regenerative organic is the top tier of the same fiber; folded into the
      // organic cotton page so the ranking signal consolidates instead of two
      // near-duplicate cotton pages competing.
      { source: "/guide/regenerative_organic_cotton", destination: "/guide/organic-cotton#top-tier", permanent: true },
      { source: "/guide/regenerative-organic-cotton", destination: "/guide/organic-cotton#top-tier", permanent: true },
      // Fiber guide URLs renamed off their data keys. Two reasons: Google reads
      // "_" as a word joiner rather than a separator, so "tencel_lyocell"
      // tokenized as one blob; and the lyocell page was named after the
      // trademark while the searched term, and the term competitors rank for,
      // is the material. The score keys in lib/fiber-scores.json intentionally
      // did NOT move (they are mirrored to the app, extension, and Firebase);
      // see FiberGuideEntry.scoreKey.
      { source: "/guide/tencel_lyocell", destination: "/guide/lyocell", permanent: true },
      { source: "/guide/tencel-lyocell", destination: "/guide/lyocell", permanent: true },
      { source: "/guide/tencel", destination: "/guide/lyocell", permanent: true },
      { source: "/guide/organic_cotton", destination: "/guide/organic-cotton", permanent: true },
      { source: "/guide/merino_wool", destination: "/guide/merino-wool", permanent: true },
      // /journal/what-is-ecovero and /guide/ecovero were the same article written
      // twice, and Search Console shows them cannibalizing on ~22 shared queries:
      // the journal held "what is ecovero" (202 impressions, pos 7.4) while the
      // guide sat at pos 32.75 on the same query, and the guide held "is lenzing
      // ecovero viscose toxic" (141, pos 4.5) while the journal trailed. ~1,220
      // impressions across both, 9 clicks. Merged into the guide, not the journal:
      // the guide is the systematic per-fiber page (every fiber has one), its FAQ
      // already answers every query the journal ranked for, and its title template
      // is answer-first ("Is X Toxic or Safe? Health Score N/100"). The journal was
      // the anomaly — it was the only "what is [fiber]" piece in a Journal that is
      // otherwise comparisons and news. Same reasoning as the viscose→rayon merge.
      { source: "/journal/what-is-ecovero", destination: "/guide/ecovero", permanent: true },
      // The old /compare/* fiber-comparison pages were retired and their content
      // moved into Journal articles. 301 the URLs Google still has indexed so the
      // ranking signal (modal-vs-viscose pulled 100+ impressions) is reclaimed
      // instead of leaking to a 404.
      { source: "/compare/modal-vs-viscose", destination: "/journal/modal-vs-viscose", permanent: true },
      { source: "/compare/polyester-vs-nylon", destination: "/journal/polyester-vs-cotton", permanent: true },
      { source: "/compare", destination: "/journal", permanent: true },
      { source: "/compare/:path*", destination: "/journal", permanent: true },
      // Cashmere and merino each shipped as two collections with the same match()
      // and the same heading, so they cannibalized each other. Merged into the
      // shorter slugs (the only two with any impressions in Search Console) and
      // kept the richer copy from the -clothing versions.
      {
        source: "/shop/collection/non-toxic-cashmere-clothing",
        destination: "/shop/collection/non-toxic-cashmere",
        permanent: true,
      },
      {
        source: "/shop/collection/non-toxic-merino-wool-clothing",
        destination: "/shop/collection/non-toxic-merino-wool",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
