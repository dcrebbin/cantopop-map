"use client";

import {
  ArrowTopRightOnSquareIcon,
  MapPinIcon,
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
import Appbar from "./components/appbar";
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

function youtubeWatchUrl(url: string) {
  return url.replace(/([?&])t=\d+s?(&|$)/, "$1").replace(/[?&]$/, "");
}

function DscvrSlide({
  item,
  active,
  muted,
  paused,
  onToggleMuted,
  onTogglePaused,
}: {
  item: FeedItem;
  active: boolean;
  muted: boolean;
  paused: boolean;
  onToggleMuted: () => void;
  onTogglePaused: () => void;
}) {
  const { location } = item;
  const embedUrl = youtubeEmbedUrl(location.url);
  const instagram = location.artists
    .map((artist) => getInstagramByName(artist))
    .find((handle) => handle !== null);
  const youtubeUrl = youtubeWatchUrl(location.url);
  const thumbnail = location.highResImage ?? location.image;

  return (
    <article className="relative flex h-dvh min-h-[34rem] snap-start snap-always items-center justify-center overflow-hidden sm:p-5 lg:p-7">
      <div className="relative z-10 grid h-dvh w-[min(100vw,56.25dvh)] grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden bg-black text-white sm:aspect-[9/16] sm:h-[calc(100dvh-2.5rem)] sm:w-auto sm:max-w-[calc(100vw-2.5rem)] sm:rounded-[2rem] sm:border-[3px] sm:border-white/55 sm:shadow-[0_1.5rem_5rem_rgba(0,0,0,.55)] lg:h-[calc(100dvh-3.5rem)] lg:max-w-[calc(100vw-3.5rem)]">
        <div className="relative min-h-0 overflow-hidden">
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/5 to-transparent" />
        </div>

        <div className="relative aspect-video w-full shrink-0 bg-black">
          <iframe
            src={`${embedUrl}&autoplay=1&mute=${muted ? 1 : 0}&playsinline=1`}
            title={`${location.name} by ${location.artists.join(", ")}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; controls;encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="relative min-h-0 overflow-hidden">
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/25 to-black/90" />

          <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
            <h2 className="truncate font-[Cute] text-3xl leading-none sm:text-4xl">
              {location.artists.join(" × ")}
            </h2>
            <p className="mt-2 truncate text-sm font-bold text-white/90">
              {location.name}
            </p>
            {location.address && (
              <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-white/65">
                <MapPinIcon className="size-4 shrink-0" />
                <span className="truncate">{location.address}</span>
              </p>
            )}

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
  const cycleRef = useRef(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        const index = Number(
          (mostVisible.target as HTMLElement).dataset.feedIndex,
        );
        if (!Number.isNaN(index)) {
          setActiveIndex(index);
          setPaused(false);
        }
      },
      { root: scrollerRef.current, threshold: [0.6, 0.8, 0.95] },
    );

    itemRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [feed.length]);

  const extendFeed = useCallback(() => {
    const cycle = cycleRef.current;
    cycleRef.current += 1;
    setFeed((current) => [...current, ...makeBatch(eligibleLocations, cycle)]);
  }, [eligibleLocations]);

  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientHeight === 0) return;
    const remaining =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (remaining < scroller.clientHeight * 3) extendFeed();
  }, [extendFeed]);

  if (feed.length === 0) {
    return (
      <main className="jobs-map-shell grid h-dvh place-items-center p-6 text-center text-white">
        <Appbar suffix="DSCVR" />
        <div className="rounded-2xl border-2 border-white/50 bg-black/30 p-8 backdrop-blur-md">
          <h1 className="font-[Cute] text-4xl">Nothing to DSCVR yet.</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="jobs-map-shell relative h-dvh overflow-hidden text-white">
      <Appbar suffix="DSCVR" />
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
                active={activeIndex === index}
                muted={muted}
                paused={paused && activeIndex === index}
                onToggleMuted={() => setMuted((current) => !current)}
                onTogglePaused={() => setPaused((current) => !current)}
              />
            </section>
          );
        })}
      </div>
    </main>
  );
}
