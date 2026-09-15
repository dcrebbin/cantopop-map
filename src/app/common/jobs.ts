import {
  LOCATIONS,
  getContributorInstagram,
  getContributorName,
  humanizeRoleKey,
  type ContributorCredit,
  type LocationItem,
} from "./lib";

export type RoleFamilyId =
  | "art"
  | "direction"
  | "camera"
  | "production"
  | "post"
  | "styling"
  | "music"
  | `song:${string}`;

export interface RoleFamily {
  id: RoleFamilyId;
  label: string;
  eyebrow: string;
  description: string;
  rolePattern: RegExp;
  rolePatternsByCategory?: Partial<Record<ContributorCategory, RegExp>>;
  excludedRolePattern?: RegExp;
  categories: ContributorCategory[];
}

export type ContributorCategory = "song" | "musicVideo";

export interface TalentWork {
  id: string;
  locationId: string;
  category: ContributorCategory;
  title: string;
  artists: string[];
  roleKey: string;
  role: string;
  url: string;
  image: string;
  hookTime: number | null;
}

export interface TalentProfile {
  id: string;
  name: string;
  instagram: string | null;
  works: TalentWork[];
  roleKeys: string[];
  roles: string[];
  artists: string[];
}

const BASE_ROLE_FAMILIES: RoleFamily[] = [
  {
    id: "art",
    label: "Art department",
    eyebrow: "Sets, props & visual worlds",
    description:
      "Art directors, production designers, set designers and art crew.",
    rolePattern:
      /(^art(?!ist)|assistantArt|executiveArt|onSiteArt|imageDirectionAndArt|coverArt|productionDesigner|^set|prop|graphicDesign|illustrat|scenic|decor|titleArt)/i,
    excludedRolePattern:
      /(artist|makeup|makeUp|hair|styling|stylist|wardrobe|costume|vfx|cgi?|animat|photograph|management|setMedic)/i,
    categories: ["musicVideo"],
  },
  {
    id: "direction",
    label: "Direction",
    eyebrow: "Ideas into motion",
    description: "Directors, assistant directors and creative directors.",
    rolePattern:
      /(^director$|assistantDirector|assistantToDirector|directorAssistant|coAssistantDirector|coDirector|firstAssistantDirector|secondAssistantDirector|creativeAndDirector|creativeDirector|executiveDirector|visualDirector|imageDirector)/i,
    excludedRolePattern:
      /(art|photograph|animation|hair|makeup|makeUp|casting|choreograph|movement|production|editing)/i,
    categories: ["musicVideo"],
  },
  {
    id: "camera",
    label: "Camera & lighting",
    eyebrow: "Frame, light, movement",
    description:
      "Cinematographers, camera crew, gaffers, grips and lighting teams.",
    rolePattern:
      /(cinemat|photograph|camera|dop|gaffer|grip|electrician|focusPull|^dit$|^ac$|firstAc|secondAc|lighting)/i,
    excludedRolePattern: /(equipment|providedBy|coverArt)/i,
    categories: ["musicVideo"],
  },
  {
    id: "production",
    label: "Production",
    eyebrow: "Make the shoot happen",
    description: "Producers, production managers, coordinators and assistants.",
    rolePattern:
      /(producer|production|projectManag|locationCoordinator|locationManag)/i,
    excludedRolePattern:
      /(postProduction|colorProducer|colourProducer|productionDesigner|productionDirector|stylingProducer|vfx.*Producer|vocalProduction|musicProducer|arrangerProducer)/i,
    categories: ["musicVideo"],
  },
  {
    id: "post",
    label: "Post-production",
    eyebrow: "Shape the final cut",
    description: "Editors, colourists, animators, VFX and finishing artists.",
    rolePattern:
      /(edit|colou?r|vfx|animat|postProduction|composit|finishing|retouch)/i,
    excludedRolePattern:
      /(hairColorist|colorProducer|colourProducer|executiveColorProducer)/i,
    categories: ["musicVideo"],
  },
  {
    id: "styling",
    label: "Styling & beauty",
    eyebrow: "Character through detail",
    description: "Stylists, costume, wardrobe, hair and makeup artists.",
    rolePattern: /(styl|costume|wardrobe|makeUp|makeup|hair|manicure|nailArt)/i,
    categories: ["musicVideo"],
  },
  {
    id: "music",
    label: "Sound & audio",
    eyebrow: "Sound for the screen",
    description: "Sound and audio teams credited on music videos.",
    rolePattern: /(sound|audio|voiceOverMixing)/i,
    categories: ["musicVideo"],
  },
];

type CreditBuckets = {
  song?: Record<string, ContributorCredit[]>;
  musicVideo?: Record<string, ContributorCredit[]>;
} | null;

type TalentProfileAccumulator = Omit<
  TalentProfile,
  "roleKeys" | "roles" | "artists"
> & {
  roleKeys: Set<string>;
  roles: Set<string>;
  artists: Set<string>;
};

function getCreditBuckets(location: LocationItem): CreditBuckets {
  return location.contributors as CreditBuckets;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const songRoleKeys = new Set<string>();

for (const location of LOCATIONS) {
  const songCredits = getCreditBuckets(location)?.song;
  if (!songCredits) continue;
  for (const roleKey of Object.keys(songCredits)) songRoleKeys.add(roleKey);
}

const SONG_ROLE_FAMILIES: RoleFamily[] = [...songRoleKeys]
  .map((roleKey) => {
    const label = humanizeRoleKey(roleKey);
    return {
      id: `song:${roleKey}` as const,
      label,
      eyebrow: "Song credit",
      description: `People credited for ${label.toLocaleLowerCase()} on Cantopop songs.`,
      rolePattern: new RegExp(`^${escapeRegExp(roleKey)}$`),
      categories: ["song" as const],
    };
  })
  .toSorted((left, right) => left.label.localeCompare(right.label));

export const ROLE_FAMILIES: RoleFamily[] = [...BASE_ROLE_FAMILIES];

function normalizePersonName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function roleBelongsToFamily(
  family: RoleFamily,
  category: ContributorCategory,
  roleKey: string,
) {
  if (!family.categories.includes(category)) return false;
  const rolePattern =
    family.rolePatternsByCategory?.[category] ?? family.rolePattern;
  if (!rolePattern.test(roleKey)) return false;
  return !family.excludedRolePattern?.test(roleKey);
}

export function buildTalentProfiles(family: RoleFamily): TalentProfile[] {
  const profiles = new Map<string, TalentProfileAccumulator>();

  for (const location of LOCATIONS) {
    const buckets = getCreditBuckets(location);
    if (!buckets) continue;

    const categoryBuckets: Array<
      [ContributorCategory, Record<string, ContributorCredit[]> | undefined]
    > = [
      ["musicVideo", buckets.musicVideo],
      ["song", buckets.song],
    ];

    for (const [category, bucket] of categoryBuckets) {
      if (!bucket) continue;

      for (const [roleKey, people] of Object.entries(bucket)) {
        if (!roleBelongsToFamily(family, category, roleKey)) continue;

        for (const person of people) {
          const name = getContributorName(person).trim();
          if (!name) continue;

          const id = normalizePersonName(name);
          const existing = profiles.get(id) ?? {
            id,
            name,
            instagram: getContributorInstagram(person),
            works: [],
            roleKeys: new Set<string>(),
            roles: new Set<string>(),
            artists: new Set<string>(),
          };

          const workId = `${location.id}-${roleKey}`;
          if (!existing.works.some((work) => work.id === workId)) {
            existing.works.push({
              id: workId,
              locationId: location.id,
              category,
              title: location.name.trim(),
              artists: location.artists,
              roleKey,
              role: humanizeRoleKey(roleKey),
              url: location.url,
              image: location.highResImage ?? location.image,
              hookTime: location.hookTime,
            });
          }

          existing.instagram ??= getContributorInstagram(person);
          existing.roleKeys.add(roleKey);
          existing.roles.add(humanizeRoleKey(roleKey));
          for (const artist of location.artists) {
            existing.artists.add(artist);
          }
          profiles.set(id, existing);
        }
      }
    }
  }

  return [...profiles.values()]
    .filter((profile) => profile.works.length > 0)
    .map((profile) => ({
      ...profile,
      roleKeys: [...profile.roleKeys],
      roles: [...profile.roles],
      artists: [...profile.artists],
    }));
}

export function buildAllTalentProfiles(): TalentProfile[] {
  const profiles = new Map<string, TalentProfile>();

  for (const family of ROLE_FAMILIES) {
    for (const profile of buildTalentProfiles(family)) {
      const existing = profiles.get(profile.id);
      if (!existing) {
        profiles.set(profile.id, profile);
        continue;
      }

      existing.instagram ??= profile.instagram;
      existing.works = [
        ...new Map(
          [...existing.works, ...profile.works].map((work) => [work.id, work]),
        ).values(),
      ];
      existing.roleKeys = [
        ...new Set([...existing.roleKeys, ...profile.roleKeys]),
      ];
      existing.roles = [...new Set([...existing.roles, ...profile.roles])];
      existing.artists = [
        ...new Set([...existing.artists, ...profile.artists]),
      ];
    }
  }

  return [...profiles.values()];
}

export function youtubeEmbedUrl(url: string, hookTime?: number) {
  try {
    const parsed = new URL(url);
    const id = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v");
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${hookTime !== undefined ? `&start=${hookTime}` : ""}`;
  } catch {
    return null;
  }
}

export function stableNumber(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}
