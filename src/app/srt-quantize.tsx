import { createFileRoute } from "@tanstack/react-router";
import SrtQuantizePage from "./components/srt-quantize-page";

export const Route = createFileRoute("/srt-quantize")({
  head: () => ({
    meta: [
      { title: "SRT Frame Quantizer | Cantopop Map 粵語歌地圖" },
      {
        name: "description",
        content:
          "Upload SRT subtitle files and quantize cue timestamps to video frame boundaries using a custom FPS value.",
      },
      {
        property: "og:title",
        content: "SRT Frame Quantizer | Cantopop Map 粵語歌地圖",
      },
      {
        property: "og:description",
        content:
          "Snap SRT subtitle timestamps to frame boundaries for cleaner editing and playback sync.",
      },
      { property: "og:url", content: "/srt-quantize" },
    ],
    links: [{ rel: "canonical", href: "/srt-quantize" }],
  }),
  component: Page,
});

function Page() {
  return <SrtQuantizePage />;
}
