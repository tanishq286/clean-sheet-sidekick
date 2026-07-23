import type { TemplateMeta } from "./types";
import ResumeTemplate from "./resume";
import EditorialTemplate from "./editorial";
import MinimalTemplate from "./minimal";
import DossierTemplate from "./dossier";
import ProfileTemplate from "./profile";
import ShowcaseTemplate from "./showcase";

export const TEMPLATES: TemplateMeta[] = [
  { id: "profile", name: "Profile", description: "LinkedIn-style: cover banner, large avatar, ventures grid, skills sidebar.", Component: ProfileTemplate },
  { id: "showcase", name: "Showcase", description: "Cinematic dark hero with full-bleed cover, portrait, and venture gallery.", Component: ShowcaseTemplate },
  { id: "resume", name: "Resume", description: "Bold display type, orange accents — the classic founder one-pager.", Component: ResumeTemplate },
  { id: "editorial", name: "Editorial", description: "Dark, magazine-style with large headlines and serif quotes.", Component: EditorialTemplate },
  { id: "minimal", name: "Minimal", description: "Calm, single-column, lots of whitespace.", Component: MinimalTemplate },
  { id: "dossier", name: "Dossier", description: "Dense, structured investor brief layout.", Component: DossierTemplate },
];

export function getTemplate(id: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}