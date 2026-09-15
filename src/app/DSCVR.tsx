"use client";

import {
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";
import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LOCATIONS, type LocationItem } from "./common/lib";
import { youtubeVideoId } from "./common/youtube-video-id";
import discoverVideoIds from "../data/discover-video-ids";
import { getInstagramByName } from "./common/social-media";
import { loadYoutubePlayer, type YoutubePlayer } from "./common/youtube-player";
import { YoutubePlayback } from "./common/youtube-playback";
import { YoutubeFeedQueue } from "./common/youtube-feed-queue";

type FeedItem = {
  key: string;
  location: LocationItem;
};

export const Route = createFileRoute("/DSCVR")({
  loader: () => ({ shuffleSeed: Math.random() }),
  shouldReload: true,
  preloadStaleTime: 0,
  head: () => ({
    meta: [
      { title: "DSCVR Cantopop | Cantopop Map" },
      {
        name: "description",
        content:
          "An endless feed for discovering emerging Cantopop artists and the Hong Kong locations in their music videos.",
      },
      { property: "og:title", content: "DSCVR Cantopop | Cantopop Map" },
      {
        property: "og:description",
        content: "Swipe through emerging Cantopop, one location at a time.",
      },
      { property: "og:url", content: "/DSCVR" },
    ],
    links: [{ rel: "canonical", href: "/DSCVR" }],
  }),
  component: DscvrPage,
});

function makeBatch(locations: LocationItem[], cycle: number): FeedItem[] {
  if (locations.length === 0) return [];
  const offset = (cycle * 7) % locations.length;
  return [...locations.slice(offset), ...locations.slice(0, offset)].map(
    (location, index) => ({
      key: `${cycle}-${index}-${location.id}`,
      location,
    }),
  );
}

function shuffledLocations(
  locations: LocationItem[],
  seed: number,
): LocationItem[] {
  const shuffled = [...locations];
  let randomState = Math.floor(seed * 0x1_0000_0000) >>> 0;
  const nextRandom = () => {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex]!,
      shuffled[index]!,
    ];
  }
  return shuffled;
}

function youtubeWatchUrl(url: string) {
  return url.replace(/([?&])t=\d+s?(&|$)/, "$1").replace(/[?&]$/, "");
}

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function VideoControls({
  playing,
  muted,
  progress,
  scrubbing,
  onTogglePlayback,
  onToggleSound,
  onSeek,
  onScrub,
  onScrubStart,
  onScrubEnd,
}: {
  playing: boolean;
  muted: boolean;
  progress: { time: number; duration: number };
  scrubbing: boolean;
  onTogglePlayback: () => void;
  onToggleSound: () => void;
  onSeek: (seconds: number) => void;
  onScrub: (seconds: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  return (
    <div
      className="flex w-full items-center gap-2 rounded-full border border-white/40 bg-white/10 p-2"
      role="group"
      aria-label="Video playback"
    >
      <button
        type="button"
        onClick={onTogglePlayback}
        aria-label={playing ? "Pause video" : "Play video"}
        className="grid size-8 shrink-0 place-items-center rounded-full text-white"
      >
        {playing ? (
          <PauseIcon className="size-5" />
        ) : (
          <PlayIcon className="size-5" />
        )}
      </button>
      <button
        type="button"
        onClick={onToggleSound}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="grid size-8 shrink-0 place-items-center rounded-full text-white"
      >
        {muted ? (
          <SpeakerXMarkIcon className="size-5" />
        ) : (
          <SpeakerWaveIcon className="size-5" />
        )}
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
        <input
          type="range"
          min={0}
          max={progress.duration || 0}
          step={0.1}
          value={Math.min(progress.time, progress.duration || 0)}
          disabled={progress.duration === 0}
          aria-label="Seek video"
          aria-valuetext={`${formatTime(progress.time)} of ${formatTime(progress.duration)}`}
          onPointerDown={onScrubStart}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (scrubbing) onScrub(next);
            else onSeek(next);
          }}
          className="h-1 min-w-0 flex-1 accent-white"
        />
        <span className="shrink-0 text-xs font-bold tabular-nums text-white/80">
          {formatTime(progress.time)}
          {progress.duration > 0 ? ` / ${formatTime(progress.duration)}` : ""}
        </span>
      </div>
    </div>
  );
}

function SlideThumbnail({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  if (loadedSrc !== null && loadedSrc !== src) setLoadedSrc(null);

  return (
    <>
      <img
        src={src}
        alt=""
        className={className}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setLoadedSrc(src)}
      />
      {loadedSrc !== src && (
        <div
          className="image-skeleton pointer-events-none absolute inset-0 z-[1] opacity-30"
          aria-hidden="true"
        />
      )}
    </>
  );
}

function DscvrSlide({
  item,
  controls,
  videoLoading,
}: {
  item: FeedItem;
  controls?: ReactNode;
  videoLoading?: boolean;
}) {
  const { location } = item;
  const artistInstagrams = location.artists.flatMap((artist) => {
    const handle = getInstagramByName(artist)?.replace(/^@/, "");
    return handle ? [{ artist, handle }] : [];
  });
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(
    `${location.artists.join(" ")} ${location.name}`,
  )}`;
  const youtubeUrl = youtubeWatchUrl(location.url);
  const thumbnail = location.highResImage ?? location.image;

  return (
    <article className="relative flex h-dvh min-h-[34rem] snap-start snap-always items-center justify-center overflow-hidden p-0 lg:p-7">
      <div className="relative grid h-dvh w-full grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden bg-black text-white sm:aspect-[9/16] sm:h-[calc(100dvh-2.5rem)] sm:w-auto sm:max-w-[calc(100vw-2.5rem)] sm:rounded-[2rem] sm:border-[3px] sm:border-white/55 sm:shadow-[0_1.5rem_5rem_rgba(0,0,0,.55)] lg:h-[calc(100dvh-3.5rem)] lg:max-w-[calc(100vw-3.5rem)]">
        <div className="relative min-h-0 overflow-hidden">
          <SlideThumbnail
            src={thumbnail}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/0 to-black/95" />
          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pt-10 pb-3 sm:px-6 sm:pb-4">
            <h2 className="wrap-anywhere font-serif text-xl leading-tight sm:text-2xl">
              {location.name}
            </h2>
            <p className="mt-1 wrap-anywhere text-sm font-bold text-white/90">
              {location.artists.join(" x ")}
            </p>
          </div>
        </div>

        <div
          data-video-slot
          className="dscvr-video-slot relative aspect-video w-full shrink-0 overflow-hidden bg-black"
        >
          <SlideThumbnail
            src={thumbnail}
            className="h-full w-full object-cover blur-sm"
          />
          {videoLoading && (
            <div
              className="image-skeleton dscvr-video-skeleton pointer-events-none absolute inset-0 z-[2] opacity-60"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="relative z-40 min-h-0 overflow-hidden">
          <SlideThumbnail
            src={thumbnail}
            className="h-full w-full scale-250 object-cover object-center blur-xs"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/70 to-transparent" />

          <div className="pointer-events-auto absolute inset-x-0 top-0 z-40 px-3 pt-2 sm:px-4 sm:pt-3">
            {controls ?? <div className="h-12" aria-hidden="true" />}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-2 px-3 pt-10 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-10 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 text-xs font-bold transition hover:bg-white hover:text-black"
            >
              YouTube
              <img src="/icons/youtube.svg" alt="YouTube" className="size-6" />
            </a>
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Find ${location.name} by ${location.artists.join(", ")} on Spotify`}
              className="flex min-h-10 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 text-xs font-bold transition hover:bg-white hover:text-black"
            >
              <span>Spotify</span>
              <img src="/icons/spotify.svg" alt="Spotify" className="size-6" />
            </a>
            {artistInstagrams.map(({ artist, handle }) => (
              <a
                key={`${artist}-${handle}`}
                href={`https://www.instagram.com/${handle}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`${artist} on Instagram: @${handle}`}
                className="flex min-h-10 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 text-xs font-bold transition hover:bg-white hover:text-black"
              >
                <span>@{handle}</span>
                <img
                  src="/icons/instagram.svg"
                  alt="Instagram"
                  className="size-6"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function DscvrPage() {
  const { shuffleSeed } = Route.useLoaderData();
  const eligibleLocations = useMemo(() => {
    const locationsByVideoId = new Map(
      LOCATIONS.flatMap((location) => {
        const id = youtubeVideoId(location.url);
        return id ? [[id, location] as const] : [];
      }),
    );
    return discoverVideoIds.flatMap((id) => {
      const location = locationsByVideoId.get(id);
      return location ? [location] : [];
    });
  }, []);
  const feedLocations = useMemo(
    () => shuffledLocations(eligibleLocations, shuffleSeed),
    [eligibleLocations, shuffleSeed],
  );
  const [feed, setFeed] = useState(() => makeBatch(feedLocations, 0));
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const activeIndexRef = useRef(0);
  const feedLocationsRef = useRef(feedLocations);
  const cycleRef = useRef(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const playbackRef = useRef<YoutubePlayback | null>(null);
  const queueRef = useRef<YoutubeFeedQueue | null>(null);
  const [playing, setPlaying] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  const [scrubbing, setScrubbing] = useState(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const selectedRef = useRef<FeedItem | undefined>(feed[0]);
  selectedRef.current = feed[activeIndex];
  const selectedIndexRef = useRef(activeIndex);
  const feedRef = useRef(feed);
  feedRef.current = feed;
  const pendingScrollIndexRef = useRef<number | null>(null);
  const advancingRef = useRef(false);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const advanceToNext = useCallback(() => {
    if (!selectedRef.current || advancingRef.current) return;
    const nextIndex = activeIndexRef.current + 1;
    let nextItem = feedRef.current[nextIndex];
    if (!nextItem) {
      const batch = makeBatch(feedLocationsRef.current, cycleRef.current++);
      nextItem = batch[0];
      if (!nextItem) return;
      pendingScrollIndexRef.current = nextIndex;
      setFeed((current) => [...current, ...batch]);
    }
    advancingRef.current = true;
    activeIndexRef.current = nextIndex;
    selectedRef.current = nextItem;
    setActiveIndex(nextIndex);
    setPaused(false);
    pausedRef.current = false;
    const nextId = youtubeVideoId(nextItem.location.url);
    if (nextId) {
      playbackRef.current?.setHookTime(nextItem.location.hookTime ?? 0);
      queueRef.current?.select(nextId, nextItem.location.hookTime ?? 0, true);
    }
    if (pendingScrollIndexRef.current === null)
      itemRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const syncPlayback = useCallback(
    (userGesture = false) => {
      playbackRef.current?.sync(
        {
          active: !document.hidden,
          muted,
          paused,
        },
        userGesture,
      );
    },
    [muted, paused],
  );

  useEffect(() => {
    const container = playerHostRef.current;
    if (!container || feedLocations.length === 0) return;
    let disposed = false;
    let player: YoutubePlayer | undefined;
    void loadYoutubePlayer()
      .then((api) => {
        if (disposed) return;
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube.com/embed/${youtubeVideoId(feedLocations[0]!.url)}?autoplay=0&controls=1&disablekb=1&fs=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        iframe.title = "Cantopop discovery video";
        iframe.className = "pointer-events-auto h-full w-full";
        iframe.allow = "autoplay;controls; encrypted-media; picture-in-picture";
        container.append(iframe);
        player = new api.Player(iframe, {
          events: {
            onReady: ({ target }) => {
              if (disposed) return;
              playerRef.current = target;
              playbackRef.current = new YoutubePlayback(
                target,
                setPlaying,
                setSoundBlocked,
              );
              queueRef.current = new YoutubeFeedQueue(target, setCurrentVideo);
              const location = selectedRef.current?.location;
              const videoId = location && youtubeVideoId(location.url);
              if (location && videoId) {
                playbackRef.current.setHookTime(location.hookTime ?? 0);
                queueRef.current.select(videoId, location.hookTime ?? 0);
              }
              playbackRef.current.sync({
                active: !document.hidden,
                muted: mutedRef.current,
                paused: pausedRef.current,
              });
            },
            onStateChange: ({ data }) => {
              if (disposed) return;
              queueRef.current?.stateChanged(data);
              if (data === 0) {
                advanceToNext();
              } else {
                if (
                  data === 1 &&
                  youtubeVideoId(playerRef.current?.getVideoUrl() ?? "") ===
                    youtubeVideoId(selectedRef.current?.location.url ?? "")
                ) advancingRef.current = false;
                playbackRef.current?.stateChanged(data);
              }
            },
            onAutoplayBlocked: () => {
              if (!disposed) playbackRef.current?.autoplayBlocked();
            },
          },
        });
      })
      .catch(() => {
        if (!disposed) setPlayerError(true);
      });
    return () => {
      disposed = true;
      player?.destroy();
      playerRef.current = null;
      playbackRef.current = null;
      queueRef.current = null;
      container.replaceChildren();
    };
  }, [advanceToNext, feedLocations]);

  const mutedRef = useRef(muted);
  const pausedRef = useRef(paused);
  mutedRef.current = muted;
  pausedRef.current = paused;

  useLayoutEffect(() => {
    const location = feed[activeIndex]?.location;
    const videoId = location && youtubeVideoId(location.url);
    const newlyFocused = selectedIndexRef.current !== activeIndex;
    selectedIndexRef.current = activeIndex;
    if (location && videoId) {
      playbackRef.current?.setHookTime(location.hookTime ?? 0);
      queueRef.current?.select(videoId, location.hookTime ?? 0, newlyFocused);
    }
    const scroller = scrollerRef.current;
    const host = playerHostRef.current;
    const slot =
      itemRefs.current[activeIndex]?.querySelector<HTMLElement>(
        "[data-video-slot]",
      );
    if (!scroller || !host || !slot) return;
    const placePlayer = () => {
      const view = scroller.getBoundingClientRect();
      const rect = slot.getBoundingClientRect();
      host.style.top = `${rect.top - view.top + scroller.scrollTop}px`;
      host.style.left = `${rect.left - view.left + scroller.scrollLeft}px`;
      host.style.width = `${rect.width}px`;
      host.style.height = `${rect.height}px`;
    };
    placePlayer();
    const resize = new ResizeObserver(placePlayer);
    resize.observe(slot);
    resize.observe(scroller);
    return () => resize.disconnect();
  }, [activeIndex, feed]);

  useEffect(() => {
    syncPlayback();
  }, [syncPlayback]);

  useEffect(() => {
    const onVisibilityChange = () => syncPlayback();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [syncPlayback]);

  const playWithSound = (item?: FeedItem, index?: number) => {
    if (item && index !== undefined && index !== activeIndexRef.current) {
      activeIndexRef.current = index;
      selectedRef.current = item;
      setActiveIndex(index);
      const videoId = youtubeVideoId(item.location.url);
      if (videoId)
        queueRef.current?.select(videoId, item.location.hookTime ?? 0);
    }
    if (muted) {
      mutedRef.current = false;
      setMuted(false);
    }
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
    }
    playbackRef.current?.sync(
      { active: true, muted: false, paused: false },
      true,
    );
    playerRef.current?.playVideo();
  };

  const togglePlayback = () => {
    const nextPaused = playing;
    pausedRef.current = nextPaused;
    playbackRef.current?.sync(
      { active: true, muted, paused: nextPaused },
      true,
    );
    setPaused(nextPaused);
  };

  const seekVideo = (seconds: number) => {
    setProgress((current) => ({ ...current, time: seconds }));
    playerRef.current?.seekTo(seconds, true);
  };

  const toggleSound = () => {
    const nextMuted = muted || soundBlocked ? false : true;
    mutedRef.current = nextMuted;
    playbackRef.current?.sync({ active: true, muted: nextMuted, paused }, true);
    setMuted(nextMuted);
  };

  useEffect(() => {
    if (!currentVideo) {
      setProgress({ time: 0, duration: 0 });
      return;
    }
    if (scrubbing) return;
    const read = () => {
      const player = playerRef.current;
      if (!player) return;
      const duration = player.getDuration();
      if (!Number.isFinite(duration) || duration <= 0) return;
      const time = player.getCurrentTime();
      setProgress({ time, duration });
      if (
        playingRef.current &&
        !document.hidden &&
        duration > 5 &&
        time >= duration - 3 &&
        youtubeVideoId(player.getVideoUrl()) ===
          youtubeVideoId(selectedRef.current?.location.url ?? "")
      ) advanceToNext();
    };
    read();
    const timer = window.setInterval(read, 250);
    return () => window.clearInterval(timer);
  }, [advanceToNext, currentVideo, scrubbing]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6,
          )
          .toSorted((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        const index = Number(
          (mostVisible.target as HTMLElement).dataset.feedIndex,
        );
        if (!Number.isNaN(index) && index !== activeIndexRef.current) {
          activeIndexRef.current = index;
          setActiveIndex(index);
          setPaused(false);
        }
      },
      { root: scrollerRef.current, threshold: [0.6, 0.8, 0.95] },
    );

    itemRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [feed]);

  const extendFeed = useCallback(() => {
    const cycle = cycleRef.current;
    cycleRef.current += 1;
    setFeed((current) => [
      ...current,
      ...makeBatch(feedLocationsRef.current, cycle),
    ]);
  }, []);

  useEffect(() => {
    const nextIndex = pendingScrollIndexRef.current;
    if (nextIndex === null || !itemRefs.current[nextIndex]) return;
    pendingScrollIndexRef.current = null;
    itemRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth" });
  }, [feed]);

  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientHeight === 0) return;
    const remaining =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (remaining < scroller.clientHeight * 3) extendFeed();
  }, [extendFeed]);

  const discoverAppBar = (
    <div className="fixed top-0 left-0  z-120 w-full pt-2 flex justify-start text-center">
      <a href="/">
        <h1 className="px-3 pt-3 pb-0 text-center font-[Cute] text-2xl leading-none text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)] md:text-4xl">
          cantopop地圖 DSCVR
        </h1>
      </a>
    </div>
  );

  if (feed.length === 0) {
    return (
      <main className="jobs-map-shell grid h-dvh place-items-center p-6 text-center text-white">
        {discoverAppBar}

        <div className="rounded-2xl border-2 border-white/50 bg-black/30 p-8 backdrop-blur-md">
          <h1 className="font-[Cute] text-4xl">Nothing to DSCVR yet.</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="jobs-map-shell relative h-dvh overflow-hidden text-white">
      {discoverAppBar}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="dscvr-feed relative h-dvh snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
        aria-label="Emerging Cantopop discovery feed"
      >
        {feed.map((item, index) => {
          return (
            <section
              key={item.key}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              data-feed-index={index}
            >
              <DscvrSlide
                item={item}
                videoLoading={
                  index === activeIndex && !currentVideo && !playerError
                }
              />
            </section>
          );
        })}
        <div
          ref={playerHostRef}
          className="pointer-events-none absolute z-30 overflow-hidden bg-black"
          style={{ opacity: currentVideo ? 1 : 0 }}
          aria-hidden={!currentVideo}
        />
        {playerError && (
          <p
            role="status"
            className="fixed inset-x-4 bottom-4 z-40 rounded bg-black p-3 text-center"
          >
            Video unavailable. Open it on YouTube.
          </p>
        )}
        {soundBlocked && !muted && (
          <button
            type="button"
            onClick={() => playWithSound()}
            className="fixed bottom-20 right-4 z-40 min-h-10 rounded-full bg-white px-4 text-sm font-bold text-black"
          >
            Tap for sound
          </button>
        )}
      </div>
    </main>
  );
}
