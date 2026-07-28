#!/usr/bin/env node
/**
 * Route smoke test — walks every publicly reachable page in a real browser.
 *
 * The template sweep proves the 36 designs render; this proves the app around
 * them does. For each route it checks: the SPA actually mounted (a bare white
 * screen from a lazy-chunk failure is the classic silent break), no uncaught
 * errors, no same-origin request failures, no horizontal overflow at phone
 * width, and that the expected content is present.
 *
 * Usage:
 *   npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
 *   npm run test:routes           # BASE=… CHROMIUM_PATH=… to override
 *
 * External requests are aborted rather than awaited: the page only needs its
 * own bundle, and waiting on a webfont CDN made this an order of magnitude
 * slower for no extra coverage.
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://127.0.0.1:4173";

/** `expect` is matched case-insensitively against the rendered text. */
const ROUTES = [
  { path: "/", name: "landing", expect: "Founder" },
  { path: "/auth", name: "sign in", expect: null },
  { path: "/discover", name: "directory", expect: "Discover founders" },
  { path: "/templates", name: "template gallery", expect: "Templates" },
  { path: "/templates/atlas", name: "template preview", expect: "Ada Rao" },
  { path: "/u/yash-mishra", name: "published profile", expect: "Yash Mishra", needsBackend: true },
  { path: "/u/this-slug-does-not-exist", name: "unknown profile", expect: null },
  { path: "/style-guide", name: "style guide", expect: null },
  { path: "/reset-password", name: "reset password", expect: null },
  { path: "/app", name: "dashboard (signed out)", expect: null },
  { path: "/app/admin", name: "admin (signed out)", expect: null },
  { path: "/definitely/not/a/route", name: "404", expect: null },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const failures = [];

for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // Block only the webfont CDNs: they add ~20s per page and change nothing.
  // Everything else — crucially Supabase — must be allowed, or data-backed
  // pages can never render and the test reports a failure it caused itself.
  await page.route("**/*", (r) => {
    const u = r.request().url();
    return /fonts\.(googleapis|gstatic)\.com/.test(u) ? r.abort() : r.continue();
  });

  const errors = [];
  const netFails = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
  let backendUnreachable = false;
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (u.startsWith(BASE)) netFails.push(u.replace(BASE, ""));
    else if (u.includes("supabase.co")) backendUnreachable = true;
  });
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("Failed to load resource")) errors.push(t.slice(0, 140));
  });

  const problems = [];
  let skipped = null;
  try {
    const res = await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    if (res && res.status() >= 400) problems.push(`HTTP ${res.status()}`);
    // Data-backed pages retry before surfacing an error, so give them the full
    // React Query backoff rather than calling a still-loading page broken.
    await page.waitForTimeout(route.needsBackend ? 12000 : 900);

    // A blank #root means a chunk failed or a render threw — the failure mode
    // that looks fine to a build and broken to a visitor.
    const mounted = await page.evaluate(() => {
      const root = document.getElementById("root");
      return !!root && root.children.length > 0 && (root.innerText ?? "").trim().length > 0;
    });
    if (!mounted) problems.push("blank screen (root empty)");

    if (route.expect) {
      const body = (await page.evaluate(() => document.body.innerText)) ?? "";
      if (!body.toLowerCase().includes(route.expect.toLowerCase())) {
        // Distinguish "the app is broken" from "this machine can't reach the
        // database" — reporting the second as a failure would be misleading.
        // The app now says so explicitly when it cannot reach the server, which
        // is a far more reliable signal than a requestfailed event.
        const offline = backendUnreachable || /couldn.t load this profile/i.test(body);
        if (route.needsBackend && offline) skipped = "backend unreachable from this host";
        else problems.push(`missing text "${route.expect}"`);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) problems.push(`h-overflow ${overflow}px @390`);
  } catch (e) {
    problems.push(`threw: ${String(e).slice(0, 100)}`);
  }

  if (errors.length) problems.push(`js error: ${errors[0]}`);
  if (netFails.length) problems.push(`request failed: ${netFails[0]}`);

  if (skipped && !problems.length) {
    console.log(`SKIP  ${route.name.padEnd(24)} ${route.path.padEnd(30)} ${skipped}`);
  } else if (problems.length) {
    failures.push(route);
    console.log(`FAIL  ${route.name.padEnd(24)} ${route.path.padEnd(30)} ${problems.join("; ")}`);
  } else {
    console.log(`PASS  ${route.name.padEnd(24)} ${route.path}`);
  }
  await page.close();
}

await browser.close();
console.log(`\n${ROUTES.length - failures.length}/${ROUTES.length} routes clean`);
process.exit(failures.length ? 1 : 0);
