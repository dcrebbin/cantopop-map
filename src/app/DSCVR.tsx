"use client";

import {
  ArrowTopRightOnSquareIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LOCATIONS, type LocationItem } from "./common/lib";
import { youtubeEmbedUrl } from "./common/jobs";
import { getInstagramByName } from "./common/social-media";
import { loadYoutubePlayer, type YoutubePlayer } from "./common/youtube-player";
import { InstagramIcon } from "~/lib/icons/instagramIcon";

const MAX_VIEWS = 50_000;
const SUBSCRIBER_LIMIT: number | null = null;

type FeedItem = {
  key: string;
  location: LocationItem;
};

export const Route = createFileRoute("/DSCVR")({
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

function isEligible(location: LocationItem) {
  const meetsViewLimit =
    location.viewCount !== null && location.viewCount <= MAX_VIEWS;

  // Subscriber data is not part of locations yet. Keeping this explicit makes
  // it straightforward to add the second eligibility gate when it is decided.
  const meetsSubscriberLimit = SUBSCRIBER_LIMIT === null;
  return (
    meetsViewLimit && meetsSubscriberLimit && youtubeEmbedUrl(location.url)
  );
}

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

function shuffledLocations(locations: LocationItem[]): LocationItem[] {
  const shuffled = [...locations];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
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

function DscvrSlide({
  item,
  loadVideo,
  active,
  muted,
  paused,
  onToggleMuted,
  onTogglePaused,
}: {
  item: FeedItem;
  loadVideo: boolean;
  active: boolean;
  muted: boolean;
  paused: boolean;
  onToggleMuted: () => void;
  onTogglePaused: (paused: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const desiredRef = useRef({ active, muted, paused });
  const restoreSoundRef = useRef(false);
  const retriedMutedRef = useRef(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const effectivelyMuted = muted || soundBlocked;
  const { location } = item;
  const embedUrl = youtubeEmbedUrl(location.url);
  const instagram = location.artists
    .map((artist) => getInstagramByName(artist))
    .find((handle) => handle !== null);
  const youtubeUrl = youtubeWatchUrl(location.url);
  const thumbnail = location.highResImage ?? location.image;

  const syncPlayer = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const desired = desiredRef.current;
    if (!desired.active) {
      restoreSoundRef.current = false;
      player.mute();
      player.pauseVideo();
      return;
    }
    // Start every selection muted; restore the preference only after playback.
    restoreSoundRef.current = !desired.muted;
    retriedMutedRef.current = false;
    setSoundBlocked(false);
    player.mute();
    if (desired.paused) player.pauseVideo();
    else player.playVideo();
  }, []);

  useEffect(() => {
    if (!loadVideo || !embedUrl || !containerRef.current) return;
    const container = containerRef.current;
    let disposed = false;
    let player: YoutubePlayer | undefined;
    void loadYoutubePlayer()
      .then((api) => {
        if (disposed) return;
        // The API owns this iframe so destroy() never removes React-owned nodes.
        const iframe = document.createElement("iframe");
        iframe.src = `${embedUrl}&autoplay=0&mute=1&controls=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        iframe.title = "Cantopop music video";
        iframe.className = "absolute inset-0 h-full w-full";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture";
        container.append(iframe);
        player = new api.Player(iframe, {
          events: {
            onReady: ({ target }) => {
              if (disposed) return;
              playerRef.current = target;
              syncPlayer();
            },
            onStateChange: ({ target, data }) => {
              if (disposed) return;
              const desired = desiredRef.current;
              if (!desired.active && (data === 1 || data === 3)) {
                target.mute();
                target.pauseVideo();
                return;
              }
              if (desired.paused && (data === 1 || data === 3)) {
                target.pauseVideo();
                return;
              }
              setPlaying(data === 1);
              if (data === 1 && restoreSoundRef.current) {
                restoreSoundRef.current = false;
                if (!desired.muted) target.unMute();
              }
              if (data === 0 && desired.active && !desired.paused) {
                target.seekTo(0, true);
                target.playVideo();
              }
            },
            onAutoplayBlocked: ({ target }) => {
              if (disposed) return;
              setPlaying(false);
              const desired = desiredRef.current;
              if (!desired.active || desired.paused) return;
              restoreSoundRef.current = false;
              setSoundBlocked(!desired.muted);
              if (retriedMutedRef.current) return;
              retriedMutedRef.current = true;
              target.mute();
              target.playVideo();
            },
          },
        });
      })
      .catch(() => {
        if (!disposed) setPlayerError(true);
      });
    return () => {
      disposed = true;
      playerRef.current = null;
      player?.destroy();
      container.replaceChildren();
    };
  }, [loadVideo, embedUrl, syncPlayer]);

  useEffect(() => {
    desiredRef.current = { active, muted, paused };
    syncPlayer();
  }, [active, muted, paused, syncPlayer]);

  const togglePaused = () => {
    // Dispatch in the gesture handler to retain browser playback permission.
    const nextPaused = playing;
    desiredRef.current = { active, muted, paused: nextPaused };
    syncPlayer();
    onTogglePaused(nextPaused);
  };

  const toggleMuted = () => {
    const nextMuted = !effectivelyMuted;
    desiredRef.current = { active, paused, muted: nextMuted };
    restoreSoundRef.current = false;
    setSoundBlocked(false);
    // Sound changes made by a click retain the browser's user activation.
    if (nextMuted) playerRef.current?.mute();
    else playerRef.current?.unMute();
    if (nextMuted !== muted) onToggleMuted();
  };

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

        <div className="relative aspect-video w-full shrink-0 bg-black">
          <div ref={containerRef} className="absolute inset-0" />
          {playerError && (
            <p role="status">
              playerError: Video unavailable. Open it on YouTube below.{" "}
              {playerError}
            </p>
          )}
          {active && (
            <div className="absolute right-3 -bottom-12 z-10 flex gap-2">
              <button
                type="button"
                onClick={togglePaused}
                className="grid size-10 place-items-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black/85"
                aria-label={playing ? "Pause video" : "Play video"}
              >
                {!playing ? (
                  <PlayIcon className="size-5" />
                ) : (
                  <PauseIcon className="size-5" />
                )}
              </button>
              <button
                type="button"
                onClick={toggleMuted}
                className="grid size-10 place-items-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black/85"
                aria-label={effectivelyMuted ? "Unmute video" : "Mute video"}
              >
                {effectivelyMuted ? (
                  <SpeakerXMarkIcon className="size-5" />
                ) : (
                  <SpeakerWaveIcon className="size-5" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="relative min-h-0 overflow-hidden">
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover object-center blur-xs scale-250"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/25 to-black/90" />

          <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
            <h2 className="truncate font-[Cute] text-xl leading-none sm:text-2xl">
              {location.artists.join(" x ")}
            </h2>
            <p className="mt-2 truncate text-sm font-bold text-white/90">
              {location.name}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-black transition hover:bg-red-500 hover:text-white"
              >
                YouTube
                <ArrowTopRightOnSquareIcon className="size-4" />
              </a>
              {instagram && (
                <a
                  href={`https://www.instagram.com/${instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-10 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 text-xs font-bold transition hover:bg-white hover:text-black"
                >
                  <InstagramIcon className="size-5" />
                  <span>@{instagram.replace(/^@/, "")}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function DscvrPage() {
  const eligibleLocations = useMemo(() => LOCATIONS.filter(isEligible), []);
  const [feed, setFeed] = useState(() => makeBatch(eligibleLocations, 0));
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const activeIndexRef = useRef(0);
  const hasRandomizedRef = useRef(false);
  const feedLocationsRef = useRef(eligibleLocations);
  const cycleRef = useRef(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (hasRandomizedRef.current) return;
    hasRandomizedRef.current = true;
    feedLocationsRef.current = shuffledLocations(eligibleLocations);
    setFeed(makeBatch(feedLocationsRef.current, 0));
  }, [eligibleLocations]);

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
        className="dscvr-feed h-dvh snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
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
                loadVideo={Math.abs(activeIndex - index) <= 1}
                active={activeIndex === index}
                muted={muted}
                paused={paused && activeIndex === index}
                onToggleMuted={() => setMuted((current) => !current)}
                onTogglePaused={setPaused}
              />
            </section>
          );
        })}
      </div>
    </main>
  );
}
