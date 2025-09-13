import type { MetadataRoute } from "next";
import { nameToLocation } from "~/app/common/locations";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";

  const base = siteUrl.replace(/\/$/, "");

  const now = new Date();

  const root: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const locationEntries: MetadataRoute.Sitemap = Object.keys(
    nameToLocation,
  ).map((slug) => ({
    url: `${base}/locations/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...root, ...locationEntries];
}
