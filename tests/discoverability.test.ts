import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";
import { after, before, test } from "node:test";
import { LOCATIONS } from "../src/app/common/lib";
import {
  absoluteUrl,
  artistPath,
  getPersonEntry,
  locationPath,
  personPath,
} from "../src/app/common/seo";

// Exercise the built HTTP server, rather than a browser-rendered DOM: bots
// must receive useful text, valid JSON and correct status codes before JS runs.
let server: ChildProcess;
let origin: string;
let output = "";

before(async () => {
  const socket = createServer();
  await new Promise<void>((resolve, reject) => {
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", resolve);
  });
  const address = socket.address();
  assert.ok(address && typeof address === "object");
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    socket.close((error) => (error ? reject(error) : resolve())),
  );
  origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [".output/server/index.mjs"], {
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (data: Buffer) => {
    output += data.toString();
  });
  server.stderr?.on("data", (data: Buffer) => {
    output += data.toString();
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Build the app before running HTTP checks. ${output}`);
    try {
      if ((await fetch(`${origin}/robots.txt`)).ok) return;
    } catch {
      /* Wait for the listener. */
    }
    await setTimeout(100);
  }
  throw new Error(`Server did not start. ${output}`);
});

after(() => {
  server?.kill();
});

for (const path of [
  "/",
  "/browse",
  artistPath("BEYOND"),
  locationPath(LOCATIONS.find((location) => location.name === "海闊天空")!),
  personPath("Daymaker Creatives Limited"),
]) {
  void test(`${path} serves Chinese content, canonical URL and valid JSON-LD without JavaScript`, async () => {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<html lang="zh-Hant-HK"/);
    assert.match(html, /拍攝地點|製作名單/);
    assert.ok(html.includes(`rel="canonical" href="${absoluteUrl(path)}"`));
    const scripts = [
      ...html.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      ),
    ];
    assert.ok(scripts.length > 0);
    for (const script of scripts)
      assert.doesNotThrow(() => JSON.parse(script[1]!));
    assert.match(html, /href="\/browse"/);
  });
}

for (const path of [
  "/artists/no-such-artist-audit",
  "/people/no-such-person-audit",
  "/locations/no-such-location-audit",
  "/locations/unknown%25-title",
  "/locations/__proto__",
  "/llms.txt",
  "/no-such-page-audit",
]) {
  void test(`${path} returns a real 404 with a helpful noindex page`, async () => {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 404);
    const html = await response.text();
    assert.match(html, /Page not found/);
    assert.match(html, /name="robots" content="noindex, follow"/);
  });
}

void test("case aliases permanently redirect to one contributor profile", async () => {
  const person = getPersonEntry("Daymaker-Creatives-Limited")!;
  const alias = person.aliases.find((name) => name !== person.name)!;
  assert.ok(alias);
  const path = `/people/${encodeURIComponent(alias.replace(/\s+/g, "-"))}`;
  const response = await fetch(`${origin}${path}`, { redirect: "manual" });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), personPath(person.name));
});

void test("sitemap advertises canonical contributor URLs and robots welcomes search crawlers", async () => {
  const response = await fetch(`${origin}/sitemap.xml`);
  assert.equal(response.status, 200);
  const sitemap = await response.text();
  assert.match(response.headers.get("content-type")!, /application\/xml/);
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => match[1]!,
  );
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.includes(absoluteUrl("/browse")));
  assert.ok(
    urls.includes(absoluteUrl(personPath("DAYMAKER CREATIVES LIMITED"))),
  );
  assert.ok(!urls.some((url) => url.includes("llms")));
  const robots = await (await fetch(`${origin}/robots.txt`)).text();
  assert.ok(robots.includes("User-agent: OAI-SearchBot"));
  assert.ok(robots.includes(`Sitemap: ${absoluteUrl("/sitemap.xml")}`));
});
