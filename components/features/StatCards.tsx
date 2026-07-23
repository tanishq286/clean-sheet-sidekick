"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarDays, Coins, Crown, Target } from "lucide-react";
import { formatPercent, formatPrice, probabilityColor } from "@/lib/utils";
import type { CleanSheetData, OddsMode } from "@/lib/types";

interface StatCardsProps {
  data: CleanSheetData;
  mode: OddsMode;
}

interface Stat {
  icon: typeof Target;
  label: string;
  value: string;
  sub: string;
  accent: string;
}

export function StatCards({ data, mode }: StatCardsProps) {
  const stats = React.useMemo<Stat[]>(() => {
    const nextGw = data.nextGameweek?.id ?? data.horizon[0];
    const nextIdx = Math.max(data.horizon.indexOf(nextGw), 0);

    // Best single fixture in the next gameweek.
    let bestTeam = "—";
    let bestProb = 0;
    for (const row of data.rows) {
      const cell = row.cells[nextIdx];
      if (!cell || cell.blank) continue;
      const p = mode === "market" ? cell.marketProb : cell.modelProb;
      if (p > bestProb) {
        bestProb = p;
        bestTeam = `${row.team.shortName} ${cell.isHome ? "v" : "@"} ${cell.opponentShort}`;
      }
    }

    // Strongest team across the whole horizon (rows are pre-sorted).
    const top = data.rows[0];

    // Best value defender: highest team average per £m.
    const avgByTeam = new Map<number, number>(data.rows.map((r) => [r.team.id, r.averageProb]));
    let valueName = "—";
    let valueScore = -1;
    let valuePrice = 0;
    let valueTeam = "";
    for (const def of data.defenders) {
      const avg = avgByTeam.get(def.teamId) ?? 0;
      const score = avg / def.price;
      if (score > valueScore) {
        valueScore = score;
        valueName = def.name;
        valuePrice = def.price;
        valueTeam = def.teamShort;
      }
    }

    const fixturesTracked = data.rows.reduce(
      (sum, r) => sum + r.cells.filter((c) => !c.blank).length,
      0,
    );

    return [
      {
        icon: Target,
        label: `Top pick · GW${nextGw}`,
        value: formatPercent(bestProb),
        sub: bestTeam,
        accent: probabilityColor(bestProb).bg,
      },
      {
        icon: Crown,
        label: `Best over ${data.horizon.length} GWs`,
        value: top ? formatPercent(top.averageProb) : "—",
        sub: top ? top.team.name : "No data",
        accent: probabilityColor(top?.averageProb ?? 0).bg,
      },
      {
        icon: Coins,
        label: "Best value defender",
        value: valuePrice ? formatPrice(valuePrice) : "—",
        sub: valueName === "—" ? "No data" : `${valueName} · ${valueTeam}`,
        accent: "rgba(16,185,129,0.16)",
      },
      {
        icon: CalendarDays,
        label: "Fixtures tracked",
        value: String(fixturesTracked),
        sub: `${data.rows.length} teams · ${data.horizon.length} gameweeks`,
        accent: "rgba(255,255,255,0.05)",
      },
    ];
  }, [data, mode]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="glass-panel relative overflow-hidden rounded-xl p-4"
          >
            <div
              className="absolute -right-6 -top-6 size-20 rounded-full blur-2xl"
              style={{ backgroundColor: stat.accent }}
            />
            <div className="relative flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4 text-emerald-400" />
              <span className="text-[11px] font-medium uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="relative mt-2 text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
            <p className="relative mt-0.5 truncate text-xs text-muted-foreground">{stat.sub}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
