"use client";

import { formatPercent, probabilityColor } from "@/lib/utils";
import type { Team } from "@/lib/types";

interface TeamCardProps {
  team: Team;
  averageProb: number;
  rank: number;
}

export function TeamCard({ team, averageProb, rank }: TeamCardProps) {
  const color = probabilityColor(averageProb);
  return (
    <div className="sticky left-0 z-10 flex h-16 w-[188px] shrink-0 items-center gap-3 border-b border-black/[0.06] bg-white px-3">
      <span className="w-4 text-right font-mono text-xs text-muted-foreground/60">{rank}</span>
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold"
        style={{ backgroundColor: color.bg, color: color.text, boxShadow: `inset 0 0 0 1px ${color.border}` }}
      >
        {team.shortName}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">{team.name}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1 w-14 overflow-hidden rounded-full bg-black/[0.1]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(averageProb * 100)}%`,
                background: "linear-gradient(to right, #059669, #10b981)",
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatPercent(averageProb)}
          </span>
        </div>
      </div>
    </div>
  );
}
