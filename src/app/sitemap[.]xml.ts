import { createFileRoute } from "@tanstack/react-router";
import { LOCATIONS } from "~/app/common/lib";
import {
  ARTIST_INDEX,
  PEOPLE_INDEX,
  absoluteUrl,
  artistPath,
  locationPath,
  personPath,
} from "~/app/common/seo";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = [
          { url: absoluteUrl("/"), priority: "1" },
          { url: absoluteUrl("/browse"), priority: "0.9" },
          { url: absoluteUrl("/leaderboard"), priority: "0.5" },
          ...LOCATIONS.map((location) => ({
            url: absoluteUrl(locationPath(location)),
            priority: "0.8",
          })),
          ...[...ARTIST_INDEX.values()].map((artist) => ({
            url: absoluteUrl(artistPath(artist.name)),
            priority: "0.7",
          })),
          ...[...PEOPLE_INDEX.values()].map((person) => ({
            url: absoluteUrl(personPath(person.name)),
            priority: "0.5",
          })),
        ];
        const unique = [
          ...new Map(urls.map((entry) => [entry.url, entry])).values(),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
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
