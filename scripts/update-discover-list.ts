import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { LOCATIONS } from "../src/app/common/lib";
import { youtubeEmbedUrl } from "../src/app/common/jobs";
import { youtubeVideoId } from "../src/app/common/youtube-video-id";

const MAX_VIEWS = 100_000;
const MAX_CHANNEL_SUBSCRIBERS = 20_000;
const outputPath = fileURLToPath(
  new URL("../src/app/discover-video-ids.json", import.meta.url),
);

const videoIds = [
  ...new Set(
    LOCATIONS.filter(
      (location) =>
        youtubeEmbedUrl(location.url) !== null &&
        location.viewCount !== null &&
        location.viewCount <= MAX_VIEWS &&
        location.channelSubscriberCount !== null &&
        location.channelSubscriberCount < MAX_CHANNEL_SUBSCRIBERS,
    )
      .map((location) => youtubeVideoId(location.url))
      .filter((id): id is string => id !== null),
  ),
];

await writeFile(outputPath, `${JSON.stringify(videoIds, null, 2)}\n`);
console.log(`Updated ${outputPath} with ${videoIds.length} videos.`);
