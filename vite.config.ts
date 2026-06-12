import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  server: {
    port: 3000,
    watch: {
      ignored: ["**/.output/**", "**/node_modules/**", "**/.git/**"],
    },
    proxy: {
      "/ingest/static": {
        target: "https://us-assets.i.posthog.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ingest\/static/, "/static"),
      },
      "/ingest": {
        target: "https://us.i.posthog.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ingest/, ""),
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
      router: {
        routesDirectory: "app",
        routeFileIgnorePattern: "^(components|common|hooks|_state)$",
      },
    }),
    viteReact(),
    nitro({
      routeRules: {
        "/ingest/static/**": {
          proxy: "https://us-assets.i.posthog.com/static/**",
        },
        "/ingest/**": {
          proxy: "https://us.i.posthog.com/**",
        },
      },
    }),
  ],
});
