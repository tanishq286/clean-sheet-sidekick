import { useState } from "react";
import { useUpdateProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { FullProfile } from "@/types/founder";

/**
 * Publish / unpublish your own profile.
 *
 * This was missing entirely — the dashboard reported publish *status* but gave
 * no way to change it, so the only route to going live was editing the database
 * directly. Owning your own visibility is the most basic self-service control
 * there is, so it sits on the dashboard rather than behind a settings page.
 *
 * Unpublishing asks for confirmation: it removes a live page that may already
 * be shared, indexed, or linked from someone's LinkedIn.
 */
export default function PublishToggle({ profile }: { profile: FullProfile }) {
  const update = useUpdateProfile();
  const [confirming, setConfirming] = useState(false);
  const live = profile.is_published;

  const setPublished = async (next: boolean) => {
    try {
      await update.mutateAsync({ is_published: next });
      setConfirming(false);
      toast({
        title: next ? "Profile is live" : "Profile unpublished",
        description: next
          ? `Anyone with the link can now see /u/${profile.slug}.`
          : "It's back to a private draft. The public link now 404s.",
      });
    } catch (e) {
      toast({
        title: "Couldn't update",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
            />
            <h3 className="font-semibold">{live ? "Published" : "Draft"}</h3>
          </div>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {live
              ? "Your profile is live, indexable, and included in llms.txt for AI crawlers."
              : "Only you can see this. Publishing makes it readable at your public link and by search engines."}
          </p>
        </div>

        {live ? (
          confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Take it offline?</span>
              <Button size="sm" variant="destructive" onClick={() => setPublished(false)} disabled={update.isPending}>
                {update.isPending ? "Working…" : "Yes, unpublish"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
              Unpublish
            </Button>
          )
        ) : (
          <Button size="sm" onClick={() => setPublished(true)} disabled={update.isPending}>
            {update.isPending ? "Publishing…" : "Publish profile"}
          </Button>
        )}
      </div>
    </div>
  );
}
