import {
  LOCATIONS,
  constructTitle,
  getContributorInstagram,
  getContributorName,
  humanizeRoleKey,
  type ContributorCredit,
  type LocationItem,
} from "./lib";

const DEFAULT_SITE_URL = "https://www.cantopopmap.hk";

// Keep canonical links, sitemap entries and JSON-LD ids on the same origin.
export const SITE_URL = (
  import.meta.env?.NEXT_PUBLIC_SITE_URL ??
  (typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL)
    : undefined) ??
  DEFAULT_SITE_URL
).replace(/\/$/, "");

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function toSlug(value: string) {
  return value.trim().replace(/\s+/g, "-");
}

export function locationPath(location: LocationItem) {
  return `/locations/${encodeURIComponent(constructTitle(location))}`;
}

export function artistPath(artist: string) {
  return `/artists/${encodeURIComponent(toSlug(artist))}`;
}

export function personPath(name: string) {
  const person = getPersonEntry(toSlug(name));
  return `/people/${encodeURIComponent(person?.slug ?? toSlug(name))}`;
}

export type CreditCategory = "song" | "musicVideo";

export interface PersonCredit {
  location: LocationItem;
  category: CreditCategory;
  roleKey: string;
  role: string;
}

export interface PersonEntry {
  slug: string;
  name: string;
  instagram: string | null;
  credits: PersonCredit[];
  aliases: string[];
  kind: "Person" | "Organization";
}

export interface ArtistEntry {
  slug: string;
  name: string;
  locations: LocationItem[];
}

type CreditBuckets = Partial<
  Record<CreditCategory, Record<string, ContributorCredit[]>>
> | null;

export function getLocationCredits(location: LocationItem) {
  const buckets = location.contributors as CreditBuckets;
  const credits: Array<{
    category: CreditCategory;
    roleKey: string;
    role: string;
    name: string;
    instagram: string | null;
  }> = [];
  if (!buckets) return credits;

  for (const category of ["song", "musicVideo"] as const) {
    for (const [roleKey, people] of Object.entries(buckets[category] ?? {})) {
      for (const person of people) {
        const name = getContributorName(person).trim();
        if (!name) continue;
        credits.push({
          category,
          roleKey,
          role: humanizeRoleKey(roleKey),
          name,
          instagram: getContributorInstagram(person),
        });
      }
    }
  }
  return credits;
}

function byName<T extends { name: string }>(left: T, right: T) {
  return left.name.localeCompare(right.name, undefined, {
    sensitivity: "base",
  });
}

export const ARTIST_INDEX: Map<string, ArtistEntry> = (() => {
  const artists = new Map<string, ArtistEntry>();
  for (const location of LOCATIONS) {
    for (const name of location.artists) {
      const slug = toSlug(name);
      const entry = artists.get(slug) ?? { slug, name, locations: [] };
      entry.locations.push(location);
      artists.set(slug, entry);
    }
  }
  return new Map([...artists.entries()].sort(([, a], [, b]) => byName(a, b)));
})();

function contributorKey(name: string) {
  // Merge case/spacing variants only; don't guess that different names or
  // shared Instagram accounts identify the same person.
  return toSlug(name).toLocaleLowerCase("en");
}

const ORGANIZATION_ROLES = new Set([
  "productionCompany",
  "recordingStudio",
  "filmLab",
  "colourHouse",
  "vfxStudio",
  "label",
]);

function isOrganization(name: string, role: string) {
  return (
    ORGANIZATION_ROLES.has(role) ||
    /\b(?:ltd|limited|studios?|records|productions?|company)\b|有限公司|工作室|唱片公司/i.test(
      name.replace(/_/g, " "),
    )
  );
}

export function buildPeopleIndex(locations: LocationItem[]) {
  const people = new Map<string, PersonEntry>();
  for (const location of locations) {
    for (const credit of getLocationCredits(location)) {
      const slug = toSlug(credit.name);
      const key = contributorKey(credit.name);
      const entry: PersonEntry = people.get(key) ?? {
        slug,
        name: credit.name,
        instagram: credit.instagram,
        credits: [],
        aliases: [],
        kind: "Person",
      };
      if (!entry.aliases.includes(credit.name)) entry.aliases.push(credit.name);
      if (isOrganization(credit.name, credit.roleKey))
        entry.kind = "Organization";
      entry.instagram ??= credit.instagram;
      if (
        !entry.credits.some(
          (existing) =>
            existing.location.id === location.id &&
            existing.category === credit.category &&
            existing.roleKey === credit.roleKey,
        )
      )
        entry.credits.push({
          location,
          category: credit.category,
          roleKey: credit.roleKey,
          role: credit.role,
        });
      people.set(key, entry);
    }
  }
  return new Map(
    [...people.values()].sort(byName).map((entry) => [entry.slug, entry]),
  );
}

export const PEOPLE_INDEX = buildPeopleIndex(LOCATIONS);
const PEOPLE_BY_KEY = new Map(
  [...PEOPLE_INDEX.values()].map((person) => [
    contributorKey(person.name),
    person,
  ]),
);

// Router params have already been URL-decoded by TanStack Router.
export function getPersonEntry(slug: string) {
  return PEOPLE_BY_KEY.get(contributorKey(slug));
}

export function instagramUrl(handle: string | null) {
  return handle ? `https://www.instagram.com/${handle}` : null;
}

export function personJsonLd(name: string, instagram: string | null) {
  const entry = getPersonEntry(toSlug(name));
  const sameAs = instagramUrl(instagram ?? entry?.instagram ?? null);
  return {
    "@type": entry?.kind ?? "Person",
    "@id": `${absoluteUrl(personPath(name))}#person`,
    name: entry?.name ?? name,
    ...(entry && entry.aliases.length > 1
      ? { alternateName: entry.aliases.filter((alias) => alias !== entry.name) }
      : {}),
    url: absoluteUrl(personPath(name)),
    ...(sameAs ? { sameAs: [sameAs] } : {}),
  };
}

export function artistJsonLd(name: string) {
  return {
    // Schema.org explicitly permits MusicGroup for solo musicians as well.
    "@type": "MusicGroup",
    "@id": `${absoluteUrl(artistPath(name))}#artist`,
    name,
    url: absoluteUrl(artistPath(name)),
    genre: "Cantopop",
  };
}

export function isEstimatedLocation(location: LocationItem) {
  return /\bestimat(?:e|ed|ion)\b|\bapproximate\b|估計|推測|待確認/i.test(
    location.address ?? "",
  );
}

export function describeLocation(
  location: LocationItem,
  language: "en" | "zh" = "en",
) {
  if (language === "zh") {
    const song = `${location.artists.join("、")}《${location.name}》`;
    if (!location.address)
      return `${song}的 MV 拍攝地點尚未收錄；本頁提供歌曲及音樂錄像製作名單。`;
    return `${song}的 MV ${isEstimatedLocation(location) ? "推測拍攝地點" : "收錄拍攝地點"}：${location.address}。查看取景位置、音樂錄像及製作名單。`;
  }
  const artists = location.artists.join(", ");
  if (!location.address)
    return `The filming location for "${location.name}" by ${artists} is not yet listed. Explore the music video and credits.`;
  return `The ${isEstimatedLocation(location) ? "estimated" : "listed"} filming location for "${location.name}" by ${artists} is ${location.address}.`;
}

const ROLE_NAMES_ZH: Record<string, string> = {
  composer: "作曲",
  lyricist: "填詞",
  englishLyricist: "英文填詞",
  rapLyricist: "說唱填詞",
  arranger: "編曲",
  producer: "監製",
  vocalProducer: "人聲監製",
  vocals: "演唱",
  backingVocals: "和音",
  backingVocalArranger: "和音編排",
  guitar: "結他",
  bass: "低音結他",
  drums: "鼓",
  keyboards: "鍵琴",
  piano: "鋼琴",
  strings: "弦樂",
  recordingEngineer: "錄音師",
  mixingEngineer: "混音師",
  masteringEngineer: "母帶工程師",
  productionCompany: "製作公司",
  recordingStudio: "錄音室",
  director: "導演",
  coDirector: "聯合導演",
  creativeDirector: "創意總監",
  assistantDirector: "副導演",
  directorOfPhotography: "攝影指導",
  cameraOperator: "攝影師",
  gaffer: "燈光師",
  editor: "剪接",
  colourist: "調色師",
  artDirector: "美術指導",
  stylist: "造型師",
  makeupArtist: "化妝師",
  hairStylist: "髮型師",
  choreographer: "編舞",
  dancer: "舞蹈員",
  cast: "演員",
  specialAppearance: "特別演出",
  stillPhotographer: "劇照攝影",
  coverPhotographer: "封面攝影",
  label: "唱片公司",
  artistManagement: "藝人管理",
  specialThanks: "特別鳴謝",
  location: "場地",
  sponsor: "贊助",
};

export function roleLabelZh(roleKey: string) {
  return ROLE_NAMES_ZH[roleKey] ?? humanizeRoleKey(roleKey);
}

export function videoStartSeconds(location: LocationItem) {
  if (location.hookTime !== null) return location.hookTime;
  let url: URL;
  try {
    url = new URL(location.url);
  } catch {
    return null;
  }
  const value = url.searchParams.get("t") ?? url.searchParams.get("start");
  if (value === null) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const duration = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!duration?.[0]) return null;
  return (
    Number(duration[1] ?? 0) * 3600 +
    Number(duration[2] ?? 0) * 60 +
    Number(duration[3] ?? 0)
  );
}
