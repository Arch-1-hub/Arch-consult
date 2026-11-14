import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api", "/account", "/sandbox/unsubscribe"],
      },
    ],
    sitemap: "https://archbrandingconsult.online/sitemap.xml",
  };
}
