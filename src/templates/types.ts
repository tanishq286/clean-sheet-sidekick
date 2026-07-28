import type { FullProfile } from "@/types/founder";
export interface TemplateProps { profile: FullProfile; }
export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  /** Coarse grouping for the picker; hand-written templates omit it. */
  family?: string;
  Component: React.ComponentType<TemplateProps>;
}