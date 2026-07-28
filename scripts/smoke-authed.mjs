#!/usr/bin/env node
/**
 * Signed-in route smoke test.
 *
 * The public suite can only reach pages a logged-out visitor sees, which left
 * the dashboard, editor, design page and admin table — most of the app — with
 * no browser coverage at all.
 *
 * Rather than depend on a live account, this injects a session into
 * localStorage and serves Supabase responses from fixtures. That is a
 * deliberate trade: it verifies the *UI* (does it mount, throw, or overflow)
 * and not the backend, which the RLS probes and the live site already cover.
 * The upside is that it runs anywhere, including CI and sandboxes with no
 * outbound network, so signed-in regressions get caught on every run.
 *
 *   npm run test:authed        # BASE=… CHROMIUM_PATH=… to override
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE ?? "http://127.0.0.1:4173";

// The project ref decides the localStorage key supabase-js reads its session
// from, so it has to match the build under test.
const env = readFileSync(join(ROOT, ".env"), "utf8");
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL="?([^"\n]+)"?/)?.[1] ?? "";
const REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";
if (!REF) {
  console.error("Could not read VITE_SUPABASE_URL from .env — cannot build a session key.");
  process.exit(1);
}

const USER_ID = "00000000-0000-4000-8000-000000000001";
const SESSION = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "smoke@example.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const PROFILE = {
  id: USER_ID,
  slug: "smoke-tester",
  is_published: true,
  template_id: "dossier",
  theme: { accent: "#FF6B35", mode: "dark", fontPreset: "rubik" },
  identity: { name: "Smoke Tester", headline: "Testing the dashboard", bio: "A fixture.", location: "Nowhere", college: "EDII" },
  founder: { current_venture: "Fixture Co", industry: "Testing", stage: "mvp", problem: "p", mission: "m" },
  vision: { problem_solving: "x", why_it_matters: "y" },
  contact: { email: "smoke@example.test" },
  looking_for: ["cofounder"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-07-28T00:00:00Z",
};

const SKILLS = [{ id: "s1", profile_id: USER_ID, tag: "product" }];
const MILESTONES = [
  { id: "m1", profile_id: USER_ID, year: "2024", title: "Started", description: "d", order_index: 0 },
];
const PORTFOLIO = [
  { id: "x1", profile_id: USER_ID, kind: "website", title: "Site", description: "d", url: "https://example.com", file_url: null, order_index: 0 },
];

/** Fixture router: URL in, JSON body out. */
function fixtureFor(url, method) {
  const u = url.replace(SUPABASE_URL, "");
  if (u.startsWith("/auth/v1/user")) return SESSION.user;
  if (u.startsWith("/auth/v1/token")) return SESSION;
  if (u.startsWith("/auth/v1/logout")) return {};
  if (u.includes("/rest/v1/rpc/my_profile_view_stats")) return [{ total: 12, last_7d: 3, last_30d: 8 }];
  if (u.includes("/rest/v1/rpc/admin_overview"))
    return [{ total_users: 5, total_profiles: 5, published_profiles: 2, draft_profiles: 3, total_views: 12, views_7d: 3, total_colleges: 66, signups_7d: 1 }];
  if (u.includes("/rest/v1/rpc/admin_list_profiles"))
    return [{ ...PROFILE, name: "Smoke Tester", email: "smoke@example.test", views: 12, is_admin: true }];
  if (u.includes("/rest/v1/rpc/list_public_profiles")) return [PROFILE];
  if (u.includes("/rest/v1/rpc/")) return method === "POST" ? {} : [];
  if (u.startsWith("/rest/v1/user_roles")) return [{ role: "admin" }];
  if (u.startsWith("/rest/v1/profiles")) return [PROFILE];
  if (u.startsWith("/rest/v1/skills")) return SKILLS;
  if (u.startsWith("/rest/v1/journey_milestones")) return MILESTONES;
  if (u.startsWith("/rest/v1/portfolio_items")) return PORTFOLIO;
  if (u.startsWith("/rest/v1/colleges")) return [];
  if (u.startsWith("/rest/v1/college_members")) return [];
  return [];
}

const ROUTES = [
  // The greeting is first-name only ("Hi, Smoke."), which is worth pinning:
  // it is the one place the dashboard proves it loaded *your* profile.
  { path: "/app", name: "dashboard · greeting", expect: "Hi, Smoke" },
  { path: "/app", name: "dashboard · slug", expect: "smoke-tester" },
  // Assert the number, not just the heading — a heading renders even when the
  // stats call is broken, so only the value proves the wiring works.
  { path: "/app", name: "dashboard · view count", expect: "12" },
  { path: "/app", name: "dashboard · publish control", expect: "Published" },
  { path: "/app", name: "dashboard · danger zone", expect: "Delete account" },
  { path: "/app/edit", name: "editor", expect: "Edit your profile" },
  { path: "/app/design", name: "design", expect: "Template" },
  { path: "/app/export", name: "export", expect: null },
  { path: "/app/admin", name: "admin dashboard", expect: "Admin" },
  { path: "/app/admin", name: "admin · people table", expect: "smoke@example.test" },
  { path: "/app/college", name: "college admin", expect: null },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const failures = [];

for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Seed the session before any app code runs, so getSession() resolves from
  // storage and never needs the network.
  await context.addInitScript(
    ([key, session]) => window.localStorage.setItem(key, JSON.stringify(session)),
    [`sb-${REF}-auth-token`, SESSION],
  );

  const page = await context.newPage();
  await page.route("**/*", async (r) => {
    const url = r.request().url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) return r.abort();
    if (url.startsWith(SUPABASE_URL)) {
      return r.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(fixtureFor(url, r.request().method())),
      });
    }
    return r.continue();
  });

  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("Failed to load resource")) errors.push(t.slice(0, 140));
  });

  const problems = [];
  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1800);

    const mounted = await page.evaluate(() => {
      const root = document.getElementById("root");
      return !!root && (root.innerText ?? "").trim().length > 0;
    });
    if (!mounted) problems.push("blank screen (root empty)");

    const body = (await page.evaluate(() => document.body.innerText)) ?? "";
    if (/redirecting|sign in to continue/i.test(body) && route.path.startsWith("/app")) {
      problems.push("bounced to sign-in despite a session");
    }
    if (route.expect && !body.toLowerCase().includes(route.expect.toLowerCase())) {
      problems.push(`missing text "${route.expect}"`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) problems.push(`h-overflow ${overflow}px @390`);
  } catch (e) {
    problems.push(`threw: ${String(e).slice(0, 100)}`);
  }

  if (errors.length) problems.push(`js error: ${errors[0]}`);

  if (problems.length) {
    failures.push(route);
    console.log(`FAIL  ${route.name.padEnd(28)} ${route.path.padEnd(14)} ${problems.join("; ")}`);
  } else {
    console.log(`PASS  ${route.name.padEnd(28)} ${route.path}`);
  }
  await context.close();
}

/* ------------------------------------------------------------------ */
/* Interaction: account deletion must stay locked until identity is    */
/* re-proved. This is the only irreversible action in the product, so  */
/* rendering the form correctly is not enough — the gate has to hold.  */
/* ------------------------------------------------------------------ */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(
    ([key, session]) => window.localStorage.setItem(key, JSON.stringify(session)),
    [`sb-${REF}-auth-token`, SESSION],
  );
  const page = await context.newPage();
  await page.route("**/*", async (r) => {
    const url = r.request().url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) return r.abort();
    if (url.startsWith(SUPABASE_URL)) {
      return r.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(fixtureFor(url, r.request().method())),
      });
    }
    return r.continue();
  });

  const check = (name, pass, detail = "") => {
    if (pass) console.log(`PASS  ${name}`);
    else {
      failures.push({ name });
      console.log(`FAIL  ${name}${detail ? "  — " + detail : ""}`);
    }
    return pass;
  };

  try {
    await page.goto(`${BASE}/app`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);

    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.waitForTimeout(300);

    const del = page.getByRole("button", { name: "Permanently delete" });
    check("delete · disabled on open", await del.isDisabled());

    // The session fixture declares the "email" provider, so a password is
    // required rather than an email retype.
    check("delete · asks for a password", await page.getByPlaceholder("Your password").count() === 1);

    await page.getByPlaceholder("DELETE").fill("DELETE");
    await page.waitForTimeout(200);
    check("delete · still locked without the password", await del.isDisabled());

    await page.getByPlaceholder("Your password").fill("hunter2");
    await page.waitForTimeout(200);
    check("delete · unlocks once both are given", !(await del.isDisabled()));

    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);
    check(
      "delete · cancel clears the form",
      await page.getByRole("button", { name: "Delete my account" }).count() === 1,
    );
  } catch (e) {
    check("delete gating", false, String(e).slice(0, 110));
  }
  await context.close();
}

await browser.close();
const total = ROUTES.length + 5;
console.log(`\n${total - failures.length}/${total} signed-in checks clean`);
process.exit(failures.length ? 1 : 0);
