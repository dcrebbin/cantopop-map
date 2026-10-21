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

// Absolute base URL used for canonical links, sitemaps and JSON-LD ids.
// Crawlers and AI search tools treat relative canonicals and ids as noise.
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
  return `/people/${encodeURIComponent(toSlug(name))}`;
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

export const PEOPLE_INDEX: Map<string, PersonEntry> = (() => {
  const people = new Map<string, PersonEntry>();
  for (const location of LOCATIONS) {
    for (const credit of getLocationCredits(location)) {
      const slug = toSlug(credit.name);
      const entry = people.get(slug) ?? {
        slug,
        name: credit.name,
        instagram: credit.instagram,
        credits: [],
      };
      entry.instagram ??= credit.instagram;
      entry.credits.push({
        location,
        category: credit.category,
        roleKey: credit.roleKey,
        role: credit.role,
      });
      people.set(slug, entry);
    }
  }
  return new Map([...people.entries()].sort(([, a], [, b]) => byName(a, b)));
})();

export function instagramUrl(handle: string | null) {
  return handle ? `https://www.instagram.com/${handle}` : null;
}

export function personJsonLd(name: string, instagram: string | null) {
  const sameAs = instagramUrl(instagram);
  return {
    "@type": "Person",
    "@id": `${absoluteUrl(personPath(name))}#person`,
    name,
    url: absoluteUrl(personPath(name)),
    ...(sameAs ? { sameAs: [sameAs] } : {}),
  };
}

export function artistJsonLd(name: string) {
  return {
    "@type": "MusicGroup",
    "@id": `${absoluteUrl(artistPath(name))}#artist`,
    name,
    url: absoluteUrl(artistPath(name)),
    genre: "Cantopop",
  };
}

export function describeLocation(location: LocationItem) {
  const artists = location.artists.join(", ");
  const place = location.address ? ` at ${location.address}` : "";
  return `The music video for "${location.name}" by ${artists} was filmed${place}.`;
}
