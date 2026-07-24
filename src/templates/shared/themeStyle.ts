import type { Theme } from "@/types/founder";

export function themeStyle(theme: Theme): React.CSSProperties {
  return { "--accent": theme.accent } as unknown as React.CSSProperties;
}

export const STAGE_LABEL: Record<string, string> = {
  idea: "Idea", validation: "Validation", mvp: "MVP", revenue: "Revenue",
  profitable: "Profitable", funded: "Funded", scaling: "Scaling",
};

export const LOOKING_LABEL: Record<string, string> = {
  cofounder: "Cofounder", mentor: "Mentor", investor: "Investor",
  internship: "Internship", advisor: "Advisor", employees: "Employees",
  beta_users: "Beta Users", customers: "Customers",
};

export const SKILL_LABEL: Record<string, string> = {
  operations: "Operations", finance: "Finance", marketing: "Marketing", ai: "AI",
  logistics: "Logistics", supply_chain: "Supply Chain", sales: "Sales",
  fundraising: "Fundraising", legal: "Legal", hr: "HR", product: "Product",
  design: "Design", engineering: "Engineering",
};

export const PORTFOLIO_LABEL: Record<string, string> = {
  pitch_deck: "Pitch Deck", website: "Website", demo: "Demo",
  business_model: "Business Model", financial_model: "Financial Model",
  research_paper: "Research Paper", award: "Award", validation: "Validation", other: "Other",
};