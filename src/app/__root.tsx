import {
  createRootRoute,
  isNotFound,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { PostHogProvider } from "./components/PostHogProvider";
import { SwCleanup } from "./components/sw-cleanup";
import appCss from "~/styles/globals.css?url";
import ReactScan from "./components/react-scan";
import { DirectoryPage } from "./components/directory-page";

import { SITE_URL as siteUrl } from "./common/seo";

export const Route = createRootRoute({
  head: ({ matches }) => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: "#e8eaed" },
      {
        title:
          "粵語歌地圖｜廣東歌 MV 拍攝地點・香港及海外取景地 | Cantopop Map",
      },
      {
        name: "description",
        content:
          "想知廣東歌 MV 喺邊度拍？粵語歌地圖收錄香港及海外的音樂錄像拍攝地點、街景、歌手及製作名單。Discover Cantopop music video filming locations and credits.",
      },
      { name: "application-name", content: "Cantopop Map 粵語歌地圖" },
      { name: "author", content: "Cantopop Map" },
      { name: "creator", content: "Cantopop Map" },
      {
        name: "keywords",
        content:
          "cantopop map,cantopop,粵語歌地圖,粵語歌,hong kong music locations,cantonese pop,hk music map,hong kong song locations,cantopop filming locations,廣東歌,香港音樂地圖,canto pop,cantonese music,hong kong cantopop",
      },
      {
        name: "robots",
        content: matches.some(
          (match) =>
            match.status === "notFound" ||
            match._notFound === true ||
            isNotFound(match.error),
        )
          ? "noindex, follow"
          : "index, follow",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "粵語歌地圖｜廣東歌 MV 拍攝地點 | Cantopop Map",
      },
      {
        property: "og:description",
        content:
          "探索廣東歌 MV 在香港及海外的取景地，查看街景、音樂錄像與製作名單。Explore Cantopop music video filming locations.",
      },
      { property: "og:site_name", content: "Cantopop Map" },
      { property: "og:locale", content: "zh_HK" },
      { property: "og:locale:alternate", content: "en_HK" },
      { property: "og:image", content: `${siteUrl}/images/og-image.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Cantopop Map - Interactive Hong Kong Music Location Guide",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cantopop Map | 粵語歌地圖" },
      {
        name: "twitter:description",
        content:
          "探索廣東歌 MV 香港及海外拍攝地點。Discover Cantopop filming locations.",
      },
      { name: "twitter:image", content: `${siteUrl}/images/og-image.png` },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Cantopop Map 粵語歌地圖",
      },
      ...(siteUrl ? [{ property: "og:url", content: siteUrl }] : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/images/favicon.svg" },
      { rel: "apple-touch-icon", href: "/icons/icon-192x192.png" },
    ],
  }),
  errorComponent: RootError,
  notFoundComponent: NotFoundPage,
  component: RootLayout,
});

function NotFoundPage() {
  return (
    <DirectoryPage title="找不到此頁面 · Page not found">
      <p>這個連結可能已更改，或尚未收錄。</p>
      <p lang="en">This page could not be found.</p>
      <a href="/browse" className="underline">
        瀏覽歌曲及拍攝地點 · Browse songs and locations
      </a>
    </DirectoryPage>
  );
}

function RootError({ error }: { error: unknown }) {
  return (
    <html lang="zh-Hant-HK">
      <head>
        <title>Cantopop Map | Error</title>
      </head>
      <body className="bg-[#e8eaed] p-6 font-sans text-black">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm">
          {error instanceof Error ? error.message : "Unable to load this page."}
        </p>
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <html lang="zh-Hant-HK">
      <head>
        <HeadContent />
      </head>
      <body>
        <SwCleanup />
        <PostHogProvider>
          <ReactScan />
          <Outlet />
        </PostHogProvider>
        <Scripts />
      </body>
    </html>
  );
}
