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

function DscvrSlide({ item, onPlay }: { item: FeedItem; onPlay: () => void }) {
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
      <div className="relative z-10 grid h-dvh w-full grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden bg-black text-white sm:aspect-[9/16] sm:h-[calc(100dvh-2.5rem)] sm:w-auto sm:max-w-[calc(100vw-2.5rem)] sm:rounded-[2rem] sm:border-[3px] sm:border-white/55 sm:shadow-[0_1.5rem_5rem_rgba(0,0,0,.55)] lg:h-[calc(100dvh-3.5rem)] lg:max-w-[calc(100vw-3.5rem)]">
        <div className="relative min-h-0 overflow-hidden">
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/5 to-transparent" />
        </div>

        <div
          data-video-slot
          className="relative aspect-video w-full shrink-0 bg-black"
        >
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play ${location.name} with sound`}
            className="absolute inset-0 h-full w-full"
          >
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/20">
              <PlayIcon className="size-14 rounded-full bg-black/60 p-3" />
            </span>
          </button>
        </div>

        <div className="relative min-h-0 overflow-hidden">
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover object-center blur-xs scale-250"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/25 to-black/90" />

          <div className="mt-4 absolute top-0 z-99 justify-center flex flex-wrap items-center gap-2 w-full">
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
          <div className="absolute inset-x-0 bottom-0 max-h-full overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
            <h2 className="wrap-anywhere font-[Cute] text-xl leading-tight sm:text-2xl">
              {location.artists.join(" x ")}
            </h2>
            <p className="mt-2 wrap-anywhere text-sm font-bold text-white/90">
              {location.name}
            </p>
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
  const selectedRef = useRef<FeedItem | undefined>(feed[0]);
  selectedRef.current = feed[activeIndex];
  const selectedIndexRef = useRef(activeIndex);

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
        iframe.src = `https://www.youtube.com/embed/xNjkUL8j564?list=PLTRI32rUM0pU&autoplay=0&controls=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        iframe.title = "Cantopop discovery playlist";
        iframe.className = "h-full w-full";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture";
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
                const location = selectedRef.current?.location;
                const videoId = location && youtubeVideoId(location.url);
                if (location && videoId)
                  queueRef.current?.select(
                    videoId,
                    location.hookTime ?? 0,
                    true,
                  );
              } else playbackRef.current?.stateChanged(data);
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
  }, [feedLocations]);

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
      queueRef.current?.select(
        videoId,
        location.hookTime ?? 0,
        newlyFocused,
      );
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

  const toggleSound = () => {
    const nextMuted = muted || soundBlocked ? false : true;
    mutedRef.current = nextMuted;
    playbackRef.current?.sync({ active: true, muted: nextMuted, paused }, true);
    setMuted(nextMuted);
  };

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
                onPlay={() => playWithSound(item, index)}
              />
            </section>
          );
        })}
        <div
          ref={playerHostRef}
          className="absolute z-30 overflow-hidden bg-black"
          style={{
            opacity: currentVideo ? 1 : 0,
            pointerEvents: currentVideo ? "auto" : "none",
          }}
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
            className="fixed bottom-4 right-4 z-40 min-h-10 rounded-full bg-white px-4 text-sm font-bold text-black"
          >
            Tap for sound
          </button>
        )}
        {currentVideo && (
          <div className="fixed bottom-4 left-4 z-40 flex gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? "Pause video" : "Play video"}
              className="grid size-10 place-items-center rounded-full bg-black/80 text-white"
            >
              {playing ? (
                <PauseIcon className="size-5" />
              ) : (
                <PlayIcon className="size-5" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={muted || soundBlocked ? "Unmute video" : "Mute video"}
              className="grid size-10 place-items-center rounded-full bg-black/80 text-white"
            >
              {muted || soundBlocked ? (
                <SpeakerXMarkIcon className="size-5" />
              ) : (
                <SpeakerWaveIcon className="size-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
