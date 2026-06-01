import type { Metadata } from "next";
import HomePage from "./components/home-page";

export const metadata: Metadata = {
  title: "Cantopop Map | 粵語歌地圖 - Discover Hong Kong Song Locations 🇭🇰",
  description:
    "Explore the Cantopop Map - an interactive guide to Hong Kong locations featured in your favourite Cantonese pop songs. Discover where iconic 粵語歌 music videos were filmed and the real places behind the cantopop lyrics.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Cantopop Map | 粵語歌地圖 - Hong Kong Song Locations",
    description:
      "Explore the interactive Cantopop Map to discover Hong Kong locations from your favourite Cantonese pop songs.",
    url: "/",
  },
};

export default function Page() {
  return <HomePage />;
}
