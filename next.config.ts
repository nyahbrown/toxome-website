import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backward-compat for already-installed app versions that linked the old
  // /privacypolicy path. The canonical route is /privacy.
  async redirects() {
    return [
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
      { source: "/guide/regenerative_organic_cotton", destination: "/guide/organic_cotton#top-tier", permanent: true },
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
