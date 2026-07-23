import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchProfileBySlug } from "@/lib/profile";
import { getTemplate } from "@/templates/registry";
import HabitsBlock from "@/templates/shared/HabitsBlock";

export default function PublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: () => fetchProfileBySlug(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (!profile) return;
    const name = profile.identity?.name ?? "Founder";
    document.title = `${name} — Founder Profile`;
    setMeta("description", profile.identity?.bio ?? `${name}'s founder profile.`);
    setMeta("og:title", `${name} — Founder Profile`, true);
    setMeta("og:description", profile.identity?.bio ?? "", true);
    if (profile.identity?.photo_url) setMeta("og:image", profile.identity.photo_url, true);
  }, [profile]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-3xl font-bold mb-2">Profile not found</h1>
      <p className="text-muted-foreground">This profile doesn't exist or hasn't been published yet.</p>
    </div>
  );

  const Template = getTemplate(profile.template_id).Component;
  return (
    <>
      <Template profile={profile} />
      {profile.theme?.display_habits && <HabitsBlock slug={profile.slug} />}
    </>
  );
}

function setMeta(name: string, content: string, og = false) {
  const attr = og ? "property" : "name";
  let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}