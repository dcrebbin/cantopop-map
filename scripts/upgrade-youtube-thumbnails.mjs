import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const locationsPath = fileURLToPath(
  new URL("../src/app/common/locations.ts", import.meta.url),
);
const youtubeImagePropertyPattern =
  /^(\s*)image: "(https:\/\/i\.ytimg\.com\/vi\/([A-Za-z0-9_-]+)\/[^"\s]+?\.(?:jpg|webp))",(?:\n\1highResImage: "[^"]+",)?/gm;
const qualities = [
  "maxresdefault",
  "hq720",
  "sddefault",
  "hqdefault",
  "mqdefault",
];
const concurrency = 12;
const checkOnly = process.argv.includes("--check");

function readJpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);

  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > buffer.length) return null;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length)
      return null;

    if (startOfFrameMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

async function fetchThumbnail(videoId, quality) {
  const url = `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  const size = readJpegSize(buffer);
  if (!size || (size.width === 120 && size.height === 90)) return null;

  return { url, ...size };
}

async function findBestThumbnail(videoId) {
  for (const quality of qualities) {
    try {
      const thumbnail = await fetchThumbnail(videoId, quality);
      if (thumbnail) return thumbnail;
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") continue;
      throw error;
    }
  }

  return null;
}

async function mapWithConcurrency(items, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

const source = await readFile(locationsPath, "utf8");
const matches = [...source.matchAll(youtubeImagePropertyPattern)];
const videoIds = [...new Set(matches.map((match) => match[3]))];

console.log(`Checking ${videoIds.length} unique YouTube thumbnails...`);
const resolved = await mapWithConcurrency(videoIds, async (videoId, index) => {
  const thumbnail = await findBestThumbnail(videoId);
  const progress = `${index + 1}/${videoIds.length}`;
  console.log(
    thumbnail
      ? `${progress} ${videoId}: ${thumbnail.width}x${thumbnail.height}`
      : `${progress} ${videoId}: no usable thumbnail`,
  );
  return [videoId, thumbnail];
});

const thumbnailByVideoId = new Map(resolved);
let changedCount = 0;
const updatedSource = source.replace(
  youtubeImagePropertyPattern,
  (currentProperties, indentation, imageUrl, videoId) => {
    const thumbnail = thumbnailByVideoId.get(videoId);
    if (!thumbnail) return currentProperties;

    const nextProperties = `${indentation}image: "${imageUrl}",\n${indentation}highResImage: "${thumbnail.url}",`;
    if (nextProperties === currentProperties) return currentProperties;

    changedCount += 1;
    return nextProperties;
  },
);

if (!checkOnly && changedCount > 0) {
  await writeFile(locationsPath, updatedSource, "utf8");
}

console.log(
  checkOnly
    ? `${changedCount} highResImage values can be added or updated.`
    : `Added or updated ${changedCount} highResImage values.`,
);

if (checkOnly && changedCount > 0) process.exitCode = 1;
