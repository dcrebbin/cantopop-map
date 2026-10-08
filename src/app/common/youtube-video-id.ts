export function youtubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./, "");
    if (hostname === "youtu.be") {
      return url.pathname.split("/").find(Boolean) ?? null;
    }
    if (hostname !== "youtube.com" && !hostname.endsWith(".youtube.com")) {
      return null;
    }
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const [kind, id] = url.pathname.split("/").filter(Boolean);
    return kind && ["embed", "live", "shorts"].includes(kind) ? id ?? null : null;
  } catch {
    return null;
  }
}
