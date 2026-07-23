"use client";

import * as React from "react";
import { SearchX } from "lucide-react";
import { HeatmapCell } from "@/components/features/HeatmapCell";
import { TeamCard } from "@/components/features/TeamCard";
import { cn } from "@/lib/utils";
import type { CleanSheetCell, HeatmapFilters, OddsMode, TeamCleanSheetRow } from "@/lib/types";

interface HeatmapMatrixProps {
  rows: TeamCleanSheetRow[];
  horizon: number[];
  mode: OddsMode;
  filters: HeatmapFilters;
  nextGwId: number | null;
  matrixRef: React.RefObject<HTMLDivElement | null>;
}

function isMuted(cell: CleanSheetCell, filters: HeatmapFilters): boolean {
  if (cell.blank) return false;
  if (filters.venue === "home" && !cell.isHome) return true;
  if (filters.venue === "away" && cell.isHome) return true;
  if (cell.fdr > filters.maxFdr) return true;
  return false;
}

export function HeatmapMatrix({ rows, horizon, mode, filters, nextGwId, matrixRef }: HeatmapMatrixProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] py-20 text-center">
        <SearchX className="size-8 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-foreground">No teams match your filters</p>
          <p className="text-sm text-muted-foreground">Try widening the price range or clearing team filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-xl border border-white/10 scrollbar-slim max-h-[74vh]">
      <div ref={matrixRef} className="min-w-max bg-[#0a0f0d]">
        {/* Header row */}
        <div className="sticky top-0 z-20 flex border-b border-white/10 bg-[#0c130f]/95 backdrop-blur">
          <div className="sticky left-0 z-30 flex h-11 w-[168px] shrink-0 items-center bg-[#0c130f] px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Team / GW
          </div>
          {horizon.map((gw) => {
            const isNext = gw === nextGwId;
            return (
              <div
                key={gw}
                className={cn(
                  "flex h-11 w-[88px] shrink-0 flex-col items-center justify-center border-l border-white/5 text-xs font-semibold",
                  isNext ? "bg-emerald-500/10 text-emerald-300" : "text-muted-foreground",
                )}
              >
                <span>GW{gw}</span>
                {isNext && <span className="text-[8px] font-bold uppercase tracking-wider">Next</span>}
              </div>
            );
          })}
        </div>

        {/* Team rows */}
        {rows.map((row, rowIndex) => (
          <div key={row.team.id} className="flex">
            <TeamCard team={row.team} averageProb={row.averageProb} rank={rowIndex + 1} />
            {row.cells.map((cell, colIndex) => (
              <HeatmapCell
                key={`${row.team.id}-${cell.gameweek}`}
                cell={cell}
                mode={mode}
                teamName={row.team.name}
                muted={isMuted(cell, filters)}
                delay={Math.min((rowIndex + colIndex) * 0.01, 0.4)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
