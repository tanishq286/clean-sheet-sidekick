import { useQuery } from "@tanstack/react-query";
import { fetchMyViewStats } from "@/lib/analytics";
import Counter from "@/components/Counter";

/**
 * "Who looked at my profile" — the one number that gives a founder a reason to
 * come back after publishing.
 *
 * Deliberately honest when it is zero: an empty state that explains *why*
 * there is nothing yet is more useful than three zeroes with no context.
 */
export default function ViewsCard({ isPublished }: { isPublished: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["my-view-stats"],
    queryFn: fetchMyViewStats,
    staleTime: 60_000,
  });

  const stats = data ?? { total: 0, last_7d: 0, last_30d: 0 };

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-semibold">Profile views</h3>
        {!isPublished && (
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
            Not published
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Last 7 days", value: stats.last_7d },
            { label: "Last 30 days", value: stats.last_30d },
            { label: "All time", value: stats.total },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-semibold tabular-nums">
                <Counter value={s.value} />
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {!isPublished
          ? "Publish your profile to start counting views."
          : stats.total === 0
            ? "No views yet. Share your profile link — views from your own account aren't counted."
            : "Your own visits are excluded, and repeat views from the same browser within 30 minutes count once."}
      </p>
    </div>
  );
}
