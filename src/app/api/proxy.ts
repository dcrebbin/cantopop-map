import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const response = await fetch(request.url);
        return new Response(response.body, {
          headers: {
            "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
          },
        });
      },
    },
  },
});
