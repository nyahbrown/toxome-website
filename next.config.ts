import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backward-compat for already-installed app versions that linked the old
  // /privacypolicy path. The canonical route is /privacy.
  async redirects() {
    return [
      { source: "/privacypolicy", destination: "/privacy", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
    ];
  },
};

export default nextConfig;
