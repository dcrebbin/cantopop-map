import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLdScript } from "../src/app/components/JsonLd";
import { LOCATIONS, type LocationItem } from "../src/app/common/lib";
import {
  buildPeopleIndex,
  describeLocation,
  getPersonEntry,
  isEstimatedLocation,
  personJsonLd,
  personPath,
  roleLabelZh,
  videoStartSeconds,
} from "../src/app/common/seo";

const example = LOCATIONS[0]!;

void test("server-rendered JSON-LD parses without HTML entity decoding and cannot close its script", () => {
  const data = {
    "@context": "https://schema.org",
    name: '廣東歌 "A&B" </script><script>alert(1)</script>',
  };
  const html = renderToStaticMarkup(<JsonLdScript data={data} />);
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.deepEqual(JSON.parse(scripts[0]![1]!), data);
  assert.ok(!html.includes("&quot;"));
  assert.ok(!html.includes("<script>alert"));
});

void test("case and whitespace credit aliases share one entry without repeating credits", () => {
  const location: LocationItem = {
    ...example,
    contributors: {
      musicVideo: {
        productionCompany: [
          "Daymaker Creatives Limited",
          "DAYMAKER CREATIVES LIMITED",
          "Daymaker  Creatives Limited",
        ],
        director: ["Alice Chan", "Bob Chan"],
      },
    },
  };
  const entries = [...buildPeopleIndex([location]).values()];
  assert.equal(entries.length, 3);
  const company = entries.find(
    (entry) => entry.name === "Daymaker Creatives Limited",
  )!;
  assert.equal(company.kind, "Organization");
  assert.equal(company.aliases.length, 3);
  assert.equal(company.credits.length, 1);
  assert.equal(
    entries.find((entry) => entry.name === "Alice Chan")?.kind,
    "Person",
  );
});

void test("known company aliases resolve to canonical profile links and Organization JSON-LD", () => {
  const company = getPersonEntry("Daymaker-Creatives-Limited")!;
  assert.ok(company);
  assert.equal(getPersonEntry("DAYMAKER-CREATIVES-LIMITED"), company);
  assert.equal(
    personPath("DAYMAKER CREATIVES LIMITED"),
    personPath(company.name),
  );
  assert.equal(personJsonLd(company.name, null)["@type"], "Organization");
});

void test("unknown and estimated locations never become unqualified filming claims", () => {
  const unknown = { ...example, address: null };
  assert.match(describeLocation(unknown, "zh"), /尚未收錄/);
  assert.match(describeLocation(unknown), /not yet listed/);
  const estimated = { ...example, address: "Olympic Square (Estimation)" };
  assert.ok(isEstimatedLocation(estimated));
  assert.match(describeLocation(estimated, "zh"), /推測/);
  assert.match(describeLocation(estimated), /estimated/);
  assert.match(describeLocation(example, "zh"), /MV/);
});

void test("playback timestamps support explicit zero, seconds and YouTube durations", () => {
  const location = (url: string, hookTime: number | null = null) => ({
    ...example,
    url,
    hookTime,
  });
  assert.equal(videoStartSeconds(location("https://youtu.be/test?t=129")), 129);
  assert.equal(
    videoStartSeconds(location("https://youtu.be/test?t=1m29s")),
    89,
  );
  assert.equal(
    videoStartSeconds(location("https://youtu.be/test?start=25")),
    25,
  );
  assert.equal(
    videoStartSeconds(location("https://youtu.be/test?t=129", 0)),
    0,
  );
  assert.equal(
    videoStartSeconds(location("https://youtu.be/test?t=invalid")),
    null,
  );
  assert.equal(videoStartSeconds(location("https://youtu.be/test")), null);
  assert.equal(videoStartSeconds(location("not a URL")), null);
  assert.equal(roleLabelZh("composer"), "作曲");
  assert.equal(roleLabelZh("director"), "導演");
});
