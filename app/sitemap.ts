import type { MetadataRoute } from "next";
import { services } from "@/lib/constants";

const base = "https://archconsult.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/ai-consultant",
    "/health-check",
    "/launch-wizard",
    "/pricing",
    "/blog",
    "/contact",
    "/book-consultation",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const serviceRoutes = services.map((service) => ({
    url: `${base}/services/${service.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...serviceRoutes];
}
