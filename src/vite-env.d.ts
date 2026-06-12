/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?: string;
  readonly NEXT_PUBLIC_POSTHOG_KEY?: string;
  readonly NEXT_PUBLIC_SITE_URL?: string;
  readonly SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
