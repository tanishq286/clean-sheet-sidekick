import type { TemplateMeta } from "./types";
import ComposableTemplate from "./composable/ComposableTemplate";
import { PRESETS } from "./composable/presets";
import ResumeTemplate from "./resume";
import EditorialTemplate from "./editorial";
import MinimalTemplate from "./minimal";
import DossierTemplate from "./dossier";
import ProfileTemplate from "./profile";
import ShowcaseTemplate from "./showcase";

/** The six original hand-written templates, unchanged. */
const HANDWRITTEN: TemplateMeta[] = [
  { id: "profile", name: "Profile", description: "LinkedIn-style: cover banner, large avatar, ventures grid, skills sidebar.", Component: ProfileTemplate },
  { id: "showcase", name: "Showcase", description: "Cinematic dark hero with full-bleed cover, portrait, and venture gallery.", Component: ShowcaseTemplate },
  { id: "resume", name: "Resume", description: "Bold display type, orange accents — the classic founder one-pager.", Component: ResumeTemplate },
  { id: "editorial", name: "Editorial", description: "Dark, magazine-style with large headlines and serif quotes.", Component: EditorialTemplate },
  { id: "minimal", name: "Minimal", description: "Calm, single-column, lots of whitespace.", Component: MinimalTemplate },
  { id: "dossier", name: "Dossier", description: "Dense, structured investor brief layout.", Component: DossierTemplate },
];

/**
 * Spec-driven presets, rendered by one component. Adding a design is an entry
 * in presets.ts — no new file, and no new place for the profile schema to
 * drift out of sync.
 */
const COMPOSABLE: TemplateMeta[] = PRESETS.map((spec) => ({
  id: spec.id,
  name: spec.name,
  description: spec.description,
  family: spec.family,
  Component: (props) => <ComposableTemplate {...props} spec={spec} />,
}));

export const TEMPLATES: TemplateMeta[] = [...HANDWRITTEN, ...COMPOSABLE];

// Ids address templates in the database, so a collision would silently swap a
// published profile's design. Fail loudly at module load instead.
const seen = new Set<string>();
for (const t of TEMPLATES) {
  if (seen.has(t.id)) throw new Error(`Duplicate template id: ${t.id}`);
  seen.add(t.id);
}

/** Picker groupings, derived rather than maintained by hand. */
export const TEMPLATE_FAMILIES = [...new Set(TEMPLATES.map((t) => t.family ?? "Signature"))];

export function getTemplate(id: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}