import { spawn } from "node:child_process";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const defaults = {
  locations: resolve(projectRoot, "src/app/common/locations.ts"),
  checkpoint: resolve(projectRoot, ".cache/youtube-view-counts.json"),
  provider: "yt-dlp",
  batchSize: 10,
  batchDelaySeconds: 10,
  requestDelaySeconds: 1.5,
  concurrency: 3,
  executable: resolve(projectRoot, "modules/yt-dlp"),
};

function usage() {
  return `Usage: npm run views:update -- [options]

Options:
  --check                       Fetch counts without modifying locations.ts
  --provider <yt-dlp|scrape>    Retrieval method (default: yt-dlp)
  --batch-size <count>          Videos checkpointed per batch (default: 10)
  --batch-delay <seconds>       Pause between batches (default: 10)
  --request-delay <seconds>     Minimum pause between video requests (default: 1.5)
  --concurrency <count>         Parallel yt-dlp workers (default: 3)
  --cookies-from-browser <name> Pass a browser cookie store to yt-dlp
  --locations <path>            Override the locations source file
  --checkpoint <path>           Override the resumable checkpoint file
  --yt-dlp <path>               Override ./modules/yt-dlp
  --help                        Show this help

The checkpoint is removed after a successful run. If a run is interrupted or a
video temporarily fails, rerun the same command to continue with only the missing
videos.`;
}

function parsePositiveNumber(value, option, { integer = false } = {}) {
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    (integer && !Number.isInteger(number))
  ) {
    throw new Error(
      `${option} must be a positive ${integer ? "integer" : "number"}`,
    );
  }
  return number;
}

function parseNonnegativeNumber(value, option) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${option} must be a nonnegative number`);
  }
  return number;
}

function parseArgs(argv) {
  const options = { ...defaults, check: false, cookiesFromBrowser: null };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--"))
        throw new Error(`${argument} needs a value`);
      index += 1;
      return value;
    };

    switch (argument) {
      case "--check":
        options.check = true;
        break;
      case "--provider":
        options.provider = next();
        if (!["scrape", "yt-dlp"].includes(options.provider)) {
          throw new Error(`${argument} must be scrape or yt-dlp`);
        }
        break;
      case "--batch-size":
        options.batchSize = parsePositiveNumber(next(), argument, {
          integer: true,
        });
        break;
      case "--batch-delay":
        options.batchDelaySeconds = parseNonnegativeNumber(next(), argument);
        break;
      case "--request-delay":
        options.requestDelaySeconds = parsePositiveNumber(next(), argument);
        break;
      case "--concurrency":
        options.concurrency = parsePositiveNumber(next(), argument, {
          integer: true,
        });
        break;
      case "--cookies-from-browser":
        options.cookiesFromBrowser = next();
        break;
      case "--locations":
        options.locations = resolve(next());
        break;
      case "--checkpoint":
        options.checkpoint = resolve(next());
        break;
      case "--yt-dlp":
        options.executable = next();
        break;
      case "--help":
        console.log(usage());
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${argument}\n\n${usage()}`);
    }
  }

  return options;
}

function getYouTubeVideoId(rawUrl) {
  const url = new URL(rawUrl);
  const hostname = url.hostname.replace(/^www\./, "");

  if (hostname === "youtu.be")
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (hostname !== "youtube.com" && !hostname.endsWith(".youtube.com"))
    return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");

  const [kind, videoId] = url.pathname.split("/").filter(Boolean);
  return ["embed", "live", "shorts"].includes(kind) ? (videoId ?? null) : null;
}

function findLocationVideos(source) {
  const urlPropertyPattern =
    /^(\s*)url: "([^"]+)",(?:\n\1viewCount: \d+,)?(?:\n\1channelSubscriberCount: \d+,)?(?:\n\1youtubeChannelId: "[^"]+",)?/gm;
  const locations = [];

  for (const match of source.matchAll(urlPropertyPattern)) {
    let videoId = null;
    try {
      videoId = getYouTubeVideoId(match[2]);
    } catch {
      // The schema will report malformed URLs; this script only handles YouTube URLs.
    }
    const locationStart = source.lastIndexOf("\n  {", match.index);
    const locationPrefix = source.slice(
      Math.max(0, locationStart),
      match.index,
    );
    const rawArtists = /^\s*artists: (\[[^\n]+\]),/m.exec(locationPrefix)?.[1];
    let artists = [];
    try {
      artists = JSON.parse(rawArtists ?? "[]");
    } catch {
      // A malformed artist array is reported below alongside unsupported URLs.
    }
    locations.push({ url: match[2], videoId, artists });
  }

  return { locations, urlPropertyPattern };
}

async function loadCheckpoint(path, provider) {
  try {
    const checkpoint = JSON.parse(await readFile(path, "utf8"));
    if (checkpoint?.version !== 2 || typeof checkpoint.videos !== "object") {
      throw new Error("unsupported checkpoint format");
    }
    if (checkpoint.provider !== provider) return {};
    return checkpoint.videos;
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw new Error(`Could not read ${path}: ${error.message}`);
  }
}

async function saveCheckpoint(path, videos, provider) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify({ version: 2, provider, updatedAt: new Date().toISOString(), videos }, null, 2)}\n`,
    "utf8",
  );
  await rename(temporaryPath, path);
}

function runYtDlp(videoIds, options) {
  const args = [
    "--skip-download",
    "--no-playlist",
    "--ignore-errors",
    "--no-warnings",
    "--retries",
    "3",
    "--extractor-retries",
    "3",
    "--sleep-requests",
    String(options.requestDelaySeconds),
    "--print",
    "%(id)s\t%(view_count)s\t%(channel_follower_count)s\t%(channel_id)s",
  ];

  if (options.cookiesFromBrowser) {
    args.push("--cookies-from-browser", options.cookiesFromBrowser);
  }
  args.push(
    ...videoIds.map((videoId) => `https://www.youtube.com/watch?v=${videoId}`),
  );

  return new Promise((resolvePromise, reject) => {
    const child = spawn(options.executable, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) =>
      reject(
        new Error(`Could not run ${options.executable}: ${error.message}`),
      ),
    );
    child.on("close", (code) => resolvePromise({ code, stdout, stderr }));
  });
}

function parseYtDlpOutput(stdout, expectedVideoIds) {
  const expected = new Set(expectedVideoIds);
  const videos = {};

  for (const line of stdout.split(/\r?\n/)) {
    const match =
      /^([A-Za-z0-9_-]{11})\t(\d+)\t(\d+|NA|None)\t([A-Za-z0-9_-]+|NA|None)$/.exec(
        line.trim(),
      );
    if (!match || !expected.has(match[1])) continue;
    videos[match[1]] = {
      viewCount: Number(match[2]),
      channelSubscriberCount: /^\d+$/.test(match[3]) ? Number(match[3]) : null,
      channelId: /^(?:NA|None)$/.test(match[4]) ? null : match[4],
    };
  }

  return videos;
}

const delay = (seconds) =>
  new Promise((resolvePromise) => setTimeout(resolvePromise, seconds * 1_000));

function extractPlayerResponse(html) {
  const markers = [
    "var ytInitialPlayerResponse = ",
    "ytInitialPlayerResponse = ",
    'window["ytInitialPlayerResponse"] = ',
  ];

  for (const marker of markers) {
    const markerIndex = html.indexOf(marker);
    if (markerIndex === -1) continue;

    const start = html.indexOf("{", markerIndex + marker.length);
    if (start === -1) continue;

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < html.length; index += 1) {
      const character = html[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === "{") depth += 1;
      else if (character === "}" && --depth === 0) {
        try {
          return JSON.parse(html.slice(start, index + 1));
        } catch {
          break;
        }
      }
    }
  }

  return null;
}

async function scrapeViewCount(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}&hl=en`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "accept-language": "en-US,en;q=0.9",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < 2
        ) {
          await delay(2 ** attempt);
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const playerResponse = extractPlayerResponse(html);
      const rawViewCount =
        playerResponse?.videoDetails?.viewCount ??
        /"viewCount":"(\d+)"/.exec(html)?.[1];
      const viewCount = Number(rawViewCount);
      if (Number.isSafeInteger(viewCount) && viewCount >= 0) return viewCount;

      throw new Error("player response did not contain a view count");
    } catch (error) {
      if (attempt < 2) {
        await delay(2 ** attempt);
        continue;
      }
      throw new Error(`${videoId}: ${error.message}`);
    }
  }

  throw new Error(`${videoId}: scraping failed after 3 attempts`);
}

async function scrapeChannelSubscriberCount(channelId) {
  const url = `https://www.youtube.com/channel/${channelId}?hl=en`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "accept-language": "en-US,en;q=0.9",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const jsonLdPattern =
        /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

      for (const match of html.matchAll(jsonLdPattern)) {
        const data = JSON.parse(match[1]);
        const rawStatistics = data?.mainEntity?.interactionStatistic;
        const statistics = Array.isArray(rawStatistics)
          ? rawStatistics
          : [rawStatistics];
        const followerStatistic = statistics.find(
          (statistic) =>
            statistic?.interactionType?.["@type"] === "FollowAction",
        );
        const subscriberCount = Number(followerStatistic?.userInteractionCount);
        if (Number.isSafeInteger(subscriberCount) && subscriberCount >= 0) {
          return subscriberCount;
        }
      }

      throw new Error("structured data did not contain a subscriber count");
    } catch (error) {
      if (attempt < 2) {
        await delay(2 ** attempt);
        continue;
      }
      throw new Error(`${channelId}: ${error.message}`);
    }
  }

  throw new Error(`${channelId}: subscriber scraping failed after 3 attempts`);
}

async function fetchChannelSubscriberCounts(channelIds, options) {
  const counts = new Map();
  const errors = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < channelIds.length) {
      const index = nextIndex;
      nextIndex += 1;
      const channelId = channelIds[index];
      try {
        counts.set(channelId, await scrapeChannelSubscriberCount(channelId));
      } catch (error) {
        errors.push(error.message);
      }
      if (nextIndex < channelIds.length) {
        await delay(options.requestDelaySeconds);
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(options.concurrency, channelIds.length) },
      worker,
    ),
  );

  if (errors.length > 0) {
    console.warn(
      `${errors.length} channel subscriber count(s) could not be resolved; ` +
        `retaining their best video-derived values:\n${errors.join("\n")}`,
    );
  }
  return counts;
}

async function runYouTubeScraper(videoIds, options) {
  const videos = {};
  const errors = [];

  for (let index = 0; index < videoIds.length; index += 1) {
    const videoId = videoIds[index];
    try {
      videos[videoId] = {
        viewCount: await scrapeViewCount(videoId),
        channelSubscriberCount: null,
        channelId: null,
      };
    } catch (error) {
      errors.push(error.message);
    }
    if (index + 1 < videoIds.length) await delay(options.requestDelaySeconds);
  }

  return {
    code: errors.length === 0 ? 0 : 1,
    videos,
    stderr: errors.join("\n"),
  };
}

async function retrieveBatch(videoIds, options) {
  if (options.provider === "scrape") {
    return runYouTubeScraper(videoIds, options);
  }

  const workerCount = Math.min(options.concurrency, videoIds.length);
  const queues = Array.from({ length: workerCount }, () => []);
  videoIds.forEach((videoId, index) =>
    queues[index % workerCount].push(videoId),
  );
  const results = await Promise.all(
    queues.map((queue) => runYtDlp(queue, options)),
  );
  const result = {
    code: results.some(({ code }) => code !== 0) ? 1 : 0,
    stdout: results.map(({ stdout }) => stdout).join("\n"),
    stderr: results
      .map(({ stderr }) => stderr.trim())
      .filter(Boolean)
      .join("\n"),
  };
  return {
    ...result,
    videos: parseYtDlpOutput(result.stdout, videoIds),
  };
}

function updateGeneratedChannelData(
  source,
  locations,
  videos,
  subscriberCountsByChannel,
) {
  const channelIdsByArtist = new Map();

  for (const location of locations) {
    const metadata = videos[location.videoId];
    if (!metadata?.channelId) continue;

    for (const artist of location.artists) {
      let channelIds = channelIdsByArtist.get(artist);
      if (!channelIds) {
        channelIds = new Set();
        channelIdsByArtist.set(artist, channelIds);
      }
      channelIds.add(metadata.channelId);
    }
  }

  const byName = ([left], [right]) => left.localeCompare(right, "en");
  const artistToChannelIds = Object.fromEntries(
    [...channelIdsByArtist.entries()]
      .sort(byName)
      .map(([artist, channelIds]) => [artist, [...channelIds].sort()]),
  );
  const channelSubscriberCounts = Object.fromEntries(
    [...subscriberCountsByChannel.entries()].sort(byName),
  );
  const propertyKey = (value) =>
    /^[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*$/u.test(value)
      ? value
      : JSON.stringify(value);
  const artistEntries = Object.entries(artistToChannelIds)
    .map(([artist, channelIds]) => {
      const inlineChannelIds = `[${channelIds
        .map((channelId) => JSON.stringify(channelId))
        .join(", ")}]`;
      const singleLine = `  ${propertyKey(artist)}: ${inlineChannelIds},`;
      if (singleLine.length <= 80) return singleLine;
      return `  ${propertyKey(artist)}: [\n${channelIds
        .map((channelId) => `    ${JSON.stringify(channelId)},`)
        .join("\n")}\n  ],`;
    })
    .join("\n");
  const subscriberEntries = Object.entries(channelSubscriberCounts)
    .map(
      ([channelId, subscriberCount]) =>
        `  ${propertyKey(channelId)}: ${subscriberCount},`,
    )
    .join("\n");
  const generatedBlock = `// BEGIN GENERATED YOUTUBE CHANNEL DATA
// Updated by scripts/update-youtube-view-counts.mjs.
export const ARTIST_TO_YOUTUBE_CHANNEL_IDS: Record<string, string[]> = {
${artistEntries}
};

export const YOUTUBE_CHANNEL_SUBSCRIBER_COUNTS: Record<string, number> = {
${subscriberEntries}
};
// END GENERATED YOUTUBE CHANNEL DATA`;
  const generatedBlockPattern =
    /\/\/ BEGIN GENERATED YOUTUBE CHANNEL DATA[\s\S]*?\/\/ END GENERATED YOUTUBE CHANNEL DATA/;

  if (generatedBlockPattern.test(source)) {
    return source.replace(generatedBlockPattern, generatedBlock);
  }
  return `${source.trimEnd()}\n\n${generatedBlock}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const source = await readFile(options.locations, "utf8");
  const { locations, urlPropertyPattern } = findLocationVideos(source);
  const unsupported = locations.filter(
    (location) => !location.videoId || location.artists.length === 0,
  );
  if (unsupported.length > 0) {
    throw new Error(
      `${unsupported.length} location URL(s) are not supported YouTube video URLs:\n${unsupported
        .map((location) => `  ${location.url}`)
        .join("\n")}`,
    );
  }

  const videoIds = [...new Set(locations.map((location) => location.videoId))];
  const checkpointVideos = await loadCheckpoint(
    options.checkpoint,
    options.provider,
  );
  const videos = Object.fromEntries(
    Object.entries(checkpointVideos).filter(
      ([videoId, metadata]) =>
        videoIds.includes(videoId) &&
        Number.isSafeInteger(metadata?.viewCount) &&
        metadata.viewCount >= 0 &&
        (metadata.channelId === null ||
          typeof metadata.channelId === "string") &&
        (metadata.channelSubscriberCount === null ||
          (Number.isSafeInteger(metadata.channelSubscriberCount) &&
            metadata.channelSubscriberCount >= 0)),
    ),
  );
  const missingVideoIds = videoIds.filter(
    (videoId) => videos[videoId] === undefined,
  );

  console.log(
    `${locations.length} locations reference ${videoIds.length} unique videos; ` +
      `${missingVideoIds.length} need fetching (${videoIds.length - missingVideoIds.length} resumed).`,
  );

  for (
    let offset = 0;
    offset < missingVideoIds.length;
    offset += options.batchSize
  ) {
    const batch = missingVideoIds.slice(offset, offset + options.batchSize);
    const batchNumber = Math.floor(offset / options.batchSize) + 1;
    const batchCount = Math.ceil(missingVideoIds.length / options.batchSize);
    console.log(
      `Fetching batch ${batchNumber}/${batchCount} (${batch.length} videos)...`,
    );

    const result = await retrieveBatch(batch, options);
    Object.assign(videos, result.videos);
    await saveCheckpoint(options.checkpoint, videos, options.provider);

    const failed = batch.filter((videoId) => videos[videoId] === undefined);
    if (failed.length > 0) {
      console.error(`No view count returned for: ${failed.join(", ")}`);
      if (result.stderr.trim()) console.error(result.stderr.trim());
    } else if (result.code !== 0 && result.stderr.trim()) {
      console.warn(result.stderr.trim());
    }

    if (offset + options.batchSize < missingVideoIds.length) {
      await delay(options.batchDelaySeconds);
    }
  }

  const unresolved = videoIds.filter(
    (videoId) => videos[videoId] === undefined,
  );
  if (unresolved.length > 0) {
    throw new Error(
      `${unresolved.length} video(s) are still unresolved. The successful results were checkpointed; rerun to retry only these IDs.`,
    );
  }

  const normalizedSubscriberCountsByChannel = new Map();
  for (const metadata of Object.values(videos)) {
    if (
      metadata.channelId === null ||
      metadata.channelSubscriberCount === null
    ) {
      continue;
    }
    const previousCount = normalizedSubscriberCountsByChannel.get(
      metadata.channelId,
    );
    normalizedSubscriberCountsByChannel.set(
      metadata.channelId,
      Math.max(previousCount ?? 0, metadata.channelSubscriberCount),
    );
  }
  if (options.provider === "yt-dlp") {
    const channelIds = [
      ...new Set(
        Object.values(videos)
          .map((metadata) => metadata.channelId)
          .filter(Boolean),
      ),
    ];
    console.log(
      `Fetching exact subscriber counts for ${channelIds.length} uploader channels...`,
    );
    const exactSubscriberCounts = await fetchChannelSubscriberCounts(
      channelIds,
      options,
    );
    for (const [channelId, subscriberCount] of exactSubscriberCounts) {
      normalizedSubscriberCountsByChannel.set(channelId, subscriberCount);
    }
  }

  let changedCount = 0;
  let updatedSource = source.replace(
    urlPropertyPattern,
    (currentProperties, indentation, url) => {
      const videoId = getYouTubeVideoId(url);
      const metadata = videos[videoId];
      const normalizedSubscriberCount = metadata.channelId
        ? (normalizedSubscriberCountsByChannel.get(metadata.channelId) ??
          metadata.channelSubscriberCount)
        : metadata.channelSubscriberCount;
      const subscriberProperty =
        normalizedSubscriberCount === null
          ? ""
          : `\n${indentation}channelSubscriberCount: ${normalizedSubscriberCount},`;
      const channelProperty = metadata.channelId
        ? `\n${indentation}youtubeChannelId: "${metadata.channelId}",`
        : "";
      const nextProperties = `${indentation}url: "${url}",\n${indentation}viewCount: ${metadata.viewCount},${subscriberProperty}${channelProperty}`;
      if (nextProperties === currentProperties) return currentProperties;
      changedCount += 1;
      return nextProperties;
    },
  );
  if (options.provider === "yt-dlp") {
    updatedSource = updateGeneratedChannelData(
      updatedSource,
      locations,
      videos,
      normalizedSubscriberCountsByChannel,
    );
  }

  const sourceChanged = updatedSource !== source;
  if (!options.check && sourceChanged) {
    const temporaryPath = `${options.locations}.${process.pid}.tmp`;
    await writeFile(temporaryPath, updatedSource, "utf8");
    await rename(temporaryPath, options.locations);
  }

  try {
    await unlink(options.checkpoint);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  console.log(
    options.check
      ? `${changedCount} location view counts differ; generated channel data was checked (source was not modified).`
      : `Updated ${changedCount} of ${locations.length} location view counts and refreshed generated channel data.`,
  );
  if (options.check && sourceChanged) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
