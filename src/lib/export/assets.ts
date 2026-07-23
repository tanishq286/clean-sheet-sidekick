import { supabase } from "@/integrations/supabase/client";
import type { FullProfile } from "@/types/founder";

export interface CollectedAsset {
  originalUrl: string;
  localPath: string; // e.g. "assets/avatar.png"
  blob: Blob;
}

const BUCKET = "profile-assets";

function extractStoragePath(url: string): string | null {
  // public URL form: .../storage/v1/object/public/profile-assets/<path>
  // signed URL form: .../storage/v1/object/sign/profile-assets/<path>?token=...
  const m = url.match(/\/profile-assets\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function extOf(url: string, fallback = "bin") {
  const clean = url.split("?")[0];
  const m = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : fallback;
}

async function downloadOne(url: string): Promise<Blob | null> {
  const path = extractStoragePath(url);
  if (path) {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) {
      console.warn("storage download failed, falling back to fetch", path, error);
    } else if (data) return data;
  }
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    return await res.blob();
  } catch (e) {
    console.warn("fetch failed", url, e);
    return null;
  }
}

/** Walks the profile, downloads every referenced asset, returns assets + a URL→localPath map */
export async function collectAssets(profile: FullProfile): Promise<{
  assets: CollectedAsset[];
  urlMap: Record<string, string>;
}> {
  const seen = new Map<string, string>(); // url -> localPath
  const out: CollectedAsset[] = [];
  const queue: { url: string; kind: string }[] = [];

  if (profile.identity?.photo_url) queue.push({ url: profile.identity.photo_url, kind: "avatar" });
  profile.portfolio.forEach((p, i) => {
    if (p.file_url) queue.push({ url: p.file_url, kind: `portfolio-${i + 1}` });
  });

  let n = 0;
  for (const item of queue) {
    if (seen.has(item.url)) continue;
    const blob = await downloadOne(item.url);
    if (!blob) continue;
    n += 1;
    const localPath = `assets/${item.kind}-${n}.${extOf(item.url)}`;
    seen.set(item.url, localPath);
    out.push({ originalUrl: item.url, localPath, blob });
  }

  return { assets: out, urlMap: Object.fromEntries(seen) };
}

/** Rewrite asset URLs inside a profile object to point at local relative paths */
export function rewriteProfileUrls(profile: FullProfile, urlMap: Record<string, string>): FullProfile {
  const rewrite = (u?: string | null) => (u && urlMap[u] ? urlMap[u] : u ?? undefined);
  return {
    ...profile,
    identity: { ...profile.identity, photo_url: rewrite(profile.identity?.photo_url) },
    portfolio: profile.portfolio.map((p) => ({ ...p, file_url: rewrite(p.file_url) ?? null })),
  };
}