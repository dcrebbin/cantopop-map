import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "~/app/common/seo";

// AI search and assistant crawlers are listed by name so the welcome is
// explicit, even for bots that only honour their own user-agent group.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "MistralAI-User",
  "CCBot",
];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const rules = ["Allow: /", "Disallow: /api/", "Disallow: /_build/"];
        const body = [
          "User-agent: *",
          ...rules,
          "",
          ...AI_CRAWLERS.map((bot) => `User-agent: ${bot}`),
          ...rules,
          "",
          `Sitemap: ${SITE_URL}/sitemap.xml`,
          "",
        ].join("\n");

        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
