"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PresetBar } from "@/components/features/PresetBar";
import { cn, formatPrice } from "@/lib/utils";
import type { HeatmapFilters, Team, Venue } from "@/lib/types";

export const PRICE_MIN = 3.5;
export const PRICE_MAX = 8.0;

export const DEFAULT_FILTERS: HeatmapFilters = {
  teamIds: [],
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  venue: "all",
  maxFdr: 5,
};

interface FiltersProps {
  filters: HeatmapFilters;
  teams: Team[];
  onChange: (next: HeatmapFilters) => void;
}

export function Filters({ filters, teams, onChange }: FiltersProps) {
  const toggleTeam = (id: number) => {
    const set = new Set(filters.teamIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...filters, teamIds: [...set] });
  };

  const isDirty =
    filters.teamIds.length > 0 ||
    filters.venue !== "all" ||
    filters.maxFdr !== 5 ||
    filters.minPrice !== PRICE_MIN ||
    filters.maxPrice !== PRICE_MAX;

  return (
    <div className="space-y-4 rounded-xl glass-panel p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
        <div className="space-y-2">
          <Label>Venue</Label>
          <Select value={filters.venue} onValueChange={(v) => onChange({ ...filters, venue: v as Venue })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Home &amp; Away</SelectItem>
              <SelectItem value="home">Home only</SelectItem>
              <SelectItem value="away">Away only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Max FDR</Label>
            <span className="font-mono text-xs text-emerald-700">{filters.maxFdr}</span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[filters.maxFdr]}
            onValueChange={([v]) => onChange({ ...filters, maxFdr: v })}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Defender price</Label>
            <span className="font-mono text-xs text-emerald-700">
              {formatPrice(filters.minPrice)} – {formatPrice(filters.maxPrice)}
            </span>
          </div>
          <Slider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={0.1}
            minStepsBetweenThumbs={1}
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={([min, max]) => onChange({ ...filters, minPrice: min, maxPrice: max })}
            className="py-2"
          />
        </div>

        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_FILTERS)}
            disabled={!isDirty}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Teams {filters.teamIds.length > 0 && `(${filters.teamIds.length})`}</Label>
        <div className="flex flex-wrap gap-1.5">
          {teams.map((team) => {
            const active = filters.teamIds.includes(team.id);
            return (
              <button
                key={team.id}
                onClick={() => toggleTeam(team.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-700"
                    : "border-black/10 bg-white/60 text-muted-foreground hover:border-black/20 hover:text-foreground",
                )}
              >
                {team.shortName}
              </button>
            );
          })}
        </div>
      </div>

      <PresetBar<HeatmapFilters>
        kind="filters"
        label="Saved filters"
        canSave
        getPayload={() => filters}
        onLoad={(payload) => onChange(payload)}
        className="border-t border-black/[0.07] pt-3"
      />
    </div>
  );
}
