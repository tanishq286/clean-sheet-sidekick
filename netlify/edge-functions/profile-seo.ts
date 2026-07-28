/**
 * Server-side <head> prerender for published founder profiles.
 *
 *   GET /u/<slug>  ->  index.html with real title/meta/canonical/JSON-LD baked in
 *
 * The app is a client-rendered Vite SPA, so <SeoHead> injects its tags with
 * JavaScript. Google renders JS and sees them; most AI crawlers (and every
 * structured-data validator) do not — they read the raw HTML and find only the
 * generic site-level tags from index.html. This edge function closes that gap:
 * it fetches the profile from Supabase, rewrites the managed head tags, and
 * streams the result back before anything reaches the browser.
 *
 * Design notes:
 *  - Structured data comes from netlify/lib/seo.generated.mjs, which is
 *    compiled from the app's own src/lib/geo/schema.ts. The edge output and
 *    the client output are the same code, so they cannot disagree.
 *  - Only *published* profiles are rewritten. Drafts fall through untouched
 *    and keep the client-side owner-preview behaviour (and its noindex).
 *  - Any failure — missing env, Supabase down, slow response — returns the
 *    original HTML. The page always renders; only the head enrichment is lost.
 */

import { buildJsonLdString, profileUrl } from "../lib/seo.generated.mjs";

interface EdgeContext {
  next: () => Promise<Response>;
}

/** Only the fields this function reads directly; the rest is passed straight
 *  to the shared schema builders, which do their own narrowing. */
interface EdgeProfile {
  id: string;
  slug: string;
  is_published?: boolean;
  identity?: { name?: string; headline?: string; bio?: string };
  founder?: { current_venture?: string; mission?: string; problem?: string };
  theme?: { accent?: string };
  [key: string]: unknown;
}

/** Env getter that works on both Netlify's edge runtime and bare Deno. */
function readEnv(key: string): string | undefined {
  const g = globalThis as unknown as {
    Netlify?: { env?: { get(k: string): string | undefined } };
    Deno?: { env?: { get(k: string): string | undefined } };
  };
  return g.Netlify?.env?.get(key) ?? g.Deno?.env?.get(key);
}

const FETCH_TIMEOUT_MS = 3000;

/** Head tags this function owns; the originals are stripped before injection. */
const MANAGED_META = new Set([
  "description",
  "robots",
  "twitter:card",
  "twitter:title",
  "twitter:description",
  "twitter:image",
  "twitter:url",
  "og:type",
  "og:title",
  "og:description",
  "og:url",
  "og:image",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** JSON-LD lives in a script body, so only the closing-tag sequence matters. */
function escapeJsonLd(value: string): string {
  return value.replace(/</g, "\\u003c");
}

async function supabaseFetch(
  path: string,
  init: RequestInit,
  baseUrl: string,
  key: string,
): Promise<unknown> {
  const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

/** Mirrors src/lib/profile.ts: RPC for the profile, then its related rows. */
async function fetchPublishedProfile(slug: string): Promise<EdgeProfile | null> {
  const baseUrl = readEnv("VITE_SUPABASE_URL");
  const key = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!baseUrl || !key) return null;

  const rpc = await supabaseFetch(
    "rpc/get_public_profile_by_slug",
    { method: "POST", body: JSON.stringify({ _slug: slug }) },
    baseUrl,
    key,
  );
  const profile = (Array.isArray(rpc) ? rpc[0] : rpc) as EdgeProfile | null;
  if (!profile?.id) return null;

  const id = profile.id;
  const [skills, milestones, portfolio] = await Promise.all([
    supabaseFetch(`skills?profile_id=eq.${id}&select=*`, { method: "GET" }, baseUrl, key),
    supabaseFetch(`journey_milestones?profile_id=eq.${id}&select=*&order=order_index`, { method: "GET" }, baseUrl, key),
    supabaseFetch(`portfolio_items?profile_id=eq.${id}&select=*&order=order_index`, { method: "GET" }, baseUrl, key),
  ]);

  return { ...profile, skills, milestones, portfolio };
}

/** Remove the tags we're about to replace, so index.html's defaults don't win. */
function stripManagedTags(head: string): string {
  return head
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<link\b[^>]*\brel=["']?canonical["']?[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, (tag) => {
      const key = tag.match(/\b(?:name|property)=["']([^"']+)["']/i)?.[1];
      return key && MANAGED_META.has(key.toLowerCase()) ? "" : tag;
    });
}

function buildHead(profile: EdgeProfile, origin: string): string {
  const name = profile.identity?.name || "Founder";
  const headline = profile.identity?.headline || "";
  const url = profileUrl(profile, origin);
  const title = `${name}${headline ? ` — ${headline}` : " — Founder Profile"}`;
  const description: string =
    profile.identity?.bio ||
    profile.founder?.mission ||
    profile.founder?.problem ||
    `${name}'s founder profile.`;

  const ogImage = `${origin}/api/og?${new URLSearchParams({
    name,
    role: headline || (profile.founder?.current_venture ? `Founder, ${profile.founder.current_venture}` : "Founder"),
    title: description,
    theme: profile.theme?.accent ?? "#FF6B35",
  }).toString()}`;

  const meta = (attr: "name" | "property", key: string, content: string) =>
    `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;

  return [
    `<title>${escapeHtml(title)}</title>`,
    meta("name", "description", description),
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    meta("name", "robots", "index, follow, max-snippet:-1, max-image-preview:large"),
    meta("property", "og:type", "profile"),
    meta("property", "og:title", title),
    meta("property", "og:description", description),
    meta("property", "og:url", url),
    meta("property", "og:image", ogImage),
    meta("property", "og:image:width", "1200"),
    meta("property", "og:image:height", "630"),
    meta("property", "og:image:alt", `${name} — founder profile card`),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", description),
    meta("name", "twitter:image", ogImage),
    meta("name", "twitter:url", url),
    // Same id <SeoHead> uses, so the client updates this node instead of
    // appending a second, conflicting graph after hydration.
    `<script type="application/ld+json" id="founderid-jsonld">${escapeJsonLd(buildJsonLdString(profile, origin))}</script>`,
  ].join("\n    ");
}

export default async (request: Request, context: EdgeContext): Promise<Response> => {
  const response = await context.next();

  if (request.method !== "GET") return response;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;

  const url = new URL(request.url);
  const slug = url.pathname.match(/^\/u\/([^/]+)\/?$/)?.[1];
  if (!slug) return response;

  try {
    const profile = await fetchPublishedProfile(decodeURIComponent(slug));
    // The RPC already filters on is_published; re-check in case that changes.
    if (!profile || profile.is_published === false) return response;

    const html = await response.text();
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (!headMatch) return new Response(html, response);

    const rewritten = html.replace(
      headMatch[0],
      headMatch[0].replace(headMatch[1], `${stripManagedTags(headMatch[1])}\n    ${buildHead(profile, url.origin)}\n  `),
    );

    const headers = new Headers(response.headers);
    // Let the CDN serve the prerendered HTML so crawler traffic doesn't hit
    // Supabase on every request. Browsers still revalidate immediately.
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set("Netlify-CDN-Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    headers.delete("content-length");

    return new Response(rewritten, { status: response.status, headers });
  } catch (err) {
    console.error("[profile-seo] prerender skipped:", err);
    return response;
  }
};

export const config = { path: "/u/*" };
