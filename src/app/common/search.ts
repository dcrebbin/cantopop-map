import { ARTISTS, SONGS, CONTRIBUTOR_ROLE_GROUPS } from "./lib";

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function searchCatalog(query: string) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const matches = (...values: string[]) => {
    const text = values.map(normalizeSearch).join(" ");
    return terms.every((term) => text.includes(term));
  };

  const artists = ARTISTS.filter((artist) => matches(artist));
  const songs = SONGS.filter((song) => matches(song.name, ...song.artists));
  const contributorGroups = CONTRIBUTOR_ROLE_GROUPS.flatMap((group) => {
    const category = group.category === "musicVideo" ? "Music Video" : "Song";
    const names = group.names.filter((name) =>
      matches(category, group.title, name),
    );
    return names.length ? [{ ...group, names }] : [];
  });

  return { artists, songs, contributorGroups };
}
