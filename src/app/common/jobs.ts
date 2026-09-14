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
  | "music";

export interface RoleFamily {
  id: RoleFamilyId;
  label: string;
  eyebrow: string;
  description: string;
  rolePattern: RegExp;
}

export interface TalentWork {
  id: string;
  title: string;
  artists: string[];
  roleKey: string;
  role: string;
  url: string;
  image: string;
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

export const ROLE_FAMILIES: RoleFamily[] = [
  {
    id: "art",
    label: "Art department",
    eyebrow: "Sets, props & visual worlds",
    description:
      "Art directors, production designers, set designers and art crew.",
    rolePattern:
      /(art|productionDesigner|setDesign|prop|graphicDesign|illustrat|scenic|decor)/i,
  },
  {
    id: "direction",
    label: "Direction",
    eyebrow: "Ideas into motion",
    description: "Directors, assistant directors and creative directors.",
    rolePattern: /(director|creativeDirector|assistantToDirector)/i,
  },
  {
    id: "camera",
    label: "Camera & lighting",
    eyebrow: "Frame, light, movement",
    description:
      "Cinematographers, camera crew, gaffers, grips and lighting teams.",
    rolePattern:
      /(cinemat|photograph|camera|dop|gaffer|grip|electric|focusPull|\bdit\b|\bac\b|firstAc|secondAc)/i,
  },
  {
    id: "production",
    label: "Production",
    eyebrow: "Make the shoot happen",
    description: "Producers, production managers, coordinators and assistants.",
    rolePattern:
      /(produc|lineProducer|projectManag|coordinator|locationManag)/i,
  },
  {
    id: "post",
    label: "Post-production",
    eyebrow: "Shape the final cut",
    description: "Editors, colourists, animators, VFX and finishing artists.",
    rolePattern:
      /(edit|colou?r|vfx|animat|postProduction|composit|finishing|retouch)/i,
  },
  {
    id: "styling",
    label: "Styling & beauty",
    eyebrow: "Character through detail",
    description: "Stylists, costume, wardrobe, hair and makeup artists.",
    rolePattern: /(styl|costume|wardrobe|makeUp|makeup|hair)/i,
  },
  {
    id: "music",
    label: "Music & audio",
    eyebrow: "The sound of the story",
    description: "Composers, arrangers, producers, writers and sound teams.",
    rolePattern:
      /(composer|arranger|lyric|writer|music|sound|mix|master|vocal|audio)/i,
  },
];

type CreditBuckets = {
  song?: Record<string, ContributorCredit[]>;
  musicVideo?: Record<string, ContributorCredit[]>;
} | null;

function getCreditBuckets(location: LocationItem): CreditBuckets {
  return location.contributors as CreditBuckets;
}

function normalizePersonName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function buildTalentProfiles(family: RoleFamily): TalentProfile[] {
  const profiles = new Map<string, TalentProfile>();

  for (const location of LOCATIONS) {
    const buckets = getCreditBuckets(location);
    if (!buckets) continue;

    for (const bucket of [buckets.musicVideo, buckets.song]) {
      if (!bucket) continue;

      for (const [roleKey, people] of Object.entries(bucket)) {
        if (!family.rolePattern.test(roleKey)) continue;
        if (family.id === "art" && /^artis/i.test(roleKey)) continue;

        for (const person of people) {
          const name = getContributorName(person).trim();
          if (!name) continue;

          const id = normalizePersonName(name);
          const existing = profiles.get(id) ?? {
            id,
            name,
            instagram: getContributorInstagram(person),
            works: [],
            roleKeys: [],
            roles: [],
            artists: [],
          };

          const workId = `${location.id}-${roleKey}`;
          if (!existing.works.some((work) => work.id === workId)) {
            existing.works.push({
              id: workId,
              title: location.name.trim(),
              artists: location.artists,
              roleKey,
              role: humanizeRoleKey(roleKey),
              url: location.url,
              image: location.image,
            });
          }

          existing.instagram ??= getContributorInstagram(person);
          if (!existing.roleKeys.includes(roleKey))
            existing.roleKeys.push(roleKey);
          const role = humanizeRoleKey(roleKey);
          if (!existing.roles.includes(role)) existing.roles.push(role);
          for (const artist of location.artists) {
            if (!existing.artists.includes(artist))
              existing.artists.push(artist);
          }
          profiles.set(id, existing);
        }
      }
    }
  }

  return [...profiles.values()].filter((profile) => profile.works.length > 0);
}

export function youtubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const id = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v");
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
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
