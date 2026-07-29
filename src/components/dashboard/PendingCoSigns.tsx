import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchPendingCoSigns, fetchProfileCoSigns, answerCoSign, setCoSignFeatured,
  RELATIONSHIP_LABEL,
} from "@/lib/cosign";

/**
 * Incoming co-sign requests, plus the ones already accepted.
 *
 * Accepting is the moment a stranger's claim becomes part of this founder's
 * public profile, so the note is shown in full before the buttons — deciding
 * without reading what you are endorsing would defeat the point of the
 * feature.
 */
export default function PendingCoSigns({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["pending-cosigns", user?.id],
    queryFn: fetchPendingCoSigns,
    enabled: !!user,
  });

  const { data: all = [] } = useQuery({
    queryKey: ["profile-cosigns", slug],
    queryFn: () => fetchProfileCoSigns(slug),
    enabled: !!slug,
  });
  const accepted = all.filter((c) => c.direction === "received");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["pending-cosigns"] });
    qc.invalidateQueries({ queryKey: ["profile-cosigns"] });
  };

  const answer = async (id: string, accept: boolean, who: string) => {
    try {
      await answerCoSign(id, accept);
      toast({
        title: accept ? "Co-sign accepted" : "Co-sign declined",
        description: accept
          ? `${who}'s endorsement is now on your public profile.`
          : "Nothing was published.",
      });
      refresh();
    } catch (err) {
      toast({
        title: "Couldn't update that",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const feature = async (id: string, next: boolean) => {
    try {
      await setCoSignFeatured(id, next);
      refresh();
    } catch (err) {
      toast({
        title: "Couldn't update that",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />;

  if (pending.length === 0 && accepted.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold">No co-signs yet</h3>
        <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
          When someone you worked with vouches for one of your projects, the request lands here.
          Nothing appears on your public profile until you accept it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <h3 className="font-semibold">
              Requests{" "}
              <span className="text-sm font-normal text-muted-foreground tabular-nums">
                {pending.length} waiting
              </span>
            </h3>
          </div>
          <ul className="divide-y">
            {pending.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <a href={`/u/${c.peer_slug}`} className="font-medium hover:underline">
                    {c.peer_name}
                  </a>
                  <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {RELATIONSHIP_LABEL[c.relationship_type]}
                  </span>
                  {c.project_title && (
                    <span className="text-xs text-muted-foreground">on {c.project_title}</span>
                  )}
                </div>
                {c.peer_headline && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.peer_headline}</p>
                )}
                {c.note && (
                  <p className="mt-2 border-l-2 pl-3 text-sm italic text-muted-foreground">
                    “{c.note}”
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void answer(c.id, true, c.peer_name)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void answer(c.id, false, c.peer_name)}>
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {accepted.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <h3 className="font-semibold">
              On your profile{" "}
              <span className="text-sm font-normal text-muted-foreground tabular-nums">
                {accepted.length}
              </span>
            </h3>
          </div>
          <ul className="divide-y">
            {accepted.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <a href={`/u/${c.peer_slug}`} className="font-medium hover:underline">
                      {c.peer_name}
                    </a>
                    <span className="text-xs text-muted-foreground">
                      {RELATIONSHIP_LABEL[c.relationship_type]}
                      {c.project_title ? ` · ${c.project_title}` : ""}
                    </span>
                  </div>
                  {c.note && (
                    <p className="mt-1 line-clamp-1 text-sm italic text-muted-foreground">“{c.note}”</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={c.featured ? "default" : "outline"}
                  onClick={() => void feature(c.id, !c.featured)}
                  aria-pressed={c.featured}
                >
                  <Star className={`mr-1.5 h-3.5 w-3.5 ${c.featured ? "fill-current" : ""}`} />
                  {c.featured ? "Featured" : "Feature"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
