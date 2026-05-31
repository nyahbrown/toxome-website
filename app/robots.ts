import type { MetadataRoute } from "next";

const BASE_URL = "https://toxome.app";

// Allow crawling of all public, indexable content. Block private/app-only
// surfaces that have no SEO value (account dashboard, admin, auth, API).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/login", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
