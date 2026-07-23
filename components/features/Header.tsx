"use client";

import { RefreshCw, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { CountdownTimer } from "@/components/features/CountdownTimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataSource, Gameweek } from "@/lib/types";

interface HeaderProps {
  nextGameweek: Gameweek | null;
  source: DataSource | null;
  isFetching: boolean;
  onRefresh: () => void;
}

export function Header({ nextGameweek, source, isFetching, onRefresh }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f0d]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_-2px_rgba(16,185,129,0.7)]">
            <ShieldCheck className="size-5 text-emerald-950" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">
              Clean Sheet <span className="text-emerald-400">Sidekick</span>
            </p>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              FPL defensive fixture intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {nextGameweek && (
            <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 md:flex">
              <div className="text-right leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {nextGameweek.name} deadline
                </p>
              </div>
              <CountdownTimer deadline={nextGameweek.deadline} onExpire={onRefresh} />
            </div>
          )}

          {source && (
            <Badge
              variant={source === "live" ? "default" : "secondary"}
              className="hidden sm:inline-flex"
            >
              {source === "live" ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              {source === "live" ? "Live FPL" : "Demo data"}
            </Badge>
          )}

          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Refresh data"
            title="Refresh data"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>
    </header>
  );
}
