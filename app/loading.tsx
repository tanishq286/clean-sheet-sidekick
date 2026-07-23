import { ShieldCheck } from "lucide-react";
import { DashboardSkeleton } from "@/components/features/DashboardSkeleton";

export default function Loading() {
  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-black/[0.07] bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
            <ShieldCheck className="size-5 text-emerald-950" />
          </div>
          <p className="text-sm font-semibold tracking-tight">
            Clean Sheet <span className="text-emerald-600">Sidekick</span>
          </p>
        </div>
      </div>
      <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-8 space-y-3">
          <div className="h-8 w-2/3 max-w-xl animate-pulse rounded-lg bg-black/[0.06]" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-black/[0.06]" />
        </div>
        <DashboardSkeleton />
      </main>
    </div>
  );
}
