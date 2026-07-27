#!/usr/bin/env node
/**
 * Static llms.txt generator (runs on every build, zero cost).
 *
 * Emits UTF-8 Markdown into public/ so Vite copies it to dist/ and Netlify
 * serves it as a plain file — fetchable by GPTBot / PerplexityBot / ClaudeBot
 * over a raw HTTP GET with no JavaScript execution.
 *
 * What gets generated:
 *   public/llms.txt        site-level index (per llmstxt.org, the root file
 *                          describes the site itself)
 *   public/llms-full.txt   expanded site description
 *   public/llms/<slug>.txt per published profile, when Supabase credentials
 *                          are present at build time
 *
 * The per-profile pass reuses the exact same formatting logic the app ships
 * (src/lib/geo/llms.ts) by bundling it with esbuild — one source of truth, so
 * the static files and the in-app export can never drift apart.
 *
 * Network/credential failures degrade gracefully: the site-level files are
 * always written and the build never fails because of this step.
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(ROOT, "public");

// Netlify injects env vars natively; locally we read the repo .env so the
// script behaves identically in both places.
try {
  process.loadEnvFile(join(ROOT, ".env"));
} catch {
  // No .env present (or unsupported Node) — site-level files still generate.
}
const SITE_URL = (process.env.SITE_URL || process.env.URL || "https://portfoliobuildersiev.netlify.app").replace(/\/$/, "");

/** Compile the app's TS formatting helpers to a temp ESM module we can import. */
async function loadFormatters() {
  const outfile = join(ROOT, "node_modules", ".cache", "llms-format.mjs");
  await mkdir(dirname(outfile), { recursive: true });
  await build({
    entryPoints: [join(ROOT, "src/lib/geo/llms.ts")],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    logLevel: "silent",
    alias: { "@": join(ROOT, "src") },
  });
  return import(`${outfile}?t=${Date.now()}`);
}

/** Fetch published profiles + their related rows straight from Supabase REST. */
async function fetchPublishedProfiles() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { profiles: [], reason: "no Supabase credentials in env" };

  const headers = { apikey: key, Accept: "application/json" };
  const get = async (path) => {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json();
  };

  const profiles = await get("profiles?is_published=eq.true&select=*");
  if (profiles.length === 0) return { profiles: [], reason: "no published profiles yet" };

  const ids = profiles.map((p) => `"${p.id}"`).join(",");
  const [skills, milestones, portfolio] = await Promise.all([
    get(`skills?profile_id=in.(${ids})&select=*`),
    get(`journey_milestones?profile_id=in.(${ids})&select=*&order=order_index`),
    get(`portfolio_items?profile_id=in.(${ids})&select=*&order=order_index`),
  ]);

  return {
    profiles: profiles.map((p) => ({
      ...p,
      skills: skills.filter((s) => s.profile_id === p.id),
      milestones: milestones.filter((m) => m.profile_id === p.id),
      portfolio: portfolio.filter((x) => x.profile_id === p.id),
    })),
    reason: null,
  };
}

function siteLlmsTxt(profiles) {
  const directory = profiles.length
    ? `\n## Founder profiles\n\n${profiles
        .map((p) => {
          const name = p.identity?.name || p.slug;
          const desc = p.identity?.headline || p.founder?.current_venture || "Founder profile";
          return `- [${name}](${SITE_URL}/u/${p.slug}): ${desc} — full text at ${SITE_URL}/llms/${p.slug}.txt`;
        })
        .join("\n")}\n`
    : "";

  return `# Founder ID

> Founder ID turns six questions into a shareable founder profile that investors and mentors can actually read. Each profile covers who the founder is, what they are building, their track record, skills, what they need, and how to reach them.

- **Site:** ${SITE_URL}
- **What it is:** A founder profile builder for entrepreneurs and student founders
- **Profile URLs:** ${SITE_URL}/u/{slug}
- **Templates:** Resume, Editorial, Minimal, Dossier, Profile, Showcase
- **Generated:** ${new Date().toISOString()}

## About

Founder ID profiles are structured, machine-readable pages. Every published
profile also exposes schema.org JSON-LD (Person, ProfessionalService, ItemPage)
so answer engines can resolve the founder as an entity, their expertise via
\`knowsAbout\`, and what they are open to via \`hasOfferCatalog\`.
${directory}
## Files

- [llms-full.txt](${SITE_URL}/llms-full.txt): Expanded description of this site
`;
}

function siteLlmsFullTxt(profiles) {
  return `# Founder ID — Full Site Description

Source: ${SITE_URL}
Generated: ${new Date().toISOString()}
Published profiles: ${profiles.length}

## What Founder ID is

Founder ID is a portfolio builder for founders. It converts six structured
questions into a single shareable link — a founder profile designed to be read
by investors, mentors, recruiters, and increasingly by AI answer engines.

## What a profile contains

- **Identity** — name, headline, bio, location, college, photo
- **What they are building** — current venture, industry, stage (Idea through Scaling), problem, mission
- **Vision** — the problem being solved and why it matters to them
- **Journey** — dated milestones establishing track record
- **Skills** — tagged areas of expertise
- **Looking for** — cofounder, mentor, investor, advisor, internship, employees, beta users, customers
- **Portfolio** — pitch decks, demos, websites, research, awards
- **Contact** — email, website, LinkedIn, X

## Machine readability

Every published profile emits:

- schema.org JSON-LD: \`Person\` (\`knowsAbout\` = skills), \`ProfessionalService\`
  (\`hasOfferCatalog\` = what they are seeking), and \`ItemPage\` (portfolio as \`CreativeWork\`)
- Open Graph and Twitter Card metadata with a dynamically rendered preview image
- A canonical URL at ${SITE_URL}/u/{slug}
- A plain-text profile summary at ${SITE_URL}/llms/{slug}.txt

## Verified student profiles

Founders signing up with a recognised Indian college email domain (IITs, NITs,
IIMs, IISc, central and major private universities) are automatically verified
as students and grouped into their institution's cohort.

## Contact

For questions about the platform itself, see ${SITE_URL}.
`;
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  let profiles = [];
  let note = "";
  try {
    const result = await fetchPublishedProfiles();
    profiles = result.profiles;
    note = result.reason ? ` (${result.reason})` : "";
  } catch (err) {
    note = ` (profile fetch skipped: ${err instanceof Error ? err.message : String(err)})`;
  }

  // Per-profile files, using the app's own formatters.
  const llmsDir = join(PUBLIC_DIR, "llms");
  await rm(llmsDir, { recursive: true, force: true });
  if (profiles.length > 0) {
    const { buildLlmsTxt, buildLlmsFullTxt } = await loadFormatters();
    await mkdir(llmsDir, { recursive: true });
    for (const profile of profiles) {
      await writeFile(join(llmsDir, `${profile.slug}.txt`), buildLlmsTxt(profile, SITE_URL), "utf8");
      await writeFile(join(llmsDir, `${profile.slug}-full.txt`), buildLlmsFullTxt(profile, SITE_URL), "utf8");
    }
  }

  await writeFile(join(PUBLIC_DIR, "llms.txt"), siteLlmsTxt(profiles), "utf8");
  await writeFile(join(PUBLIC_DIR, "llms-full.txt"), siteLlmsFullTxt(profiles), "utf8");

  console.log(`[llms] wrote public/llms.txt + llms-full.txt · ${profiles.length} profile file(s)${note}`);
}

main().catch((err) => {
  // Never fail the deploy over the AI-discoverability step.
  console.warn("[llms] generation failed, continuing build:", err?.message ?? err);
  process.exitCode = 0;
});
