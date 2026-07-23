"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Layers, Search, Sparkles, Users, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { computeRotationPlan, MAX_ROTATION_DEFENDERS } from "@/lib/rotation";
import { cn, formatPercent, formatPrice, probabilityColor } from "@/lib/utils";
import type { CleanSheetData, OddsMode } from "@/lib/types";

interface RotationPlannerProps {
  data: CleanSheetData;
  mode: OddsMode;
}

const SLOT_OPTIONS = [1, 2, 3];

export function RotationPlanner({ data, mode }: RotationPlannerProps) {
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [slots, setSlots] = React.useState(1);
  const [search, setSearch] = React.useState("");

  const selectedDefenders = React.useMemo(
    () => data.defenders.filter((d) => selectedIds.includes(d.id)),
    [data.defenders, selectedIds],
  );

  const visibleDefenders = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const pool = q
      ? data.defenders.filter(
          (d) => d.name.toLowerCase().includes(q) || d.teamShort.toLowerCase().includes(q),
        )
      : data.defenders;
    return pool.slice(0, 60);
  }, [data.defenders, search]);

  const plan = React.useMemo(
    () => computeRotationPlan(selectedDefenders, data, mode, Math.min(slots, Math.max(selectedDefenders.length, 1))),
    [selectedDefenders, data, mode, slots],
  );

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ROTATION_DEFENDERS) return prev;
      return [...prev, id];
    });
  };

  const atCapacity = selectedIds.length >= MAX_ROTATION_DEFENDERS;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="sm">
          <Users className="size-4" />
          Rotation Finder
        </Button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto w-full max-w-[1400px]">
        <DrawerHeader className="flex flex-row items-start justify-between">
          <div>
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600" />
              Defender Rotation Finder
            </DrawerTitle>
            <DrawerDescription>
              Pick up to {MAX_ROTATION_DEFENDERS} defenders and we&apos;ll plot the best ones to start each gameweek.
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close">
              <X className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="grid gap-5 overflow-y-auto px-5 pb-6 scrollbar-slim lg:grid-cols-[320px_1fr]">
          {/* Defender picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Squad ({selectedIds.length}/{MAX_ROTATION_DEFENDERS})
              </span>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search defenders…"
                className="h-9 w-full rounded-lg border border-black/10 bg-white/70 pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/70"
              />
            </div>

            <div className="max-h-[46vh] space-y-1 overflow-y-auto pr-1 scrollbar-slim">
              {visibleDefenders.map((def) => {
                const active = selectedIds.includes(def.id);
                const disabled = !active && atCapacity;
                return (
                  <button
                    key={def.id}
                    onClick={() => toggle(def.id)}
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "border-emerald-400/40 bg-emerald-500/15"
                        : "border-black/10 bg-white/50 hover:border-black/20 hover:bg-white/80",
                      disabled && "cursor-not-allowed opacity-40 hover:border-black/10 hover:bg-white/50",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-black/[0.05] text-[10px] font-bold text-muted-foreground">
                        {def.teamShort}
                      </span>
                      <span className="truncate font-medium text-foreground">{def.name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {formatPrice(def.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Starting slots
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-black/10 bg-white/60 p-1">
                  {SLOT_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlots(s)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                        slots === s
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Coverage {formatPercent(plan.coverage)}
                </Badge>
                <Badge>
                  {plan.totalExpectedCleanSheets.toFixed(2)} xCS / {data.horizon.length} GW
                </Badge>
              </div>
            </div>

            {selectedDefenders.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 text-center">
                <Users className="size-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Select defenders on the left to build your rotation.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-slim">
                {plan.gameweeks.map((gw) => (
                  <div
                    key={gw.gameweek}
                    className="w-[190px] shrink-0 rounded-xl border border-black/10 bg-white/50 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">GW{gw.gameweek}</span>
                      <span className="font-mono text-xs text-emerald-700">
                        {formatPercent(gw.expectedCleanSheets / Math.max(plan.slots, 1))}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {gw.picks.map((pick) => {
                        const c = probabilityColor(pick.prob);
                        return (
                          <div
                            key={pick.defenderId}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-opacity",
                              pick.starting ? "ring-1 ring-emerald-500/50" : "opacity-45",
                            )}
                            style={{ backgroundColor: pick.blank ? "rgba(6,44,32,0.04)" : c.bg }}
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              {pick.starting && (
                                <motion.span
                                  layout
                                  className="size-1.5 shrink-0 rounded-full bg-emerald-600"
                                />
                              )}
                              <span className="truncate font-medium text-black/80">{pick.name}</span>
                            </span>
                            <span className="shrink-0 font-mono text-black/70">
                              {pick.blank ? "—" : formatPercent(pick.prob)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
