import { PRESETS } from "./composable/presets";

/**
 * Template metadata with no React in it.
 *
 * `registry.tsx` pairs these entries with their components, and the build-time
 * llms.txt generator imports this module directly — it cannot import the
 * registry, which pulls in React. Keeping the list here means the two can't
 * disagree: the site description previously hardcoded six template names and
 * kept claiming six after thirty more shipped.
 */
export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  family: string;
}

/** The six original hand-written templates. */
export const HANDWRITTEN_INFO: TemplateInfo[] = [
  { id: "profile", name: "Profile", description: "LinkedIn-style: cover banner, large avatar, ventures grid, skills sidebar.", family: "Signature" },
  { id: "showcase", name: "Showcase", description: "Cinematic dark hero with full-bleed cover, portrait, and venture gallery.", family: "Signature" },
  { id: "resume", name: "Resume", description: "Bold display type, orange accents — the classic founder one-pager.", family: "Signature" },
  { id: "editorial", name: "Editorial", description: "Dark, magazine-style with large headlines and serif quotes.", family: "Signature" },
  { id: "minimal", name: "Minimal", description: "Calm, single-column, lots of whitespace.", family: "Signature" },
  { id: "dossier", name: "Dossier", description: "Dense, structured investor brief layout.", family: "Signature" },
];

export const TEMPLATE_CATALOG: TemplateInfo[] = [
  ...HANDWRITTEN_INFO,
  ...PRESETS.map(({ id, name, description, family }) => ({ id, name, description, family })),
];

export const TEMPLATE_FAMILY_LIST = [...new Set(TEMPLATE_CATALOG.map((t) => t.family))];
