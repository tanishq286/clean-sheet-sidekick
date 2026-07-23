"use client";

import { motion } from "framer-motion";
import { Cpu, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OddsMode } from "@/lib/types";

interface OddsToggleProps {
  mode: OddsMode;
  onChange: (mode: OddsMode) => void;
}

const OPTIONS: Array<{ value: OddsMode; label: string; icon: typeof Cpu }> = [
  { value: "model", label: "Model", icon: Cpu },
  { value: "market", label: "Market", icon: LineChart },
];

export function OddsToggle({ mode, onChange }: OddsToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Probability source"
      className="relative inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white/60 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "text-emerald-700" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="odds-toggle-pill"
                className="absolute inset-0 -z-10 rounded-md bg-emerald-500/20 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="size-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
