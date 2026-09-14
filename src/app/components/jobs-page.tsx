"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ROLE_FAMILIES,
  buildAllTalentProfiles,
  buildTalentProfiles,
  stableNumber,
  youtubeEmbedUrl,
  type ContributorCategory,
  type RoleFamily,
  type TalentProfile,
  type TalentWork,
} from "../common/jobs";
import Appbar from "./appbar";
import { InstagramIcon } from "~/lib/icons/instagramIcon";

type SwipeDirection = "like" | "pass";
type Swipe = { profile: TalentProfile; direction: SwipeDirection };
type SignalWeights = Record<string, number>;

const INITIAL_ROLE_ID = "art";
const SWIPE_THRESHOLD = 92;
const EMPTY_TALENT_PROFILES: TalentProfile[] = [];

function formatHandle(handle: string) {
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function roleTag(roleKey: string) {
  return `role:${roleKey}`;
}

function artistTag(artist: string) {
  return `artist:${artist}`;
}

function profileSignals(profile: TalentProfile) {
  return [...profile.roleKeys.map(roleTag), ...profile.artists.map(artistTag)];
}

function scoreProfile(
  profile: TalentProfile,
  weights: SignalWeights,
  family: RoleFamily,
  explorationSeed: string,
) {
  const creditScore = Math.min(profile.works.length, 12) * 2.25;
  const breadthScore = Math.min(profile.artists.length, 8) * 1.2;
  const seniorityScore = profile.roleKeys.some((role) =>
    /(director|designer|producer|cinematographer|composer|editor|stylist)$/i.test(
      role,
    ),
  )
    ? 6
    : 2;
  const learnedScore = profileSignals(profile).reduce(
    (total, signal) => total + (weights[signal] ?? 0),
    0,
  );
  const explorationScore =
    (stableNumber(`${explorationSeed}:${family.id}:${profile.id}`) % 121) / 10;

  return (
    50 +
    creditScore +
    breadthScore +
    seniorityScore +
    learnedScore +
    explorationScore
  );
}

function updateWeights(
  current: SignalWeights,
  profile: TalentProfile,
  direction: SwipeDirection,
) {
  const next = { ...current };
  const roleDelta = direction === "like" ? 1.8 : -0.8;
  const artistDelta = direction === "like" ? 1.2 : -0.45;

  for (const role of profile.roleKeys) {
    const signal = roleTag(role);
    next[signal] = (next[signal] ?? 0) + roleDelta;
  }
  for (const artist of profile.artists) {
    const signal = artistTag(artist);
    next[signal] = (next[signal] ?? 0) + artistDelta;
  }
  return next;
}

function weightsFromSwipes(swipes: Swipe[]) {
  return swipes.reduce(
    (weights, swipe) => updateWeights(weights, swipe.profile, swipe.direction),
    {} as SignalWeights,
  );
}

function RolePicker({
  onStart,
}: {
  onStart: (role: RoleFamily, explorationSeed: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(INITIAL_ROLE_ID);
  const filteredRoles = ROLE_FAMILIES.filter((role) =>
    `${role.label} ${role.eyebrow} ${role.description}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  const selectedRole =
    ROLE_FAMILIES.find((role) => role.id === selectedId) ?? ROLE_FAMILIES[0];

  return (
    <main className="jobs-map-shell flex min-h-dvh flex-col overflow-x-hidden text-white">
      <Appbar />
      <section className="h-max-content relative flex w-full min-w-0 flex-1 items-start px-3 pt-24 pb-4 sm:px-8 sm:pt-32 sm:pb-8 lg:items-center lg:px-16 lg:py-32">
        <div className="h-max-content mx-auto flex w-full max-w-6xl min-w-0 flex-col items-start justify-center gap-2 xl:flex-row xl:gap-8">
          <div className="box-border h-full w-full max-w-xl min-w-0 overflow-hidden rounded-xl border-2 border-white/50 bg-black/25 p-4 drop-shadow-md backdrop-blur-md sm:rounded-2xl sm:border-[3px] sm:p-6">
            <div className="mb-4 flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-white uppercase drop-shadow-[0_0_3px_rgba(0,0,0,1)] sm:mb-7 sm:text-xs">
              Crew finder · 招募人才
            </div>
            <h1 className="max-w-2xl font-[Cute] text-[clamp(2.65rem,13vw,3.5rem)] leading-[0.86] tracking-[-0.055em] drop-shadow-[0_0_7px_rgba(0,0,0,0.9)]">
              Find the artists behind the music and the videos.
            </h1>
            <p className="mt-4 hidden max-w-lg text-sm leading-5 text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)] sm:mt-7 sm:block sm:text-lg sm:leading-7">
              Start with a department. We’ll surface people through their real
              Cantopop credits, then tune the next recommendations as you swipe.
            </p>
          </div>

          <div className="box-border w-full max-w-full min-w-0 overflow-hidden rounded-xl border-2 border-white/50 bg-black/25 p-2 drop-shadow-md backdrop-blur-md sm:rounded-2xl sm:border-[3px] sm:p-5">
            <div className="p-2 sm:p-5">
              <p className="text-xs font-bold tracking-[0.17em] text-white uppercase drop-shadow-[0_0_3px_rgba(0,0,0,1)]">
                What role are you hiring for?
              </p>
              <label className="mt-3 flex min-w-0 items-center gap-3 rounded-md bg-black/25 px-3 py-3 focus-within:bg-black/40 sm:mt-4 sm:px-4 sm:py-3.5">
                <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-white" />
                <span className="sr-only">Search departments</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try ‘art department’"
                  className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/60"
                />
              </label>
            </div>

            <div className="max-h-[23rem] min-w-0 space-y-1 overflow-y-auto overscroll-contain px-1 sm:max-h-[29rem] sm:px-3">
              {filteredRoles.map((role) => {
                const isSelected = role.id === selectedId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedId(role.id)}
                    className={`group flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3.5 ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "text-white hover:bg-white/15"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        isSelected
                          ? "border-white bg-white text-blue-500"
                          : "border-white/70"
                      }`}
                    >
                      {isSelected && (
                        <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">
                        {role.label}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-xs ${
                          isSelected ? "text-white/80" : "text-white/65"
                        }`}
                      >
                        {role.description}
                      </span>
                    </span>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5" />
                  </button>
                );
              })}
              {filteredRoles.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-white/70">
                  No department found. Try a broader search.
                </p>
              )}
            </div>

            <div className="mt-2 border-t border-white/30 p-2 pt-3 sm:mt-3 sm:p-5 sm:pt-5">
              <button
                type="button"
                disabled={!selectedRole}
                onClick={() =>
                  selectedRole &&
                  onStart(
                    selectedRole,
                    `${Date.now()}:${Math.random().toString(36).slice(2)}`,
                  )
                }
                className="flex min-h-12 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-md bg-blue-500 px-3 py-3 text-sm font-extrabold text-white drop-shadow-md transition hover:bg-blue-600 disabled:opacity-40 sm:gap-3 sm:px-5 sm:py-4"
              >
                <span className="min-w-0 truncate">
                  Start discovering {selectedRole?.label.toLocaleLowerCase()}
                </span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function selectedWorkFor(profile: TalentProfile, seed: number) {
  return profile.works[
    stableNumber(`${profile.id}:${seed}`) % profile.works.length
  ]!;
}

function worksByMusicVideo(works: TalentWork[]) {
  const musicVideos = new Map<
    string,
    TalentWork & { creditedRoles: string[] }
  >();

  for (const work of works) {
    const existing = musicVideos.get(work.locationId);
    if (existing) {
      if (!existing.creditedRoles.includes(work.role)) {
        existing.creditedRoles.push(work.role);
      }
      continue;
    }

    musicVideos.set(work.locationId, {
      ...work,
      creditedRoles: [work.role],
    });
  }

  return [...musicVideos.values()];
}

function WorkPlayer({
  profile,
  work,
}: {
  profile: TalentProfile;
  work: TalentWork;
}) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = youtubeEmbedUrl(work.url);

  return (
    <div className="relative aspect-video overflow-hidden rounded-t-lg bg-[#22211e]">
      {playing && embedUrl ? (
        <iframe
          src={`${embedUrl}&autoplay=1`}
          title={`${work.title} — work by ${profile.name}`}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative h-full w-full text-left"
          aria-label={`Play ${work.title}`}
        >
          <img src={work.image} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-white/50 bg-white/90 text-black shadow-xl transition group-hover:scale-105 sm:h-14 sm:w-14">
              <PlayIcon className="ml-0.5 h-5 w-5 fill-current" />
            </span>
          </span>
          <span
            className="absolute right-0 bottom-0 left-0 px-3 pt-10 pb-3 text-white backdrop-blur-[0.5px] sm:right-0 sm:bottom-0 sm:left-0 sm:px-5 sm:pb-2"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.95) 100%)",
            }}
          >
            <span className="block truncate text-sm font-extrabold sm:text-lg">
              {work.title}
            </span>
            <span className="mt-0.5 block truncate text-xs text-white/75">
              {work.artists.join(", ")}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

function WorkContributors({
  contributors,
  work,
  recommendedIds,
  onRecommend,
}: {
  contributors: TalentProfile[];
  work: TalentWork;
  recommendedIds: Set<string>;
  onRecommend: (profile: TalentProfile) => void;
}) {
  const groups = useMemo(() => {
    const result: Record<ContributorCategory, Map<string, TalentProfile[]>> = {
      song: new Map(),
      musicVideo: new Map(),
    };

    for (const contributor of contributors) {
      for (const credit of contributor.works) {
        if (credit.locationId !== work.locationId) continue;
        const people = result[credit.category].get(credit.role) ?? [];
        if (!people.some((person) => person.id === contributor.id)) {
          people.push(contributor);
        }
        result[credit.category].set(credit.role, people);
      }
    }

    return result;
  }, [contributors, work.locationId]);

  return (
    <div className="relative h-full rounded-t-lg border-2 border-white/50 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-md"
      />
      <div className="relative h-full overflow-y-auto px-4 py-16 pt-10 sm:px-5 sm:py-4">
        <div className="mt-10 border-b border-white/50 pb-2">
          <h3 className="truncate font-serif text-lg font-bold drop-shadow-sm">
            {work.title}
          </h3>
          <p className="truncate text-xs text-white/65">
            {work.artists.join(", ")} · {contributors.length} contributors
          </p>
        </div>

        <ContributorCreditSection
          title="Song"
          groups={groups.song}
          recommendedIds={recommendedIds}
          onRecommend={onRecommend}
        />
        {groups.song.size > 0 && groups.musicVideo.size > 0 && (
          <hr className="my-2 border-white/30" />
        )}
        <ContributorCreditSection
          title="Music Video"
          groups={groups.musicVideo}
          recommendedIds={recommendedIds}
          onRecommend={onRecommend}
        />
      </div>
    </div>
  );
}

function ContributorCreditSection({
  title,
  groups,
  recommendedIds,
  onRecommend,
}: {
  title: string;
  groups: Map<string, TalentProfile[]>;
  recommendedIds: Set<string>;
  onRecommend: (profile: TalentProfile) => void;
}) {
  if (groups.size === 0) return null;

  return (
    <section className="mt-2" aria-label={`${title} contributors`}>
      <h4 className="mb-1 text-center text-sm font-bold">{title}</h4>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-[repeat(auto-fit,minmax(min(9rem,100%),1fr))]">
        {[...groups.entries()].map(([role, people]) => (
          <div key={role} className="min-w-0">
            <p className="mb-0.5 text-xs font-bold wrap-break-word">{role}</p>
            <div className="space-y-0.5 font-normal">
              {people.map((contributor) => {
                const isRecommended = recommendedIds.has(contributor.id);

                return (
                  <div
                    key={contributor.id}
                    className="flex min-w-0 items-center gap-1 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {contributor.name}
                    </span>
                    {contributor.instagram && (
                      <a
                        href={`https://www.instagram.com/${contributor.instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-white/75 hover:text-white"
                        aria-label={`Open ${contributor.name} on Instagram`}
                      >
                        <InstagramIcon className="h-5 w-5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onRecommend(contributor)}
                      disabled={isRecommended}
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                        isRecommended
                          ? "border-blue-400 bg-blue-500 text-white"
                          : "border-white/50 bg-white/10 text-white hover:bg-white/20"
                      }`}
                      aria-label={
                        isRecommended
                          ? `${contributor.name} is recommended`
                          : `Add ${contributor.name} to recommended`
                      }
                    >
                      {isRecommended ? (
                        <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TalentCardBack({
  profile,
  contributors,
  recommendedIds,
  seed,
}: {
  profile: TalentProfile;
  contributors: TalentProfile[];
  recommendedIds: Set<string>;
  seed: number;
}) {
  return (
    <div
      aria-hidden="true"
      ref={(element) => element?.setAttribute("inert", "")}
      className="jobs-talent-card-back pointer-events-none absolute inset-0"
    >
      <TalentCard
        profile={profile}
        contributors={contributors}
        recommendedIds={recommendedIds}
        seed={seed}
        dragX={0}
        dragging={false}
        onPointerDown={() => undefined}
        onPointerMove={() => undefined}
        onPointerUp={() => undefined}
        onRecommend={() => undefined}
      />
    </div>
  );
}

function TalentCard({
  profile,
  nextProfile,
  nextContributors = EMPTY_TALENT_PROFILES,
  contributors,
  recommendedIds,
  seed,
  dragX,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRecommend,
}: {
  profile: TalentProfile;
  nextProfile?: TalentProfile;
  nextContributors?: TalentProfile[];
  contributors: TalentProfile[];
  recommendedIds: Set<string>;
  seed: number;
  dragX: number;
  dragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onRecommend: (profile: TalentProfile) => void;
}) {
  const [activeTab, setActiveTab] = useState<"work" | "contributors">("work");
  const rotation = Math.max(-8, Math.min(8, dragX / 28));
  const cardStyle = {
    "--drag-x": `${dragX}px`,
    "--drag-rotate": `${rotation}deg`,
  } as CSSProperties;
  const otherWorks = worksByMusicVideo(profile.works);
  const selectedWork = selectedWorkFor(profile, seed);

  return (
    <div className="jobs-talent-card-enter relative z-100 mx-auto w-full max-w-[43rem]">
      {nextProfile && (
        <TalentCardBack
          profile={nextProfile}
          contributors={nextContributors}
          recommendedIds={recommendedIds}
          seed={seed}
        />
      )}
      <div
        className={`jobs-talent-card relative touch-pan-y rounded-lg bg-transparent text-black shadow-xl select-none ${dragging ? "is-dragging" : ""} ${dragX !== 0 ? "is-offset" : ""}`}
        style={cardStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="pointer-events-none absolute top-7 left-6 z-20 -rotate-8 rounded-lg border-4 border-[#eb4932] px-3 py-1 text-2xl font-black tracking-wider text-[#eb4932] uppercase"
          style={{ opacity: Math.max(0, -dragX / SWIPE_THRESHOLD) }}
        >
          Pass
        </div>
        <div
          className="pointer-events-none absolute top-7 right-6 z-20 rotate-8 rounded-lg border-4 border-blue-500 px-3 py-1 text-2xl font-black tracking-wider text-blue-500 uppercase"
          style={{ opacity: Math.max(0, dragX / SWIPE_THRESHOLD) }}
        >
          鍾意
        </div>

        <div className="absolute top-0 z-99 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
          <div
            className="grid grid-cols-2 rounded-lg bg-black/35 p-1"
            role="tablist"
            aria-label="Talent card view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "work"}
              onClick={() => setActiveTab("work")}
              className={`rounded-md px-3 py-2 text-[10px] font-extrabold tracking-[0.12em] uppercase transition ${
                activeTab === "work"
                  ? "bg-white text-black shadow"
                  : "text-white/65 hover:text-white"
              }`}
            >
              MUSIC VIDEO
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "contributors"}
              onClick={() => setActiveTab("contributors")}
              className={`rounded-md px-3 py-2 text-[10px] font-extrabold tracking-[0.12em] uppercase transition ${
                activeTab === "contributors"
                  ? "bg-white text-black shadow"
                  : "text-white/65 hover:text-white"
              }`}
            >
              CREDITS · {contributors.length}
            </button>
          </div>
        </div>
        <div className="aspect-video">
          {activeTab === "work" ? (
            <WorkPlayer profile={profile} work={selectedWork} />
          ) : (
            <WorkContributors
              contributors={contributors}
              work={selectedWork}
              recommendedIds={recommendedIds}
              onRecommend={onRecommend}
            />
          )}
        </div>

        <div className="rounded-b-lg bg-white p-4 sm:p-7">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-[Cute] text-3xl leading-none sm:text-4xl">
                  {profile.name}
                </h2>
                {profile.instagram !== null ? (
                  <a
                    href={`https://www.instagram.com/${profile.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <InstagramIcon className="h-9 w-9 text-black sm:h-10 sm:w-10" />
                    <span className="sr-only">
                      Open {profile.name} on Instagram
                    </span>
                  </a>
                ) : (
                  <a
                    href="mailto:devon@langpal.com.hk"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 font-[Cute] text-black underline"
                  >
                    <EnvelopeIcon className="h-8 w-8 text-black" />
                    <span className="sr-only">Contact {profile.name}</span>
                  </a>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-bold text-blue-500">
                  {profile.roles[0]}
                </span>
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#77736a] underline decoration-[#bbb5aa] underline-offset-4 hover:text-black"
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    {formatHandle(profile.instagram)}
                  </a>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="block text-xl font-black sm:text-2xl">
                {profile.works.length}
              </span>
              <span className="block text-[10px] font-bold tracking-[0.14em] text-[#77736a] uppercase">
                verified credits
              </span>
            </div>
          </div>

          {profile.roles.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.roles.slice(1, 4).map((role) => (
                <span
                  key={role}
                  className="rounded-md border border-black/20 bg-black/5 px-2.5 py-1 text-[10px] font-bold text-[#68645c]"
                >
                  {role}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-[#ddd7cb] pt-4 sm:mt-6 sm:pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold tracking-[0.16em] uppercase">
                More work
              </h3>
              <span className="text-[10px] text-[#888278]">
                {profile.artists.length} artist
                {profile.artists.length === 1 ? "" : "s"}
              </span>
            </div>
            <div
              className="-mx-4 flex touch-pan-x gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:mx-0 sm:gap-5 sm:px-0"
              onPointerDown={(event) => event.stopPropagation()}
            >
              {otherWorks.map((work) => (
                <a
                  key={work.id}
                  href={work.url
                    .replace(/([?&])t=\d+s?(&|$)/, "$1")
                    .replace(/[?&]$/, "")}
                  target="_blank"
                  rel="noreferrer"
                  className="group w-[8.5rem] shrink-0 sm:w-[9.25rem]"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-lg bg-[#ded9ce]">
                    <img
                      src={work.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-1.5 truncate text-xs font-bold group-hover:underline">
                    {work.title}
                  </p>
                  <p className="truncate text-[10px] text-[#77736a]">
                    {work.creditedRoles.join(" · ")}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscoveryDeck({
  role,
  explorationSeed,
  onChangeRole,
}: {
  role: RoleFamily;
  explorationSeed: string;
  onChangeRole: () => void;
}) {
  const profiles = useMemo(() => buildTalentProfiles(role), [role]);
  const allProfiles = useMemo(() => buildAllTalentProfiles(), []);
  const workSeed = useMemo(
    () => stableNumber(`${explorationSeed}:selected-work`),
    [explorationSeed],
  );
  const [swipes, setSwipes] = useState<Swipe[]>([]);
  const [weights, setWeights] = useState<SignalWeights>({});
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [departing, setDeparting] = useState<SwipeDirection | null>(null);
  const [showShortlist, setShowShortlist] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(
    null,
  );
  const pointerStart = useRef<number | null>(null);

  const swipedIds = useMemo(
    () => new Set(swipes.map((swipe) => swipe.profile.id)),
    [swipes],
  );
  const rankedProfiles = useMemo(
    () =>
      profiles
        .filter((profile) => !swipedIds.has(profile.id))
        .toSorted(
          (left, right) =>
            scoreProfile(right, weights, role, explorationSeed) -
            scoreProfile(left, weights, role, explorationSeed),
        ),
    [explorationSeed, profiles, role, swipedIds, weights],
  );
  const current =
    rankedProfiles.find((profile) => profile.id === activeProfileId) ??
    rankedProfiles[0];
  const next = rankedProfiles.find((profile) => profile.id !== current?.id);
  const shortlisted = swipes.filter((swipe) => swipe.direction === "like");
  const recommendedIds = useMemo(
    () => new Set(shortlisted.map(({ profile }) => profile.id)),
    [shortlisted],
  );
  const selectedWork = current ? selectedWorkFor(current, workSeed) : undefined;
  const nextSelectedWork = next ? selectedWorkFor(next, workSeed) : undefined;
  const workContributors = useMemo(
    () =>
      selectedWork
        ? allProfiles
            .filter((profile) =>
              profile.works.some(
                (work) => work.locationId === selectedWork.locationId,
              ),
            )
            .toSorted((left, right) => {
              if (left.id === current?.id) return -1;
              if (right.id === current?.id) return 1;
              return right.works.length - left.works.length;
            })
        : [],
    [allProfiles, current?.id, selectedWork],
  );
  const nextWorkContributors = useMemo(
    () =>
      nextSelectedWork
        ? allProfiles
            .filter((profile) =>
              profile.works.some(
                (work) => work.locationId === nextSelectedWork.locationId,
              ),
            )
            .toSorted((left, right) => {
              if (left.id === next?.id) return -1;
              if (right.id === next?.id) return 1;
              return right.works.length - left.works.length;
            })
        : [],
    [allProfiles, next?.id, nextSelectedWork],
  );

  function commitSwipe(direction: SwipeDirection) {
    if (!current || departing) return;
    setDeparting(direction);
    setDragX(direction === "like" ? 720 : -720);
    window.setTimeout(() => {
      // Keep the card that was already visible underneath at the front of the
      // deck. The updated recommendation weights should only rank cards after it.
      setActiveProfileId(next?.id ?? null);
      setSwipes((previous) => [...previous, { profile: current, direction }]);
      setWeights((previous) => updateWeights(previous, current, direction));
      setDeparting(null);
      setDragging(false);
      setDragX(0);
    }, 250);
  }

  function undoLastSwipe() {
    if (swipes.length === 0) return;
    setActiveProfileId(swipes.at(-1)!.profile.id);
    const remainingSwipes = swipes.slice(0, -1);
    setWeights(weightsFromSwipes(remainingSwipes));
    setSwipes(remainingSwipes);
  }

  function recommendProfile(profile: TalentProfile) {
    if (recommendedIds.has(profile.id) || departing) return;
    if (profile.id === current?.id) {
      commitSwipe("like");
      return;
    }

    const nextSwipes = [
      ...swipes.filter((swipe) => swipe.profile.id !== profile.id),
      { profile, direction: "like" as const },
    ];
    setSwipes(nextSwipes);
    setWeights(weightsFromSwipes(nextSwipes));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") commitSwipe("pass");
      if (event.key === "ArrowRight") commitSwipe("like");
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "z"
      ) {
        event.preventDefault();
        undoLastSwipe();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, iframe")) return;
    pointerStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    setDragX(event.clientX - pointerStart.current);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) >= SWIPE_THRESHOLD) {
      commitSwipe(distance > 0 ? "like" : "pass");
    } else {
      setDragging(false);
      setDragX(0);
    }
  }

  return (
    <main className="jobs-map-shell min-h-dvh overflow-x-hidden text-white">
      <Appbar suffix={"jobs"} />
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[96rem] lg:grid-cols-[18rem_minmax(0,1fr)_18rem]">
        <aside className="mt-28 hidden h-fit rounded-2xl border-[3px] border-white/50 bg-black/25 p-6 backdrop-blur-md lg:flex lg:flex-col">
          <button
            type="button"
            onClick={onChangeRole}
            className="flex items-center gap-2 self-start text-xs font-bold text-white/75 hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Change department
          </button>
          <div className="mt-10">
            <p className="text-[10px] font-bold tracking-[0.17em] text-white/60 uppercase">
              Hiring for
            </p>
            <h1 className="mt-2 font-[Cute] text-4xl leading-none drop-shadow-[0_0_4px_rgba(0,0,0,1)]">
              {role.label}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {role.description}
            </p>
          </div>
        </aside>

        <section className="min-w-0 px-3 pt-24 pb-8 sm:px-8 sm:pt-28 sm:pb-10 lg:mt-20 lg:py-8">
          <div className="mx-auto mb-3 flex max-w-[43rem] items-center justify-between gap-3 sm:mb-5 lg:hidden">
            <button
              type="button"
              onClick={onChangeRole}
              className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-md bg-black/30 px-3 text-xs font-bold backdrop-blur-sm"
            >
              <ArrowLeftIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{role.label}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowShortlist(true)}
              className="min-h-11 shrink-0 rounded-md bg-black/40 px-3 text-xs font-bold text-white backdrop-blur-sm"
            >
              Recommended: {shortlisted.length}
            </button>
          </div>

          {current ? (
            <>
              <TalentCard
                key={`${current.id}:${selectedWork?.id}`}
                profile={current}
                nextProfile={next}
                nextContributors={nextWorkContributors}
                contributors={workContributors}
                recommendedIds={recommendedIds}
                seed={workSeed}
                dragX={dragX}
                dragging={dragging || departing !== null}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onRecommend={recommendProfile}
              />

              <div className="mx-auto mt-4 flex max-w-[43rem] items-center justify-center gap-5 sm:gap-7">
                <button
                  type="button"
                  onClick={undoLastSwipe}
                  disabled={swipes.length === 0 || departing !== null}
                  className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/80 bg-black/35 text-white backdrop-blur-sm transition active:scale-95 disabled:opacity-35"
                  aria-label="Undo last swipe"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => commitSwipe("pass")}
                  disabled={departing !== null}
                  className="grid h-14 w-14 place-items-center rounded-full border-2 border-white bg-white text-[#eb4932] shadow-lg transition active:scale-95 disabled:opacity-50"
                  aria-label={`Pass on ${current.name}`}
                >
                  <XMarkIcon className="h-7 w-7" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => commitSwipe("like")}
                  disabled={departing !== null}
                  className="grid h-14 w-14 place-items-center rounded-full border-2 border-white bg-blue-500 text-white shadow-lg transition active:scale-95 disabled:opacity-50"
                  aria-label={`Shortlist ${current.name}`}
                >
                  <CheckIcon className="h-7 w-7" strokeWidth={2.5} />
                </button>
              </div>

              <p className="mt-2 text-center text-base font-semibold tracking-[0.08em] text-white uppercase drop-shadow-[0_0_3px_rgba(0,0,0,1)] sm:mt-3 sm:text-[10px]">
                Swipe or tap to pass and shortlist
              </p>
            </>
          ) : (
            <div className="mx-auto flex min-h-[65dvh] max-w-xl flex-col items-center justify-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-white bg-blue-500 text-white">
                <CheckIcon className="h-8 w-8" />
              </span>
              <h2 className="mt-6 font-[Cute] text-5xl">
                You’ve seen the whole department.
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/75">
                You shortlisted {shortlisted.length} people from{" "}
                {profiles.length} profiles.
              </p>
              <button
                type="button"
                onClick={() => setShowShortlist(true)}
                className="mt-7 rounded-md border-2 border-white bg-blue-500 px-6 py-3 text-sm font-bold text-white"
              >
                Review shortlist
              </button>
            </div>
          )}
        </section>

        <aside className="fixed right-0 hidden h-full w-1/5 rounded-md border-[3px] border-l border-white/50 bg-black/25 p-6 backdrop-blur-md lg:block">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold tracking-[0.15em] uppercase">
              Recommended
            </h2>
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {shortlisted.length}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {shortlisted.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/50 bg-black/20 px-5 py-9 text-center">
                <p className="text-sm font-bold">No one here yet</p>
                <p className="mt-1 text-[11px] leading-5 text-white/60">
                  Swipe right when someone’s work catches your eye.
                </p>
              </div>
            ) : (
              shortlisted
                .slice(-5)
                .reverse()
                .map(({ profile }) => (
                  <div key={profile.id} className="flex items-center gap-3">
                    <img
                      src={profile.works[0]!.image}
                      alt=""
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold">
                        {profile.name}
                      </p>
                      <p className="truncate text-[10px] text-white/60">
                        {profile.roles[0]}
                      </p>
                    </div>

                    {profile.instagram !== null ? (
                      <a
                        href={`https://www.instagram.com/${profile.instagram}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${profile.name} on Instagram`}
                      >
                        <InstagramIcon className="h-10 w-10" />
                      </a>
                    ) : (
                      <a
                        href="mailto:devon@langpal.com.hk"
                        target="_blank"
                        rel="noreferrer"
                        className="font-[Cute] text-white underline"
                      >
                        Contact
                      </a>
                    )}
                  </div>
                ))
            )}
          </div>
        </aside>
      </div>

      {showShortlist && (
        <div className="fixed inset-0 z-130 flex items-start justify-center p-3 backdrop-blur-md sm:p-6">
          <div className="relative top-20 m-3 max-h-[calc(100dvh-9rem)] w-full overflow-y-auto overscroll-contain rounded-2xl border-2 border-white/50 bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-2xl backdrop-blur-md sm:max-h-[85dvh] sm:border-[3px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-white/60 uppercase">
                  Your recommended people
                </p>
                <h2 className="mt-1 font-[Cute] text-3xl sm:text-4xl">
                  Shortlist · {shortlisted.length}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowShortlist(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/60"
                aria-label="Close shortlist"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
              {shortlisted.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/50 p-8 text-center text-sm text-white/70">
                  Shortlist people to collect them here.
                </p>
              ) : (
                shortlisted.map(({ profile }) => {
                  const isExpanded = expandedProfileId === profile.id;
                  const panelId = `shortlist-work-${profile.id}`;

                  return (
                    <div
                      key={profile.id}
                      className="overflow-hidden rounded-lg border border-white/35 bg-black/25"
                    >
                      <div className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedProfileId(isExpanded ? null : profile.id)
                          }
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          aria-expanded={isExpanded}
                          aria-controls={panelId}
                        >
                          <img
                            src={profile.works[0]!.image}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover sm:h-14 sm:w-14 sm:rounded-xl"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold">
                              {profile.name}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-white/60">
                              {profile.roles[0]} · {profile.works.length}{" "}
                              credits
                            </span>
                          </span>
                          More
                          <ChevronRightIcon
                            className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>

                        {profile.instagram !== null ? (
                          <a
                            href={`https://www.instagram.com/${profile.instagram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                            aria-label={`Open ${profile.name} on Instagram`}
                          >
                            <InstagramIcon className="h-9 w-9" />
                          </a>
                        ) : (
                          <a
                            href="mailto:devon@langpal.com.hk"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                            aria-label={`Email about ${profile.name}`}
                          >
                            <EnvelopeIcon className="h-8 w-8" />
                          </a>
                        )}
                      </div>

                      {isExpanded && (
                        <div
                          id={panelId}
                          className="border-t border-white/20 px-2.5 py-3 sm:px-3"
                        >
                          <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-white/60 uppercase">
                            All credited work
                          </p>
                          <div className="space-y-2">
                            {profile.works.map((work) => (
                              <a
                                key={work.id}
                                href={work.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 rounded-md bg-black/20 p-2 transition hover:bg-black/35"
                              >
                                <img
                                  src={work.image}
                                  alt=""
                                  loading="lazy"
                                  className="aspect-video w-20 shrink-0 rounded object-cover sm:w-24"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-bold">
                                    {work.title}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[10px] text-white/55">
                                    {work.artists.join(", ")}
                                  </span>
                                  <span className="mt-1 block text-[10px] font-bold text-blue-200">
                                    {work.role}
                                  </span>
                                </span>
                                <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0 text-white/60" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function JobsPage() {
  const [selection, setSelection] = useState<{
    role: RoleFamily;
    explorationSeed: string;
  } | null>(null);

  if (!selection) {
    return (
      <RolePicker
        onStart={(role, explorationSeed) =>
          setSelection({ role, explorationSeed })
        }
      />
    );
  }

  return (
    <DiscoveryDeck
      key={`${selection.role.id}:${selection.explorationSeed}`}
      role={selection.role}
      explorationSeed={selection.explorationSeed}
      onChangeRole={() => setSelection(null)}
    />
  );
}
