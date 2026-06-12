"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = import.meta.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!posthogKey) return;

    posthog.init(posthogKey, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2025-05-24",
      capture_exceptions: true, // This enables capturing exceptions using Error Tracking
      debug: process.env.NODE_ENV === "development",
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
