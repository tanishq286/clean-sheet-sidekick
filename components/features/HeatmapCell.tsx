"use client";

import { motion } from "framer-motion";
import { Home, Plane } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPercent, probabilityColor } from "@/lib/utils";
import type { CleanSheetCell, OddsMode } from "@/lib/types";

interface HeatmapCellProps {
  cell: CleanSheetCell;
  mode: OddsMode;
  teamName: string;
  muted: boolean;
  delay: number;
}

function formatKickoff(iso: string | null): string {
  if (!iso) return "TBC";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HeatmapCell({ cell, mode, teamName, muted, delay }: HeatmapCellProps) {
  if (cell.blank) {
    return (
      <div className="flex h-16 w-[88px] shrink-0 items-center justify-center border-b border-l border-white/5">
        <span className="text-xs text-muted-foreground/40">BLANK</span>
      </div>
    );
  }

  const prob = mode === "market" ? cell.marketProb : cell.modelProb;
  const color = probabilityColor(prob);
  const VenueIcon = cell.isHome ? Home : Plane;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: muted ? 0.22 : 1, scale: 1 }}
          transition={{ duration: 0.25, delay }}
          whileHover={muted ? undefined : { scale: 1.06, zIndex: 5 }}
          className="group relative flex h-16 w-[88px] shrink-0 cursor-default flex-col items-center justify-center gap-0.5 border-b border-l border-white/5"
          style={{
            backgroundColor: color.bg,
            boxShadow: muted ? undefined : `inset 0 0 0 1px ${color.border}, 0 0 18px -6px ${color.glow}`,
          }}
        >
          <span
            className="text-base font-bold leading-none tabular-nums"
            style={{ color: color.text }}
          >
            {formatPercent(prob)}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-white/70">
            <VenueIcon className="size-2.5" />
            {cell.opponentShort}
          </span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            {teamName} {cell.isHome ? "vs" : "@"} {cell.opponentShort}
          </p>
          <p className="text-muted-foreground">{formatKickoff(cell.kickoff)}</p>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-muted-foreground">Model</span>
            <span className="text-right font-medium text-emerald-300">
              {formatPercent(cell.modelProb, 1)}
            </span>
            <span className="text-muted-foreground">Market</span>
            <span className="text-right font-medium text-emerald-300">
              {formatPercent(cell.marketProb, 1)}
            </span>
            <span className="text-muted-foreground">FDR</span>
            <span className="text-right font-medium text-foreground">{cell.fdr}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
