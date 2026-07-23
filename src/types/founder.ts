export type StartupStage = "idea" | "validation" | "mvp" | "revenue" | "profitable" | "funded" | "scaling";

export const SKILL_TAGS = [
  "operations","finance","marketing","ai","logistics","supply_chain",
  "sales","fundraising","legal","hr","product","design","engineering"
] as const;
export type SkillTag = typeof SKILL_TAGS[number];

export const LOOKING_FOR_OPTIONS = [
  "cofounder","mentor","investor","internship","advisor","employees","beta_users","customers"
] as const;
export type LookingFor = typeof LOOKING_FOR_OPTIONS[number];

export const PORTFOLIO_KINDS = [
  "pitch_deck","website","demo","business_model","financial_model","research_paper","award","validation","other"
] as const;
export type PortfolioKind = typeof PORTFOLIO_KINDS[number];

export const STARTUP_STAGES: { value: StartupStage; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "validation", label: "Validation" },
  { value: "mvp", label: "MVP" },
  { value: "revenue", label: "Revenue" },
  { value: "profitable", label: "Profitable" },
  { value: "funded", label: "Funded" },
  { value: "scaling", label: "Scaling" },
];

export interface Identity {
  name?: string;
  photo_url?: string;
  cover_url?: string;
  headline?: string;
  bio?: string;
  location?: string;
  college?: string;
  graduation?: string;
  website?: string;
  linkedin?: string;
}

export interface FounderBlock {
  current_venture?: string;
  previous_ventures?: string[];
  stage?: StartupStage;
  industry?: string;
  problem?: string;
  mission?: string;
  additional_ventures?: Venture[];
}

export interface Venture {
  name?: string;
  industry?: string;
  stage?: StartupStage;
  problem?: string;
  mission?: string;
}

export interface Vision {
  problem_solving?: string;
  why_it_matters?: string;
}

export interface Contact {
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  twitter?: string;
}

export interface Theme {
  accent: string;
  mode: "light" | "dark";
  fontPreset: "rubik" | "editorial" | "mono" | "serif";
  display_habits?: boolean;
}

export interface FounderProfile {
  id: string;
  slug: string;
  is_published: boolean;
  template_id: string;
  theme: Theme;
  identity: Identity;
  founder: FounderBlock;
  vision: Vision;
  contact: Contact;
  looking_for: LookingFor[];
  created_at: string;
  updated_at: string;
}

export interface Skill { id: string; profile_id: string; tag: SkillTag; }
export interface Milestone {
  id: string; profile_id: string; year: string; title: string;
  description: string | null; order_index: number;
}
export interface PortfolioItem {
  id: string; profile_id: string; kind: PortfolioKind;
  title: string; description: string | null;
  url: string | null; file_url: string | null; order_index: number;
}

export interface FullProfile extends FounderProfile {
  skills: Skill[];
  milestones: Milestone[];
  portfolio: PortfolioItem[];
}