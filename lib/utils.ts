import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Deterministic mulberry32 PRNG so mock data is stable across renders. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatPrice(value: number): string {
  return `£${value.toFixed(1)}m`;
}

/* ------------------------------------------------------------------ */
/* Colour scale for the heatmap                                       */
/* ------------------------------------------------------------------ */

export interface CellColor {
  bg: string;
  border: string;
  glow: string;
  text: string;
}

type Rgb = readonly [number, number, number];

const LOW: Rgb = [244, 63, 94]; // rose-500  — low clean-sheet chance
const MID: Rgb = [245, 158, 11]; // amber-500 — coin flip
const HIGH: Rgb = [16, 185, 129]; // emerald-500 — strong clean-sheet chance

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function mix(from: Rgb, to: Rgb, t: number): Rgb {
  return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
}

// Real clean-sheet probabilities cluster in a narrow band, so we normalise
// against the range they actually occupy before colouring. This lets the full
// rose → amber → emerald gradient breathe instead of everything reading amber.
const PROB_FLOOR = 0.08;
const PROB_CEIL = 0.58;

/** Map a 0..1 probability onto the rose → amber → emerald gradient. */
export function probabilityColor(prob: number): CellColor {
  const raw = clamp(prob, 0, 1);
  const t = clamp((raw - PROB_FLOOR) / (PROB_CEIL - PROB_FLOOR), 0, 1);
  const [r, g, b] = t < 0.5 ? mix(LOW, MID, t / 0.5) : mix(MID, HIGH, (t - 0.5) / 0.5);
  // Stronger fixtures get a more saturated / vivid fill.
  const alpha = 0.22 + t * 0.55;
  return {
    bg: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`,
    border: `rgba(${r}, ${g}, ${b}, ${(0.32 + t * 0.45).toFixed(3)})`,
    glow: `rgba(${r}, ${g}, ${b}, ${(t * 0.55).toFixed(3)})`,
    // Dark ink reads cleanly on the light, pastel-tinted fills.
    text: "#08281c",
  };
}

const FDR_COLORS: Record<number, string> = {
  1: "#10b981",
  2: "#22c55e",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
};

export function fdrColor(fdr: number): string {
  return FDR_COLORS[clamp(Math.round(fdr), 1, 5)] ?? FDR_COLORS[3];
}

/* ------------------------------------------------------------------ */
/* Countdown                                                          */
/* ------------------------------------------------------------------ */

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

export function getCountdown(targetIso: string, from: number = Date.now()): Countdown {
  const totalMs = new Date(targetIso).getTime() - from;
  const clamped = Math.max(totalMs, 0);
  const days = Math.floor(clamped / 86_400_000);
  const hours = Math.floor((clamped % 86_400_000) / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  return { days, hours, minutes, seconds, totalMs, expired: totalMs <= 0 };
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
