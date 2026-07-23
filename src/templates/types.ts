import type { FullProfile } from "@/types/founder";
export interface TemplateProps { profile: FullProfile; }
export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  Component: React.ComponentType<TemplateProps>;
}