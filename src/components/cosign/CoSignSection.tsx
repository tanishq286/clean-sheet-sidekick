import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfileCoSigns } from "@/lib/cosign";
import NetworkWeb from "./NetworkWeb";
import CoSignModal from "./CoSignModal";
import type { FullProfile } from "@/types/founder";

/**
 * The co-sign block on a public profile: the network graphic, plus the way in
 * for a visitor who wants to vouch for this founder.
 *
 * The entry point lives here rather than on each portfolio card. There are 36
 * templates and they render portfolio items in very different shapes — some as
 * a grid, some as a list, some not at all — so a button injected into every
 * one would be 36 chances to break a layout, and would silently miss the
 * templates that show no portfolio. One section that names the project
 * explicitly in the modal reaches every design identically.
 *
 * Hidden entirely when there is nothing to show and nobody who could act: an
 * empty "network" on a new profile advertises that the founder has no peers,
 * which is the opposite of what the feature is for.
 */
export default function CoSignSection({ profile }: { profile: FullProfile }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: cosigns = [] } = useQuery({
    queryKey: ["profile-cosigns", profile.slug],
    queryFn: () => fetchProfileCoSigns(profile.slug),
    enabled: !!profile.slug && profile.is_published,
  });

  const projects = (profile.portfolio ?? []).map((p) => ({ id: p.id, title: p.title }));
  const isOwnProfile = user?.id === profile.id;
  // Only a signed-in visitor who isn't the owner can act, and only if there is
  // something to co-sign. Anyone else just sees the network, if it exists.
  const canCoSign = !!user && !isOwnProfile && projects.length > 0;

  if (cosigns.length === 0 && !canCoSign) return null;

  const name = profile.identity?.name ?? profile.slug;

  return (
    <>
      {cosigns.length > 0 && (
        <NetworkWeb
          cosigns={cosigns}
          centreName={name}
          centrePhoto={profile.identity?.photo_url}
          accent={profile.theme?.accent ?? "#FF6B35"}
        />
      )}

      {canCoSign && (
        <div className={`mx-auto w-full max-w-3xl px-6 ${cosigns.length > 0 ? "pb-16" : "py-16"} text-center`}>
          {cosigns.length === 0 && (
            <p className="mb-4 text-sm opacity-70">
              Worked with {name}? Vouch for it — verified endorsements show up on both profiles.
            </p>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-sm font-medium transition hover:bg-current/[0.06]"
          >
            <ShieldCheck className="h-4 w-4" />
            Co-sign {name}&apos;s work
          </button>
        </div>
      )}

      <CoSignModal
        open={open}
        onClose={() => setOpen(false)}
        targetUserId={profile.id}
        targetName={name}
        projects={projects}
      />
    </>
  );
}
