import { createFileRoute } from "@tanstack/react-router";
import { nameToLocation } from "~/app/common/locations";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";
        const base = siteUrl.replace(/\/$/, "");
        const now = new Date().toISOString();
        const urls = [
          { url: `${base}/`, priority: "1" },
          ...Object.keys(nameToLocation).map((slug) => ({
            url: `${base}/locations/${encodeURIComponent(slug)}`,
            priority: "0.8",
          })),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

        return new Response(body, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
