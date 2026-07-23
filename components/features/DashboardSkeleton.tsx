import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-xl p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Controls */}
      <Skeleton className="h-36 w-full rounded-xl" />

      {/* Matrix */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="flex border-b border-white/10 bg-white/[0.02] p-2">
          <Skeleton className="h-8 w-[160px]" />
          <div className="ml-2 flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-[80px]" />
            ))}
          </div>
        </div>
        {Array.from({ length: 10 }).map((_, r) => (
          <div key={r} className="flex items-center gap-2 border-b border-white/5 p-2">
            <Skeleton className="h-10 w-[160px]" />
            <div className="ml-0 flex gap-2">
              {Array.from({ length: 6 }).map((_, c) => (
                <Skeleton key={c} className="h-12 w-[80px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
