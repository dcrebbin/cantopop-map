import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { PostHogProvider } from "./components/PostHogProvider";

export const metadata: Metadata = {
  title: "Cantopop Map | 粵語歌地圖 🇭🇰",
  description: "Find the locations for your favourite cantopop songs",
  applicationName: "cantopop地圖",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "cantopop地圖",
  },
  icons: [
    { rel: "icon", url: "/images/favicon.svg" },
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
  ],
  openGraph: {
    images: ["/images/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
