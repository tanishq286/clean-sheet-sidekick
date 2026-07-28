import { FONTS, PALETTES, type TemplateSpec } from "./spec";

/**
 * The 30 additional designs.
 *
 * Each is a config object, not a component. Adding a 31st is one entry here;
 * a change to the profile schema is one edit in ComposableTemplate rather than
 * thirty. The six hand-written originals are untouched and still registered
 * separately.
 *
 * `surface: "document"` is chosen for the dry layouts (mono/serif, hard edges)
 * so the interactive milestone and portfolio sections match rather than
 * dropping a glowing rounded card into a print-style page.
 */
export const PRESETS: TemplateSpec[] = [
  {
    id: "atlas", name: "Atlas", description: "Airy single column on paper white with a soft accent wash.",
    layout: "stack", palette: PALETTES.paper, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "regular", eyebrow: true, radius: 12, surface: "vivid", heroWash: true, sectionRule: false, family: "Light",
  },
  {
    id: "obsidian", name: "Obsidian", description: "Deep black canvas, oversized display type, glowing hero.",
    layout: "stack", palette: PALETTES.ink, headingFont: FONTS.archivo, bodyFont: FONTS.system,
    scale: "display", eyebrow: true, radius: 16, surface: "vivid", heroWash: true, sectionRule: false, family: "Dark",
  },
  {
    id: "ledger", name: "Ledger", description: "Monospace investor brief with hard rules and no ornament.",
    layout: "sidebar", palette: PALETTES.bone, headingFont: FONTS.mono, bodyFont: FONTS.mono,
    scale: "compact", eyebrow: true, radius: 0, surface: "document", heroWash: false, sectionRule: true,
    monoPhoto: true, family: "Technical",
  },
  {
    id: "quill", name: "Quill", description: "Serif editorial in two columns, generous measure.",
    layout: "magazine", palette: PALETTES.bone, headingFont: FONTS.fraunces, bodyFont: FONTS.georgia,
    scale: "display", eyebrow: false, radius: 4, surface: "document", heroWash: false, sectionRule: true, family: "Editorial",
  },
  {
    id: "beacon", name: "Beacon", description: "Split hero pairing portrait and cover, then a clean read.",
    layout: "split", palette: PALETTES.slate, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "regular", eyebrow: true, radius: 14, surface: "vivid", heroWash: false, sectionRule: false, family: "Light",
  },
  {
    id: "vault", name: "Vault", description: "Boxed grid where every block is a bordered panel.",
    layout: "grid", palette: PALETTES.mist, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "compact", eyebrow: true, radius: 8, surface: "vivid", heroWash: false, sectionRule: false, family: "Light",
  },
  {
    id: "nocturne", name: "Nocturne", description: "Midnight blue with a luminous accent and sidebar rail.",
    layout: "sidebar", palette: PALETTES.midnight, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "regular", eyebrow: true, radius: 14, surface: "vivid", heroWash: true, sectionRule: false, family: "Dark",
  },
  {
    id: "canopy", name: "Canopy", description: "Deep forest green, calm spacing, understated rules.",
    layout: "stack", palette: PALETTES.forest, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "regular", eyebrow: false, radius: 12, surface: "vivid", heroWash: true, sectionRule: true, family: "Dark",
  },
  {
    id: "orchid", name: "Orchid", description: "Plum-dark and expressive, display headings, soft glow.",
    layout: "stack", palette: PALETTES.plum, headingFont: FONTS.fraunces, bodyFont: FONTS.system,
    scale: "display", eyebrow: false, radius: 18, surface: "vivid", heroWash: true, sectionRule: false, family: "Expressive",
  },
  {
    id: "kraft", name: "Kraft", description: "Warm sand paper stock with serif headings.",
    layout: "stack", palette: PALETTES.sand, headingFont: FONTS.serif, bodyFont: FONTS.georgia,
    scale: "regular", eyebrow: false, radius: 6, surface: "document", heroWash: false, sectionRule: true, family: "Editorial",
  },
  {
    id: "terminal", name: "Terminal", description: "Carbon background, monospace throughout, zero radius.",
    layout: "stack", palette: PALETTES.carbon, headingFont: FONTS.mono, bodyFont: FONTS.mono,
    scale: "compact", eyebrow: true, radius: 0, surface: "document", heroWash: false, sectionRule: true,
    monoPhoto: true, family: "Technical",
  },
  {
    id: "gazette", name: "Gazette", description: "Newspaper columns, tight leading, rules under every head.",
    layout: "magazine", palette: PALETTES.paper, headingFont: FONTS.georgia, bodyFont: FONTS.georgia,
    scale: "regular", eyebrow: true, radius: 0, surface: "document", heroWash: false, sectionRule: true, family: "Editorial",
  },
  {
    id: "horizon", name: "Horizon", description: "Wide cover banner with an overlapping portrait.",
    layout: "banner", palette: PALETTES.slate, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "regular", eyebrow: true, radius: 16, surface: "vivid", heroWash: false, sectionRule: false, family: "Light",
  },
  {
    id: "eclipse", name: "Eclipse", description: "Banner-led dark layout with a heavy display face.",
    layout: "banner", palette: PALETTES.ink, headingFont: FONTS.archivo, bodyFont: FONTS.system,
    scale: "display", eyebrow: true, radius: 0, surface: "vivid", heroWash: false, sectionRule: false, family: "Dark",
  },
  {
    id: "linen", name: "Linen", description: "Bone-white minimalism, no eyebrows, quiet type.",
    layout: "stack", palette: PALETTES.bone, headingFont: FONTS.system, bodyFont: FONTS.system,
    scale: "compact", eyebrow: false, radius: 10, surface: "vivid", heroWash: false, sectionRule: false, family: "Light",
  },
  {
    id: "blueprint", name: "Blueprint", description: "Technical sidebar, mono labels, grayscale portrait.",
    layout: "sidebar", palette: PALETTES.mist, headingFont: FONTS.mono, bodyFont: FONTS.system,
    scale: "compact", eyebrow: true, radius: 2, surface: "document", heroWash: false, sectionRule: true,
    monoPhoto: true, family: "Technical",
  },
  {
    id: "aurora", name: "Aurora", description: "Midnight split hero with a broad accent gradient.",
    layout: "split", palette: PALETTES.midnight, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "display", eyebrow: false, radius: 20, surface: "vivid", heroWash: true, sectionRule: false, family: "Expressive",
  },
  {
    id: "monolith", name: "Monolith", description: "One black column, enormous name, nothing else.",
    layout: "stack", palette: PALETTES.carbon, headingFont: FONTS.archivo, bodyFont: FONTS.system,
    scale: "display", eyebrow: false, radius: 0, surface: "document", heroWash: false, sectionRule: false, family: "Dark",
  },
  {
    id: "folio", name: "Folio", description: "Portfolio-first grid with panelled sections.",
    layout: "grid", palette: PALETTES.paper, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "regular", eyebrow: true, radius: 14, surface: "vivid", heroWash: false, sectionRule: false, family: "Light",
  },
  {
    id: "archive", name: "Archive", description: "Sand-toned records layout, mono labels, hard edges.",
    layout: "grid", palette: PALETTES.sand, headingFont: FONTS.mono, bodyFont: FONTS.system,
    scale: "compact", eyebrow: true, radius: 0, surface: "document", heroWash: false, sectionRule: true,
    monoPhoto: true, family: "Technical",
  },
  {
    id: "prism", name: "Prism", description: "Bright split with rounded media and a bold accent.",
    layout: "split", palette: PALETTES.paper, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "display", eyebrow: true, radius: 24, surface: "vivid", heroWash: true, sectionRule: false, family: "Expressive",
  },
  {
    id: "meridian", name: "Meridian", description: "Sidebar rail on slate with serif headings.",
    layout: "sidebar", palette: PALETTES.slate, headingFont: FONTS.fraunces, bodyFont: FONTS.system,
    scale: "regular", eyebrow: false, radius: 10, surface: "vivid", heroWash: false, sectionRule: true, family: "Editorial",
  },
  {
    id: "cinder", name: "Cinder", description: "Carbon sidebar, compact type, mono headings.",
    layout: "sidebar", palette: PALETTES.carbon, headingFont: FONTS.mono, bodyFont: FONTS.system,
    scale: "compact", eyebrow: true, radius: 4, surface: "document", heroWash: false, sectionRule: true, family: "Technical",
  },
  {
    id: "almanac", name: "Almanac", description: "Two-column serif read on warm stock.",
    layout: "magazine", palette: PALETTES.sand, headingFont: FONTS.fraunces, bodyFont: FONTS.georgia,
    scale: "regular", eyebrow: false, radius: 4, surface: "document", heroWash: false, sectionRule: true, family: "Editorial",
  },
  {
    id: "signal", name: "Signal", description: "Mist grid with crisp panels and mono eyebrows.",
    layout: "grid", palette: PALETTES.mist, headingFont: FONTS.rubik, bodyFont: FONTS.mono,
    scale: "compact", eyebrow: true, radius: 6, surface: "document", heroWash: false, sectionRule: false, family: "Technical",
  },
  {
    id: "velvet", name: "Velvet", description: "Plum banner with a soft overlap and serif display.",
    layout: "banner", palette: PALETTES.plum, headingFont: FONTS.serif, bodyFont: FONTS.system,
    scale: "display", eyebrow: false, radius: 20, surface: "vivid", heroWash: false, sectionRule: false, family: "Expressive",
  },
  {
    id: "grove", name: "Grove", description: "Forest split, calm serif headings, wide measure.",
    layout: "split", palette: PALETTES.forest, headingFont: FONTS.fraunces, bodyFont: FONTS.system,
    scale: "regular", eyebrow: false, radius: 14, surface: "vivid", heroWash: true, sectionRule: false, family: "Dark",
  },
  {
    id: "bulletin", name: "Bulletin", description: "Paper-white banner layout with mono section labels.",
    layout: "banner", palette: PALETTES.paper, headingFont: FONTS.rubik, bodyFont: FONTS.mono,
    scale: "compact", eyebrow: true, radius: 8, surface: "document", heroWash: false, sectionRule: true, family: "Light",
  },
  {
    id: "lumen", name: "Lumen", description: "Bone magazine spread with a luminous accent rule.",
    layout: "magazine", palette: PALETTES.bone, headingFont: FONTS.archivo, bodyFont: FONTS.system,
    scale: "display", eyebrow: true, radius: 12, surface: "vivid", heroWash: true, sectionRule: true, family: "Expressive",
  },
  {
    id: "cobalt", name: "Cobalt", description: "Midnight grid of bordered panels, compact and dense.",
    layout: "grid", palette: PALETTES.midnight, headingFont: FONTS.rubik, bodyFont: FONTS.system,
    scale: "compact", eyebrow: true, radius: 10, surface: "vivid", heroWash: false, sectionRule: false, family: "Dark",
  },
];
