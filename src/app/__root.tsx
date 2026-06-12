import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { HomePageJsonLd } from "./components/JsonLd";
import { PostHogProvider } from "./components/PostHogProvider";
import { SwCleanup } from "./components/sw-cleanup";
import appCss from "~/styles/globals.css?url";

const siteUrl =
  import.meta.env.NEXT_PUBLIC_SITE_URL ?? import.meta.env.SITE_URL;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#e8eaed" },
      { title: "Cantopop Map | 粵語歌地圖 - Discover Hong Kong Song Locations 🇭🇰" },
      {
        name: "description",
        content:
          "Explore the Cantopop Map - an interactive guide to Hong Kong locations featured in your favourite Cantonese pop songs. Discover where iconic 粵語歌 music videos were filmed and the real places behind the cantopop lyrics.",
      },
      { name: "application-name", content: "Cantopop Map 粵語歌地圖" },
      { name: "author", content: "Cantopop Map" },
      { name: "creator", content: "Cantopop Map" },
      { name: "keywords", content: "cantopop map,cantopop,粵語歌地圖,粵語歌,hong kong music locations,cantonese pop,hk music map,hong kong song locations,cantopop filming locations,廣東歌,香港音樂地圖,canto pop,cantonese music,hong kong cantopop" },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Cantopop Map | 粵語歌地圖 - Hong Kong Song Locations" },
      {
        property: "og:description",
        content:
          "Explore the interactive Cantopop Map to discover Hong Kong locations from your favourite Cantonese pop songs. Find where iconic music videos were filmed.",
      },
      { property: "og:site_name", content: "Cantopop Map" },
      { property: "og:locale", content: "en_HK" },
      { property: "og:image", content: "/images/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Cantopop Map - Interactive Hong Kong Music Location Guide" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cantopop Map | 粵語歌地圖" },
      { name: "twitter:description", content: "Discover Hong Kong locations featured in your favourite Cantonese pop songs" },
      { name: "twitter:image", content: "/images/og-image.png" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Cantopop Map 粵語歌地圖" },
      ...(siteUrl ? [{ property: "og:url", content: siteUrl }] : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/images/favicon.svg" },
      { rel: "apple-touch-icon", href: "/icons/icon-192x192.png" },
      { rel: "canonical", href: "/" },
      { rel: "alternate", hrefLang: "en", href: "/" },
      { rel: "alternate", hrefLang: "zh-HK", href: "/" },
      { rel: "alternate", hrefLang: "zh-Hant", href: "/" },
      { rel: "alternate", hrefLang: "x-default", href: "/" },
    ],
  }),
  errorComponent: RootError,
  component: RootLayout,
});

function RootError({ error }: { error: Error }) {
  return (
    <html lang="en">
      <head>
        <title>Cantopop Map | Error</title>
      </head>
      <body className="bg-[#e8eaed] p-6 font-sans text-black">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm">{error.message}</p>
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <HomePageJsonLd />
      </head>
      <body>
        <SwCleanup />
        <PostHogProvider>
          <Outlet />
        </PostHogProvider>
        <Scripts />
      </body>
    </html>
  );
}
