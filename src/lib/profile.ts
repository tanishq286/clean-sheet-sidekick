import { supabase } from "@/integrations/supabase/client";
import type { FullProfile, FounderProfile, Skill, Milestone, PortfolioItem } from "@/types/founder";

export async function fetchMyProfile(userId: string): Promise<FullProfile | null> {
  const { data: profile, error } = await supabase
    .from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!profile) return null;
  return await hydrate(profile as unknown as FounderProfile);
}

export async function fetchProfileBySlug(slug: string): Promise<FullProfile | null> {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, string>,
  ) => Promise<{ data: FounderProfile | FounderProfile[] | null; error: Error | null }>;
  const { data, error } = await rpc("get_public_profile_by_slug", { _slug: slug });
  if (error) throw error;
  const profile = Array.isArray(data) ? data[0] : data;
  if (!profile) return null;
  return await hydrate(profile as unknown as FounderProfile);
}

async function hydrate(profile: FounderProfile): Promise<FullProfile> {
  const [{ data: skills }, { data: milestones }, { data: portfolio }] = await Promise.all([
    supabase.from("skills").select("*").eq("profile_id", profile.id),
    supabase.from("journey_milestones").select("*").eq("profile_id", profile.id).order("order_index"),
    supabase.from("portfolio_items").select("*").eq("profile_id", profile.id).order("order_index"),
  ]);
  return {
    ...profile,
    skills: (skills ?? []) as Skill[],
    milestones: (milestones ?? []) as Milestone[],
    portfolio: (portfolio ?? []) as PortfolioItem[],
  };
}

export async function updateProfile(userId: string, patch: Partial<FounderProfile>) {
  const { error } = await supabase.from("profiles").update(patch as never).eq("id", userId);
  if (error) throw error;
}

export function publicAssetUrl(path: string) {
  const { data } = supabase.storage.from("profile-assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAsset(userId: string, file: File, kind = "misc"): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("profile-assets").upload(path, file, { upsert: true });
  if (error) throw error;
  return publicAssetUrl(path);
}