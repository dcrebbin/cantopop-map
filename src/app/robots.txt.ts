import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots/txt")({
  server: {
    handlers: {
      GET: async () => {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";
        const base = siteUrl.replace(/\/$/, "");
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /api/",
          "Disallow: /_build/",
          base ? `Sitemap: ${base}/sitemap.xml` : "",
          base ? `Host: ${base}` : "",
          "",
        ]
          .filter(Boolean)
          .join("\n");

        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
