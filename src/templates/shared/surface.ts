/**
 * Surface variants shared by the interactive sections.
 *
 * `vivid` is the default: soft radii, translucent fills, an accent glow — it
 * suits the expressive templates (showcase, profile, and most presets).
 *
 * `document` strips all of that. Dossier, resume and the other document-style
 * layouts are deliberately dry: square corners, hard rules, monospace labels.
 * Dropping a glowing rounded card into one reads as a bug rather than a
 * flourish, so the interaction stays identical and only the skin changes.
 */
export type SurfaceVariant = "vivid" | "document";

export interface SurfaceTokens {
  /** Wrapper around each milestone row / portfolio card. */
  card: string;
  /** Inner radius for the clickable region, matched to `card`. */
  radius: string;
  /** Small metadata pill (Latest, Details, category). */
  badge: string;
  /** Year / category chip that carries the accent colour. */
  chip: string;
  /** Filter pill in the portfolio. */
  pill: string;
  /** Whether to paint the decorative accent wash. */
  glow: boolean;
  /** Timeline rail fill. */
  rail: string;
  /** Uppercase micro-label treatment. */
  label: string;
}

export const SURFACE: Record<SurfaceVariant, SurfaceTokens> = {
  vivid: {
    card: "rounded-xl border border-current/15 bg-current/[0.04] backdrop-blur-sm",
    radius: "rounded-xl",
    badge: "rounded-full border border-current/20 px-2 py-0.5 text-[11px] font-medium opacity-60",
    chip: "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
    pill: "rounded-full border border-current/20 px-3.5 py-1.5 text-sm",
    glow: true,
    rail: "linear-gradient(to bottom, var(--accent), transparent)",
    label: "",
  },
  document: {
    card: "border border-current/25 bg-current/[0.02]",
    radius: "",
    badge:
      "border border-current/25 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] opacity-70",
    chip: "border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] tabular-nums",
    pill: "border border-current/25 px-3 py-1 text-[11px] uppercase tracking-[0.12em]",
    glow: false,
    rail: "var(--accent)",
    label: "uppercase tracking-[0.15em]",
  },
};
