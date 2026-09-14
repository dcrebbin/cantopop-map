import { createFileRoute } from "@tanstack/react-router";
import JobsPage from "./components/jobs-page";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Find Cantopop Crew | Cantopop Map" },
      {
        name: "description",
        content:
          "Discover experienced Cantopop music video crew by role and build a shortlist from verified production credits.",
      },
      { property: "og:title", content: "Find Cantopop Crew | Cantopop Map" },
      {
        property: "og:description",
        content:
          "A work-first way to discover experienced people across the Cantopop production community.",
      },
      { property: "og:url", content: "/jobs" },
    ],
    links: [{ rel: "canonical", href: "/jobs" }],
  }),
  component: JobsPage,
});
