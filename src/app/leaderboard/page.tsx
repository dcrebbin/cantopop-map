"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { LOCATIONS, humanizeRoleKey } from "../common/locations";

type CategoryFilter = "all" | "song" | "musicVideo";

interface ContributorStats {
  name: string;
  totalCredits: number;
  songCredits: number;
  musicVideoCredits: number;
}

const BLOSSOMS = [
  {
    x: "4%",
    size: "15px",
    delay: "-1s",
    duration: "15s",
    drift: "18vw",
    rotate: "12deg",
    opacity: 0.72,
  },
  {
    x: "11%",
    size: "11px",
    delay: "-7s",
    duration: "19s",
    drift: "24vw",
    rotate: "84deg",
    opacity: 0.55,
  },
  {
    x: "18%",
    size: "18px",
    delay: "-12s",
    duration: "17s",
    drift: "15vw",
    rotate: "132deg",
    opacity: 0.78,
  },
  {
    x: "24%",
    size: "10px",
    delay: "-3s",
    duration: "21s",
    drift: "30vw",
    rotate: "48deg",
    opacity: 0.5,
  },
  {
    x: "32%",
    size: "14px",
    delay: "-9s",
    duration: "16s",
    drift: "20vw",
    rotate: "210deg",
    opacity: 0.68,
  },
  {
    x: "39%",
    size: "20px",
    delay: "-15s",
    duration: "23s",
    drift: "27vw",
    rotate: "164deg",
    opacity: 0.6,
  },
  {
    x: "46%",
    size: "12px",
    delay: "-4s",
    duration: "18s",
    drift: "16vw",
    rotate: "296deg",
    opacity: 0.62,
  },
  {
    x: "53%",
    size: "16px",
    delay: "-11s",
    duration: "20s",
    drift: "23vw",
    rotate: "24deg",
    opacity: 0.74,
  },
  {
    x: "61%",
    size: "9px",
    delay: "-6s",
    duration: "14s",
    drift: "14vw",
    rotate: "252deg",
    opacity: 0.5,
  },
  {
    x: "68%",
    size: "17px",
    delay: "-14s",
    duration: "22s",
    drift: "19vw",
    rotate: "112deg",
    opacity: 0.7,
  },
  {
    x: "75%",
    size: "13px",
    delay: "-2s",
    duration: "17s",
    drift: "25vw",
    rotate: "72deg",
    opacity: 0.58,
  },
  {
    x: "82%",
    size: "19px",
    delay: "-10s",
    duration: "24s",
    drift: "17vw",
    rotate: "188deg",
    opacity: 0.66,
  },
  {
    x: "89%",
    size: "12px",
    delay: "-5s",
    duration: "16s",
    drift: "12vw",
    rotate: "320deg",
    opacity: 0.6,
  },
  {
    x: "96%",
    size: "15px",
    delay: "-13s",
    duration: "21s",
    drift: "22vw",
    rotate: "142deg",
    opacity: 0.52,
  },
] as const;

type ContributorBuckets = {
  song?: Record<string, string[]>;
  musicVideo?: Record<string, string[]>;
} | null;

type BlossomStyle = CSSProperties & {
  "--x": string;
  "--size": string;
  "--delay": string;
  "--duration": string;
  "--drift-quarter": string;
  "--drift-half": string;
  "--drift-three-quarter": string;
  "--drift-full": string;
  "--rotate": string;
  "--opacity": number;
};

function scaleVw(value: string, scale: number) {
  return `${Number.parseFloat(value) * scale}vw`;
}

function FallingCherryBlossoms() {
  return (
    <div className="cherry-blossom-field pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {BLOSSOMS.map((blossom, index) => {
        const style: BlossomStyle = {
          "--x": blossom.x,
          "--size": blossom.size,
          "--delay": blossom.delay,
          "--duration": blossom.duration,
          "--drift-quarter": scaleVw(blossom.drift, 0.25),
          "--drift-half": scaleVw(blossom.drift, -0.15),
          "--drift-three-quarter": scaleVw(blossom.drift, 0.35),
          "--drift-full": blossom.drift,
          "--rotate": blossom.rotate,
          "--opacity": blossom.opacity,
        };

        return (
          <span
            key={`${blossom.x}-${index}`}
            className="cherry-blossom-petal"
            style={style}
          />
        );
      })}
    </div>
  );
}

function getContributors(
  location: (typeof LOCATIONS)[number],
): ContributorBuckets {
  return (
    (
      location as unknown as {
        contributors?: ContributorBuckets;
      }
    ).contributors ?? null
  );
}

function createFilterOptions() {
  const artistOptions = new Set<string>();
  const roleOptions = new Set<string>();

  for (const location of LOCATIONS) {
    location.artists.forEach((artist) => artistOptions.add(artist));

    const contributors = getContributors(location);
    if (!contributors) continue;

    for (const bucket of [contributors.song, contributors.musicVideo]) {
      if (!bucket) continue;
      for (const roleKey of Object.keys(bucket)) {
        roleOptions.add(humanizeRoleKey(roleKey));
      }
    }
  }

  return {
    artists: Array.from(artistOptions).sort((a, b) => a.localeCompare(b)),
    roles: Array.from(roleOptions).sort((a, b) => a.localeCompare(b)),
  };
}

function createRows({
  artistFilter,
  categoryFilter,
  roleFilter,
}: {
  artistFilter: string;
  categoryFilter: CategoryFilter;
  roleFilter: string;
}) {
  const byContributor = new Map<
    string,
    {
      songCredits: number;
      musicVideoCredits: number;
    }
  >();

  for (const location of LOCATIONS) {
    const hasArtist =
      artistFilter === "all" || location.artists.includes(artistFilter);
    if (!hasArtist) continue;

    const contributors = getContributors(location);
    if (!contributors) continue;

    const upsert = (name: string) => {
      let entry = byContributor.get(name);
      if (!entry) {
        entry = {
          songCredits: 0,
          musicVideoCredits: 0,
        };
        byContributor.set(name, entry);
      }
      return entry;
    };

    const applyBucket = (
      bucket: Record<string, string[]> | undefined,
      target: "songCredits" | "musicVideoCredits",
    ) => {
      if (!bucket) return;
      for (const roleKey of Object.keys(bucket)) {
        const role = humanizeRoleKey(roleKey);
        if (roleFilter !== "all" && role !== roleFilter) continue;

        for (const person of bucket[roleKey] ?? []) {
          if (!person || person.trim().length === 0) continue;
          const entry = upsert(person);
          entry[target] += 1;
        }
      }
    };

    if (categoryFilter === "all" || categoryFilter === "song") {
      applyBucket(contributors.song, "songCredits");
    }
    if (categoryFilter === "all" || categoryFilter === "musicVideo") {
      applyBucket(contributors.musicVideo, "musicVideoCredits");
    }
  }

  const rows: ContributorStats[] = Array.from(byContributor.entries()).map(
    ([name, values]) => ({
      name,
      songCredits: values.songCredits,
      musicVideoCredits: values.musicVideoCredits,
      totalCredits: values.songCredits + values.musicVideoCredits,
    }),
  );

  rows.sort(
    (a, b) => b.totalCredits - a.totalCredits || a.name.localeCompare(b.name),
  );

  return {
    rows,
  };
}

function LeaderboardPage() {
  const [query, setQuery] = useState("");
  const [artistFilter, setArtistFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const filterOptions = useMemo(() => createFilterOptions(), []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const { rows } = createRows({ artistFilter, categoryFilter, roleFilter });

    if (q.length === 0) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q));
  }, [artistFilter, categoryFilter, query, roleFilter]);

  return (
    <div className="relative flex max-h-screen w-screen flex-col items-center justify-center overflow-hidden">
      <FallingCherryBlossoms />
      <main className="relative z-10 my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col gap-5 rounded-lg bg-black/70 p-4 text-white backdrop-blur-lg sm:p-6">
        <div className="z-1">
          <h1 className="font-serif text-3xl font-bold">
            Cantopop地圖 Leaderboard
          </h1>
        </div>
        <section className="z-1 grid grid-cols-1 gap-3 rounded-lg border border-white/20 bg-black/20 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contributor"
            className="rounded-md border border-white/30 bg-black/40 px-3 py-2 text-sm outline-none ring-white/40 placeholder:text-white/50 focus:ring-2"
          />
          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="rounded-md border border-white/30 bg-black/40 px-3 py-2 text-sm outline-none ring-white/40 focus:ring-2"
          >
            <option value="all">All artists</option>
            {filterOptions.artists.map((artist) => (
              <option key={artist} value={artist}>
                {artist}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as CategoryFilter)
            }
            className="rounded-md border border-white/30 bg-black/40 px-3 py-2 text-sm outline-none ring-white/40 focus:ring-2"
          >
            <option value="all">All categories</option>
            <option value="song">Song credits only</option>
            <option value="musicVideo">Music video credits only</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-white/30 bg-black/40 px-3 py-2 text-sm outline-none ring-white/40 focus:ring-2"
          >
            <option value="all">All roles</option>
            {filterOptions.roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </section>

        <section className="z-1 overflow-y-auto rounded-lg border border-white/20 bg-black/20">
          <div className="grid grid-cols-[64px_1fr_110px_110px_110px] gap-2 border-b border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
            <span>#</span>
            <span>Contributor</span>
            <span className="text-right">Total</span>
            <span className="text-right">Song</span>
            <span className="text-right">MV</span>
          </div>
          <ul>
            {filteredRows.length === 0 ? (
              <li className="px-3 py-4 text-sm text-white/70">
                No contributors match these filters.
              </li>
            ) : (
              filteredRows.map((row, index) => (
                <li
                  key={row.name}
                  className="grid grid-cols-[64px_1fr_110px_110px_110px] gap-2 border-b border-white/10 px-3 py-2 text-sm last:border-b-0"
                >
                  <span className="text-white/70">{index + 1}</span>
                  <span className="truncate">{row.name}</span>
                  <span className="text-right font-semibold">
                    {row.totalCredits}
                  </span>
                  <span className="text-right text-white/80">
                    {row.songCredits}
                  </span>
                  <span className="text-right text-white/80">
                    {row.musicVideoCredits}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
      <div className="fixed left-0 top-0 z-[-2] h-screen w-screen bg-[url('/images/hk.jpg')] bg-cover bg-center blur-sm"></div>
    </div>
  );
}

export default LeaderboardPage;
