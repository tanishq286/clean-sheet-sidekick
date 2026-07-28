#!/usr/bin/env node
/**
 * Browser sweep over every registered template.
 *
 * Renders each design at /templates/:id and asserts the things that silently
 * break when a preset is added: horizontal overflow on a phone, text that
 * disappears into its own background, and the interactive milestone/portfolio
 * sections failing inside an unfamiliar palette.
 *
 * Usage:
 *   npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
 *   npm run test:templates            # or BASE=http://host:port npm run test:templates
 *
 * External requests are aborted rather than awaited — the page only needs its
 * own bundle, and waiting on a webfont CDN made this 20x slower.
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
// Ids come from the catalog module itself, compiled on the fly. Scraping the
// registry with a regex used to work until the handwritten entries moved into
// catalog.ts and the sweep silently dropped to 30 of 36 templates — a test
// that quietly checks less than it claims is worse than no test.
const outfile = join(ROOT, "node_modules", ".cache", "sweep-catalog.mjs");
await mkdir(dirname(outfile), { recursive: true });
await build({
  entryPoints: [join(ROOT, "src/templates/catalog.ts")],
  outfile, bundle: true, format: "esm", platform: "node", target: "node18",
  logLevel: "silent", alias: { "@": join(ROOT, "src") },
});
const { TEMPLATE_CATALOG } = await import(`${outfile}?t=${Date.now()}`);
const all = TEMPLATE_CATALOG.map((t) => t.id);
console.log(`sweeping ${all.length} templates\n`);

// resume, editorial and minimal deliberately keep their original static
// markup — the user asked only for dossier to be adapted.
/** Templates intentionally excluded from interactivity checks (none today). */
const STATIC_TEMPLATES = new Set([]);

/** AnimatePresence keeps nodes mounted while the exit spring runs. */
async function waitFor(fn, timeout = 4000) {
  const t0 = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - t0 > timeout) return false;
    await new Promise((r) => setTimeout(r, 100));
  }
}

const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const fails = [];

for (const id of all) {
  const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route("**/*", (route) => {
    const u = route.request().url();
    route[u.startsWith(BASE) ? "continue" : "abort"]();
  });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 120)));
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("Failed to load resource")) errs.push(t.slice(0, 120));
  });

  const problems = [];
  try {
    await page.goto(`${BASE}/templates/${id}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(500);

    // 1. actually rendered the profile
    if (!(await page.getByText("Ada Rao").first().isVisible().catch(() => false)))
      problems.push("name not rendered");

    // 2. no horizontal overflow at desktop and phone
    const oX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (oX > 1) problems.push(`h-overflow ${oX}px @1280`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const oM = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (oM > 1) problems.push(`h-overflow ${oM}px @390`);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(300);

    // 3. body text contrasts with the page background (catches a palette typo
    //    putting light text on a light background)
    const contrast = await page.evaluate(() => {
      const ctx = document.createElement("canvas").getContext("2d");
      const lum = (c) => { ctx.clearRect(0,0,1,1); ctx.fillStyle = c; ctx.fillRect(0,0,1,1);
        const [r,g,bl] = ctx.getImageData(0,0,1,1).data; return (0.2126*r+0.7152*g+0.0722*bl)/255; };
      const root = document.querySelector("main")?.closest("div[style]") ?? document.body;
      const cs = getComputedStyle(root);
      return Math.abs(lum(cs.color) - lum(cs.backgroundColor));
    });
    if (contrast < 0.35) problems.push(`low contrast ${contrast.toFixed(2)}`);

    // 4. interactive sections still work inside this template
    const interactive = !STATIC_TEMPLATES.has(id);
    const ms = page.locator('button[aria-controls="milestone-panel-m1"]');
    if (!interactive) { /* static by design */ } else {
    if (await ms.count()) {
      await ms.click(); await page.waitForTimeout(350);
      if ((await ms.getAttribute("aria-expanded")) !== "true") problems.push("milestone won't expand");
      await ms.click(); await page.waitForTimeout(250);
    } else problems.push("no milestone button");

    const vd = page.locator('button:has-text("View details")');
    if (await vd.count()) {
      await vd.first().click(); await page.waitForTimeout(500);
      if (!(await page.getByRole("dialog").count())) problems.push("drawer won't open");
      else {
        const dc = await page.evaluate(() => {
          const ctx = document.createElement("canvas").getContext("2d");
          const lum = (c) => { ctx.clearRect(0,0,1,1); ctx.fillStyle = c; ctx.fillRect(0,0,1,1);
            const [r,g,bl] = ctx.getImageData(0,0,1,1).data; return (0.2126*r+0.7152*g+0.0722*bl)/255; };
          const p = document.querySelector('[role="dialog"]');
          let el = p, bg = getComputedStyle(p).backgroundColor;
          while (bg === "rgba(0, 0, 0, 0)" && el.parentElement) { el = el.parentElement; bg = getComputedStyle(el).backgroundColor; }
          return Math.abs(lum(getComputedStyle(p.querySelector("h3")).color) - lum(bg));
        });
        if (dc < 0.35) problems.push(`drawer contrast ${dc.toFixed(2)}`);
      }
      await page.keyboard.press("Escape");
      if (!(await waitFor(async () => (await page.getByRole("dialog").count()) === 0)))
        problems.push("Escape didn't close drawer");
    } else problems.push("no portfolio card");
    }
  } catch (e) {
    problems.push(`threw: ${String(e).slice(0, 90)}`);
  }

  if (errs.length) problems.push(`console: ${errs[0]}`);
  if (problems.length) { fails.push({ id, problems }); console.log(`FAIL ${id.padEnd(12)} ${problems.join("; ")}`); }
  else console.log(`PASS ${id}`);
  await page.close();
}
await b.close();
console.log(`\n${all.length - fails.length}/${all.length} templates clean`);
process.exit(fails.length ? 1 : 0);
