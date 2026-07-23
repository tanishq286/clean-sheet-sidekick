"use client";

import { probabilityColor } from "@/lib/utils";

const STOPS = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85];

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="font-medium">Clean-sheet probability</span>
      <div className="flex items-center gap-1">
        <span>Low</span>
        <div className="flex overflow-hidden rounded-md">
          {STOPS.map((p) => {
            const c = probabilityColor(p);
            return <span key={p} className="h-3.5 w-6" style={{ backgroundColor: c.bg, boxShadow: `inset 0 0 0 1px ${c.border}` }} />;
          })}
        </div>
        <span>High</span>
      </div>
      <span className="hidden items-center gap-1.5 sm:inline-flex">
        <span className="grid size-4 place-items-center rounded bg-white/5 text-[8px] text-muted-foreground/50">B</span>
        Blank gameweek
      </span>
    </div>
  );
}
