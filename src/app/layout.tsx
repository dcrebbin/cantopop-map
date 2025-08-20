import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { PostHogProvider } from "./components/PostHogProvider";

export const metadata: Metadata = {
  title: "Cantopop Map | 粵語歌地圖 🇭🇰",
  description: "Find the locations for your favourite cantopop songs",
  icons: [{ rel: "icon", url: "/images/favicon.svg" }],
  openGraph: {
    images: ["/images/og-image.png"],
  },
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
