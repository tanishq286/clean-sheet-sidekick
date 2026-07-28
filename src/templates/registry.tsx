import type { TemplateMeta, TemplateProps } from "./types";
import { HANDWRITTEN_INFO } from "./catalog";
import ComposableTemplate from "./composable/ComposableTemplate";
import { PRESETS } from "./composable/presets";
import ResumeTemplate from "./resume";
import EditorialTemplate from "./editorial";
import MinimalTemplate from "./minimal";
import DossierTemplate from "./dossier";
import ProfileTemplate from "./profile";
import ShowcaseTemplate from "./showcase";

/** The six original hand-written templates, paired with their catalog entry. */
const HANDWRITTEN_COMPONENTS: Record<string, React.ComponentType<TemplateProps>> = {
  profile: ProfileTemplate,
  showcase: ShowcaseTemplate,
  resume: ResumeTemplate,
  editorial: EditorialTemplate,
  minimal: MinimalTemplate,
  dossier: DossierTemplate,
};

const HANDWRITTEN: TemplateMeta[] = HANDWRITTEN_INFO.map((info) => ({
  ...info,
  Component: HANDWRITTEN_COMPONENTS[info.id],
}));

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