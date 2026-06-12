import { createFileRoute } from "@tanstack/react-router";
import DynamicHomePage from "./components/dynamic-home-page";

export const Route = createFileRoute("/")({
  component: Page,
});

function Page() {
  return <DynamicHomePage />;
}
