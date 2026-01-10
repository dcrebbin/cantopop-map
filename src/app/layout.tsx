import "~/styles/globals.css";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { PostHogProvider } from "./components/PostHogProvider";
import { HomePageJsonLd } from "./components/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Cantopop Map | 粵語歌地圖 - Discover Hong Kong Song Locations 🇭🇰",
  description:
    "Explore the Cantopop Map - an interactive guide to Hong Kong locations featured in your favourite Cantonese pop songs. Discover where iconic 粵語歌 music videos were filmed and the real places behind the cantopop lyrics.",
  applicationName: "Cantopop Map 粵語歌地圖",
  manifest: "/manifest.json",
  keywords: [
    "cantopop map",
    "cantopop",
    "粵語歌地圖",
    "粵語歌",
    "hong kong music locations",
    "cantonese pop",
    "hk music map",
    "hong kong song locations",
    "cantopop filming locations",
    "廣東歌",
    "香港音樂地圖",
    "canto pop",
    "cantonese music",
    "hong kong cantopop",
  ],
  authors: [{ name: "Cantopop Map" }],
  creator: "Cantopop Map",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cantopop Map 粵語歌地圖",
  },
  icons: [
    { rel: "icon", url: "/images/favicon.svg" },
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
  ],
  openGraph: {
    type: "website",
    title: "Cantopop Map | 粵語歌地圖 - Hong Kong Song Locations",
    description:
      "Explore the interactive Cantopop Map to discover Hong Kong locations from your favourite Cantonese pop songs. Find where iconic music videos were filmed.",
    siteName: "Cantopop Map",
    locale: "en_HK",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cantopop Map - Interactive Hong Kong Music Location Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cantopop Map | 粵語歌地圖",
    description:
      "Discover Hong Kong locations featured in your favourite Cantonese pop songs",
    images: ["/images/og-image.png"],
  },
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "zh-HK": "/",
      "zh-Hant": "/",
      "x-default": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  category: "music",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover", // Enable safe area insets for Safari
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        <HomePageJsonLd />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
