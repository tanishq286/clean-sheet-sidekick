import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { recordProfileView } from "@/lib/analytics";
import { useQuery } from "@tanstack/react-query";
import { fetchProfileBySlug, fetchMyProfile } from "@/lib/profile";
import { useAuth } from "@/hooks/useAuth";
import { getTemplate } from "@/templates/registry";
import HabitsBlock from "@/templates/shared/HabitsBlock";
import SeoHead from "@/components/GeoAeoEngine/SeoHead";
import ContactSection from "@/components/ContactSection";
import SoundToggle from "@/components/SoundToggle";

export default function PublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: profile, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["public-profile", slug, user?.id ?? null],
    queryFn: async () => {
      const published = await fetchProfileBySlug(slug!);
      if (published) return published;
      // Owner preview: the public RPC only returns published profiles, so let a
      // signed-in owner view their own draft (this is why "View public profile"
      // looked broken before publishing).
      if (user) {
        const mine = await fetchMyProfile(user.id);
        if (mine && mine.slug === slug) return mine;
      }
      return null;
    },
    enabled: !!slug,
  });

  // Record the visit once the slug resolves. Owner views and repeat hits from
  // the same browser within 30 minutes are filtered out server-side, and the
  // call is fire-and-forget so analytics can never delay the page.
  useEffect(() => {
    if (slug && profile?.is_published) void recordProfileView(slug);
  }, [slug, profile?.is_published]);

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      Loading profile…
    </div>
  );
  // A failed request is NOT the same as a profile that doesn't exist. Rendering
  // "this profile isn't here" when the backend was merely unreachable tells a
  // visitor the founder has no page — the worst possible lie for a product
  // whose value is a link someone else shared.
  if (isError) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="mb-3 font-['JetBrains_Mono'] text-xs uppercase tracking-[0.25em] text-muted-foreground">Connection problem</p>
      <h1 className="font-['Archivo_Black'] text-4xl tracking-tight mb-3">Couldn&apos;t load this profile</h1>
      <p className="max-w-md text-muted-foreground">
        The profile may well exist — we just couldn&apos;t reach the server. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={() => void refetch()}
        disabled={isRefetching}
        className="mt-6 rounded-lg border px-4 py-2 text-sm transition hover:bg-muted disabled:opacity-60"
      >
        {isRefetching ? "Retrying…" : "Try again"}
      </button>
      <a href="/" className="mt-4 text-sm text-[#FF6B35] hover:underline">Go to Founder ID →</a>
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
      {!profile.is_published && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-amber-950">
          Preview — this profile isn&apos;t published yet. Publish it from your dashboard to share the link.
        </div>
      )}
      <SeoHead profile={profile} />
      {/* Floating so it works across all six templates without any of them
          needing to reserve a slot for it. */}
      <div className="fixed bottom-4 right-4 z-40">
        <SoundToggle className="border-current/30 bg-background/80 backdrop-blur-sm" />
      </div>
      <Template profile={profile} />
      {profile.theme?.display_habits && <HabitsBlock slug={profile.slug} />}
      {/* Absent means on: profiles created before this setting existed keep
          the contact form they already had. */}
      {(profile.theme?.show_contact ?? true) && (
        <ContactSection
          name={profile.identity?.name}
          email={profile.contact?.email}
          slug={profile.slug}
          accent={profile.theme?.accent ?? "#FF6B35"}
        />
      )}
    </>
  );
}