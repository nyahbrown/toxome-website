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
    ];
  },
};

export default nextConfig;
