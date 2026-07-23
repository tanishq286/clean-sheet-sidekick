"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, Github } from "lucide-react";
import { Header } from "@/components/features/Header";
import { StatCards } from "@/components/features/StatCards";
import { Filters, DEFAULT_FILTERS, PRICE_MIN, PRICE_MAX } from "@/components/features/Filters";
import { OddsToggle } from "@/components/features/OddsToggle";
import { ExportButton } from "@/components/features/ExportButton";
import { RotationPlanner } from "@/components/features/RotationPlanner";
import { HeatmapMatrix } from "@/components/features/HeatmapMatrix";
import { Legend } from "@/components/features/Legend";
import { DashboardSkeleton } from "@/components/features/DashboardSkeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCleanSheetData, useOdds, queryKeys } from "@/lib/hooks";
import { mergeOdds } from "@/lib/clean-sheet";
import { generateMockCleanSheetData, generateOddsFromData } from "@/lib/mock-data";
import type { HeatmapFilters, OddsMode, TeamCleanSheetRow } from "@/lib/types";

export function Dashboard() {
  const queryClient = useQueryClient();
  const cleanSheetQuery = useCleanSheetData();
  const oddsQuery = useOdds();

  const [mode, setMode] = React.useState<OddsMode>("model");
  const [filters, setFilters] = React.useState<HeatmapFilters>(DEFAULT_FILTERS);
  const matrixRef = React.useRef<HTMLDivElement | null>(null);

  // Client-side last-resort fallback so the UI is never blank.
  const clientFallback = React.useMemo(() => generateMockCleanSheetData("mock"), []);

  const baseData = cleanSheetQuery.data ?? (cleanSheetQuery.isError ? clientFallback : undefined);
  const odds =
    oddsQuery.data ??
    (oddsQuery.isError && baseData ? generateOddsFromData(baseData, "mock") : undefined);

  const data = React.useMemo(() => {
    if (!baseData) return undefined;
    return odds ? mergeOdds(baseData, odds) : baseData;
  }, [baseData, odds]);

  // Surface upstream failures without breaking the experience.
  React.useEffect(() => {
    if (cleanSheetQuery.isError) {
      toast.warning("Live FPL feed unavailable", {
        description: "Showing offline demo data so you can keep planning.",
        id: "fpl-fallback",
      });
    }
  }, [cleanSheetQuery.isError]);

  const handleRefresh = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.cleanSheet });
    void queryClient.invalidateQueries({ queryKey: queryKeys.odds });
  }, [queryClient]);

  const displayRows = React.useMemo<TeamCleanSheetRow[]>(() => {
    if (!data) return [];
    const priceActive = filters.minPrice > PRICE_MIN || filters.maxPrice < PRICE_MAX;
    const teamsInPrice = new Set<number>();
    if (priceActive) {
      for (const def of data.defenders) {
        if (def.price >= filters.minPrice && def.price <= filters.maxPrice) {
          teamsInPrice.add(def.teamId);
        }
      }
    }
    return data.rows.filter((row) => {
      if (filters.teamIds.length > 0 && !filters.teamIds.includes(row.team.id)) return false;
      if (priceActive && !teamsInPrice.has(row.team.id)) return false;
      return true;
    });
  }, [data, filters]);

  const isFetching = cleanSheetQuery.isFetching || oddsQuery.isFetching;

  return (
    <TooltipProvider delayDuration={120}>
      <Header
        nextGameweek={data?.nextGameweek ?? null}
        source={data?.source ?? null}
        isFetching={isFetching}
        onRefresh={handleRefresh}
      />

      <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Gameweek intelligence
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find the <span className="text-emerald-600 text-glow-emerald">clean sheets</span> before
            everyone else
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            A defensive fixture heatmap for Fantasy Premier League. Model-based clean-sheet
            probabilities across the next {data?.horizon.length ?? 6} gameweeks, an odds overlay, and
            a rotation planner to squeeze value from budget defenders.
          </p>
        </motion.section>

        {!data ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-6">
            <StatCards data={data} mode={mode} />

            <div className="flex flex-col gap-4">
              <Filters filters={filters} teams={data.teams} onChange={setFilters} />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <OddsToggle mode={mode} onChange={setMode} />
                  <RotationPlanner data={data} mode={mode} />
                </div>
                <ExportButton data={data} mode={mode} matrixRef={matrixRef} />
              </div>
            </div>

            <HeatmapMatrix
              rows={displayRows}
              horizon={data.horizon}
              mode={mode}
              filters={filters}
              nextGwId={data.nextGameweek?.id ?? null}
              matrixRef={matrixRef}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Legend />
              {data.source === "mock" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="size-3.5" />
                  Demo dataset — live FPL feed not reachable from this environment.
                </span>
              )}
            </div>
          </div>
        )}

        <footer className="mt-16 flex flex-col items-center gap-2 border-t border-black/[0.07] pt-8 text-center text-xs text-muted-foreground">
          <p>
            Clean Sheet Sidekick · Probabilities are model estimates, not betting advice. Data
            sourced from the public FPL API.
          </p>
          <a
            href="https://github.com/tanishq286/clean-sheet-sidekick"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground/70 transition-colors hover:text-emerald-600"
          >
            <Github className="size-3.5" />
            View source
          </a>
        </footer>
      </main>
    </TooltipProvider>
  );
}
