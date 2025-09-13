import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Import location data directly from the source of truth
import { nameToLocation } from "../src/app/common/locations";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getBaseUrl(): string {
  const envBase =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";
  return envBase.replace(/\/$/, "");
}

async function generateLlmsTxt(): Promise<void> {
  const nowIso = new Date().toISOString();

  const slugs = Object.keys(nameToLocation).sort((a, b) => a.localeCompare(b));

  const url = "https://cantopopmap.hk";

  const headerLines = [
    "# Cantopop Map - LLMs directory",
    "> A community-curated map of Cantonese pop music video locations.",
    `site: ${url}`,
    `generated_at: ${nowIso}`,
    "",
    "## Important pages",
  ];

  const rootUrl = `${url}/`;
  const rootLine = `${rootUrl}`;

  const locationLines = slugs.map((slug) => {
    const loc = nameToLocation[slug];
    const pageUrl = `${url}/locations/${decodeURIComponent(slug)}`;
    const parts: string[] = [pageUrl];

    const title = `${loc?.artists.join(", ")} — ${loc?.name}`;
    parts.push(`title="${title}"`);

    if (loc?.address) parts.push(`address="${loc.address}"`);
    if (loc?.url) parts.push(`source="${decodeURIComponent(loc.url)}"`);
    if (loc?.streetView) parts.push(`streetView="${loc.streetView}"`);

    return parts.join(" | ");
  });

  const content = [...headerLines, rootLine, ...locationLines, ""].join("\n");

  const outPath = resolve(__dirname, "../public/llms.txt");
  await writeFile(outPath, content, "utf8");
  // eslint-disable-next-line no-console
  console.log(`llms.txt generated at ${outPath}`);
}

await generateLlmsTxt();
