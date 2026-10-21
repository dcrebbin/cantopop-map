import assert from "node:assert/strict";
import { test } from "node:test";
import { searchCatalog } from "../src/app/common/search";
import { ARTISTS, SONGS, CONTRIBUTOR_ROLE_GROUPS } from "../src/app/common/lib";

void test("empty and whitespace searches restore the full catalog", () => {
  assert.deepEqual(searchCatalog("  "), searchCatalog(""));
  assert.deepEqual(searchCatalog("").artists, ARTISTS);
  assert.deepEqual(searchCatalog("").songs, SONGS);
  assert.deepEqual(
    searchCatalog("").contributorGroups,
    CONTRIBUTOR_ROLE_GROUPS,
  );
});

void test("artist and song searches ignore case and surrounding whitespace", () => {
  const song = SONGS[0]!;
  assert.ok(
    searchCatalog(`  ${song.name.toUpperCase()}  `).songs.includes(song),
  );
  const artist = song.artists[0]!;
  assert.ok(searchCatalog(artist.toUpperCase()).artists.includes(artist));
  assert.ok(searchCatalog(artist).songs.includes(song));
});

void test("roles only return people within matching roles", () => {
  const result = searchCatalog("  DIRECTOR   OF PHOTOGRAPHY ");
  assert.ok(result.contributorGroups.length > 0);
  assert.ok(
    result.contributorGroups.every(
      (group) => group.title.toLowerCase().startsWith("director of photography"),
    ),
  );
});

void test("people match within their credited roles and can be combined with a role", () => {
  const group = CONTRIBUTOR_ROLE_GROUPS.find((group) => group.names.length)!;
  const name = group.names[0]!;
  assert.ok(
    searchCatalog(name).contributorGroups.some((result) =>
      result.names.includes(name),
    ),
  );
  const combined = searchCatalog(`${group.title} ${name}`);
  assert.ok(
    combined.contributorGroups.some((result) => result.names.includes(name)),
  );
  assert.deepEqual(searchCatalog("zzzz-no-such-person-987654"), {
    artists: [],
    songs: [],
    contributorGroups: [],
  });
});
