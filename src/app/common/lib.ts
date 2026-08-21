import { z } from "zod";
import { RAW_LOCATIONS } from "./locations";

// Zod schema for raw items as written in the data file
const ContributorsSchema = z
  .object({
    song: z
      .record(
        z.array(
          z.string().or(z.object({ name: z.string(), instagram: z.string() })),
        ),
      )
      .optional(),
    musicVideo: z
      .record(
        z.array(
          z.string().or(z.object({ name: z.string(), instagram: z.string() })),
        ),
      )
      .optional(),
  })
  .optional();

const OptionalUrlSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().url().optional(),
);

const RawLocationSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]).optional(), // [lat, lng] as authored
  artists: z.array(z.string()),
  address: z.string().optional(),
  name: z.string().or(z.object({ name: z.string(), instagram: z.string() })),
  url: z.string().url(),
  image: z.string().url(),
  streetView: OptionalUrlSchema,
  streetViewEmbed: OptionalUrlSchema,
  mapEmbed: OptionalUrlSchema,
  isCustom: z.boolean().optional(),
  contributors: ContributorsSchema,
});

// Normalized item with guaranteed lng/lat ordering, and a stable id
const LocationItemSchema = RawLocationSchema.transform((raw) => {
  const [lat, lng] = raw.coordinates ?? [null, null];
  const name = typeof raw.name === "string" ? raw.name : raw.name.name;
  const locationKey =
    lat === null || lng === null
      ? "no-coordinates"
      : `${lat.toFixed(6)}-${lng.toFixed(6)}`;
  const id = `${raw.artists.join(", ")}-${name}-${locationKey}`;
  return {
    id,
    artists: raw.artists,
    address: raw.address ?? null,
    name,
    url: raw.url,
    image: raw.image,
    lat,
    lng,
    streetView: raw.streetView ?? null,
    streetViewEmbed: raw.streetViewEmbed ?? null,
    mapEmbed: raw.mapEmbed ?? null,
    isCustom: raw.isCustom ?? false,
    hidden: !raw.coordinates || !raw.address,
    contributors: raw.contributors ?? null,
  };
});

export type RawLocationSchema = z.infer<typeof RawLocationSchema>;

export type LocationItem = z.infer<typeof LocationItemSchema>;
export type MappableLocationItem = LocationItem & {
  address: string;
  lat: number;
  lng: number;
  hidden: false;
};
export type ContributorCredit = string | { name: string; instagram: string };

export function getContributorName(contributor: ContributorCredit): string {
  return typeof contributor === "string" ? contributor : contributor.name;
}

export function getContributorInstagram(
  contributor: ContributorCredit,
): string | null {
  if (typeof contributor !== "string") return contributor.instagram;
  const [, handle] = contributor.split("@");
  return handle ?? null;
}

export function getContributorDisplayName(
  contributor: ContributorCredit,
): string {
  if (typeof contributor === "string") return contributor;
  return `${contributor.name} (@${contributor.instagram})`;
}

const SLUG_LOCATIONS = RAW_LOCATIONS.map((location: RawLocationSchema) => {
  const title = constructTitle(location);
  return { [title]: location };
});

export function constructTitle(
  location:
    | LocationItem
    | { name: RawLocationSchema["name"]; artists: string[] },
) {
  const name =
    typeof location.name === "string" ? location.name : location.name.name;
  const songTitle = name.replace(/ /g, "-");
  const artists = location?.artists.join("-").replace(/ /g, "-") ?? "";

  return `${artists}-${songTitle}`;
}

export const nameToLocation = RAW_LOCATIONS.reduce(
  (acc, location) => {
    const title = constructTitle(location);
    acc[title] = LocationItemSchema.parse(location);
    return acc;
  },
  {} as Record<string, LocationItem>,
);

// Validate and normalize at module load; throws early if data is invalid
export const LOCATIONS: LocationItem[] = z
  .array(LocationItemSchema)
  .parse(RAW_LOCATIONS);

export const MAP_LOCATIONS: MappableLocationItem[] = LOCATIONS.filter(
  (location): location is MappableLocationItem => location.address !== null,
);

export const ARTISTS = [
  ...new Set([
    ...LOCATIONS.flatMap((location) => location.artists),
    "COLLAR",
    "MIRROR",
    "AGA 江海迦",
    "Gin Lee 李幸倪",
    "衛蘭 Janice Vidal",
    "張蔓莎 Sabrina Cheung",
    "Lewsz",
    "BILLY CHOI",
    "Claudia Koh",
    "WINKA 陳泳伽",
    "Jace Chan 陳凱詠",
    "Other",
  ]),
].toSorted((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

export const SONGS = [
  ...new Set(
    LOCATIONS.map((location) => {
      return { name: location.name, artists: location.artists };
    }),
  ),
];

export function extractContributorNamesFromLocation(
  location: LocationItem,
): string[] {
  const names = new Set<string>();
  const c = location as unknown as {
    contributors?: {
      song?: Record<string, ContributorCredit[]>;
      musicVideo?: Record<string, ContributorCredit[]>;
    } | null;
  };
  const contributors = c.contributors;
  if (!contributors) return [];
  const buckets = [contributors.song, contributors.musicVideo].filter(
    Boolean,
  ) as Array<Record<string, ContributorCredit[]>>;
  for (const bucket of buckets) {
    for (const role of Object.keys(bucket)) {
      const roleNames = bucket[role] ?? [];
      for (const person of roleNames) {
        const displayName = getContributorDisplayName(person).trim();
        if (displayName.length > 0) names.add(displayName);
      }
    }
  }
  return Array.from(names);
}

export const CONTRIBUTORS: string[] = [
  ...new Set(
    LOCATIONS.flatMap((location) =>
      extractContributorNamesFromLocation(location),
    ),
  ),
];

type ContributorCategory = "song" | "musicVideo";

export function humanizeRoleKey(roleKey: string): string {
  const specialMap: Record<string, string> = {
    directorOfPhotography: "Director of Photography",
    productionAssistant: "Production Assistant",
  };
  if (specialMap[roleKey]) return specialMap[roleKey];
  // Insert spaces before capital letters and capitalize first letter
  const withSpaces = roleKey.replace(/([A-Z])/g, " $1");
  const words = withSpaces.split(" ").filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export interface ContributorRoleGroup {
  category: ContributorCategory;
  roleKey: string;
  title: string;
  names: string[];
}

export const CONTRIBUTOR_ROLE_GROUPS: ContributorRoleGroup[] = (() => {
  const groups = new Map<
    string,
    {
      category: ContributorCategory;
      roleKey: string;
      title: string;
      names: Set<string>;
    }
  >();

  const add = (
    category: ContributorCategory,
    roleKey: string,
    people: ContributorCredit[],
  ) => {
    const key = `${category}:${roleKey}`;
    let entry = groups.get(key);
    if (!entry) {
      const roleTitle = humanizeRoleKey(roleKey);
      entry = {
        category,
        roleKey,
        title: `${roleTitle}`,
        names: new Set<string>(),
      };
      groups.set(key, entry);
    }
    const ensured = entry;
    people.forEach((p) => {
      const displayName = getContributorDisplayName(p).trim();
      if (displayName.length > 0) ensured.names.add(displayName);
    });
  };

  for (const location of LOCATIONS) {
    const c = (
      location as unknown as {
        contributors?: {
          song?: Record<string, ContributorCredit[]>;
          musicVideo?: Record<string, ContributorCredit[]>;
        } | null;
      }
    ).contributors;
    if (!c) continue;
    if (c.song) {
      for (const roleKey of Object.keys(c.song)) {
        add("song", roleKey, c.song[roleKey] ?? []);
      }
    }
    if (c.musicVideo) {
      for (const roleKey of Object.keys(c.musicVideo)) {
        add("musicVideo", roleKey, c.musicVideo[roleKey] ?? []);
      }
    }
  }

  return Array.from(groups.values()).map((g) => ({
    category: g.category,
    roleKey: g.roleKey,
    title: g.title,
    names: Array.from(g.names).sort((a, b) => a.localeCompare(b)),
  }));
})();
