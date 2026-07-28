import type { SurfaceVariant } from "../shared/surface";

/**
 * A declarative description of a template.
 *
 * The six original templates are hand-written React files. That does not scale
 * past a handful — every new look means another file to write, review and keep
 * in sync when the profile schema changes. A spec is data: one renderer reads
 * it, so a new design is a config object, and a schema change is fixed once.
 *
 * Existing templates are deliberately untouched. This runs alongside them and
 * both kinds land in the same registry.
 */

export type LayoutId =
  | "stack" // single column, everything centred
  | "sidebar" // fixed identity rail + scrolling content
  | "split" // 50/50 hero, then full-width sections
  | "magazine" // oversized display heading, two-column body
  | "grid" // dense card grid, everything boxed
  | "banner"; // wide cover strip, overlapping avatar, then sections

export type TypeScale = "compact" | "regular" | "display";

export interface Palette {
  /** Page background. */
  bg: string;
  /** Primary text. */
  fg: string;
  /** Panel/card background — may be transparent. */
  surface: string;
  /** Rule and border colour. */
  border: string;
  /** Muted text, used for descriptions and labels. */
  muted: string;
}

export interface TemplateSpec {
  id: string;
  name: string;
  description: string;
  layout: LayoutId;
  palette: Palette;
  /** CSS font-family stack for headings. */
  headingFont: string;
  /** CSS font-family stack for body copy. */
  bodyFont: string;
  scale: TypeScale;
  /** Uppercase + letterspacing on section labels. */
  eyebrow: boolean;
  /** Corner radius applied to cards and media, in px. 0 = hard edges. */
  radius: number;
  /** Surface treatment handed to the interactive sections. */
  surface: SurfaceVariant;
  /** Render the accent as a full-bleed wash behind the hero. */
  heroWash: boolean;
  /** Show the accent-coloured rule under section headings. */
  sectionRule: boolean;
  /** Grayscale the profile photo — a strong stylistic signal. */
  monoPhoto?: boolean;
  /** Coarse grouping for the picker UI. */
  family: "Light" | "Dark" | "Editorial" | "Technical" | "Expressive";
}

/** Type ramp per scale, so presets never hand-tune every heading. */
export const TYPE_RAMP: Record<TypeScale, { name: string; section: string; body: string; eyebrow: string }> = {
  compact: {
    name: "text-3xl md:text-4xl",
    section: "text-lg md:text-xl",
    body: "text-[13px] md:text-sm",
    eyebrow: "text-[10px]",
  },
  regular: {
    name: "text-4xl md:text-5xl",
    section: "text-xl md:text-2xl",
    body: "text-sm md:text-base",
    eyebrow: "text-[11px]",
  },
  display: {
    name: "text-5xl md:text-7xl",
    section: "text-2xl md:text-4xl",
    body: "text-base md:text-lg",
    eyebrow: "text-xs",
  },
};

/**
 * Font stacks. Every family here is either already loaded by the app
 * (Rubik via index.html, the @fontsource packages in package.json) or a system
 * font — nothing new is fetched, so adding presets costs no extra requests.
 */
export const FONTS = {
  rubik: "'Rubik', system-ui, sans-serif",
  system: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
  serif: "'Instrument Serif', 'Iowan Old Style', Georgia, serif",
  fraunces: "'Fraunces', Georgia, serif",
  archivo: "'Archivo Black', system-ui, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
} as const;

/** Common palettes, so presets stay one-liners. */
export const PALETTES = {
  paper: { bg: "#ffffff", fg: "#111111", surface: "#fafafa", border: "#e5e5e5", muted: "#6b7280" },
  bone: { bg: "#f6f4ef", fg: "#1c1917", surface: "#fffdf8", border: "#ddd8cc", muted: "#78716c" },
  slate: { bg: "#f8fafc", fg: "#0f172a", surface: "#ffffff", border: "#e2e8f0", muted: "#64748b" },
  ink: { bg: "#0b0b0d", fg: "#f5f5f5", surface: "#141418", border: "#26262c", muted: "#a1a1aa" },
  midnight: { bg: "#0a0f1e", fg: "#e6edf7", surface: "#111a2e", border: "#1e2a44", muted: "#94a3b8" },
  forest: { bg: "#0c1512", fg: "#e7f0ec", surface: "#12201b", border: "#1e3329", muted: "#93a99f" },
  plum: { bg: "#140d1a", fg: "#f2e9f7", surface: "#1e1327", border: "#301d3d", muted: "#a894b4" },
  sand: { bg: "#efe9df", fg: "#2b2118", surface: "#f8f4ec", border: "#d8cec0", muted: "#7c6f60" },
  mist: { bg: "#eef2f5", fg: "#16232b", surface: "#ffffff", border: "#d5dde3", muted: "#5f7381" },
  carbon: { bg: "#131313", fg: "#ededed", surface: "#1c1c1c", border: "#2e2e2e", muted: "#9a9a9a" },
} as const satisfies Record<string, Palette>;
