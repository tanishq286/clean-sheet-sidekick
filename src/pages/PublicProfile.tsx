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

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      Loading profile…
    </div>
  );
  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="mb-3 font-['JetBrains_Mono'] text-xs uppercase tracking-[0.25em] text-muted-foreground">Not found</p>
      <h1 className="font-['Archivo_Black'] text-4xl tracking-tight mb-3">This profile isn&apos;t here</h1>
      <p className="max-w-md text-muted-foreground">It doesn&apos;t exist yet, or the founder hasn&apos;t published it. Check the link and try again.</p>
      <a href="/" className="mt-6 text-sm text-[#FF6B35] hover:underline">Go to Founder ID →</a>
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