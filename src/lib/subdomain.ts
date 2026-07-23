// Slug doubles as the future subdomain. When the Subdomain Manager is wired
// in, set VITE_PROFILE_DOMAIN to e.g. "founderid.app" and public links flip
// from /u/:slug to https://:slug.founderid.app automatically.

const DOMAIN = import.meta.env.VITE_PROFILE_DOMAIN as string | undefined;

export function publicProfileUrl(slug: string): string {
  if (DOMAIN) return `https://${slug}.${DOMAIN}`;
  if (typeof window !== "undefined") return `${window.location.origin}/u/${slug}`;
  return `/u/${slug}`;
}

// Extract a slug from a hostname like `jane.founderid.app`. Returns null when
// the host is not a configured profile subdomain.
export function slugFromHost(host: string): string | null {
  if (!DOMAIN) return null;
  const suffix = `.${DOMAIN}`;
  if (!host.endsWith(suffix)) return null;
  const sub = host.slice(0, -suffix.length);
  if (!sub || sub === "www") return null;
  return sub;
}