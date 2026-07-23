import type { FullProfile } from "@/types/founder";

export interface CompletionResult {
  percent: number;
  sections: { key: string; label: string; weight: number; complete: boolean; href: string }[];
}

export function computeCompletion(p: FullProfile | null): CompletionResult {
  if (!p) return { percent: 0, sections: [] };
  const sections = [
    {
      key: "identity", label: "Identity (name, bio, photo, location)", weight: 20, href: "/app/edit#identity",
      complete: !!(p.identity?.name && p.identity?.bio && p.identity?.photo_url && p.identity?.location),
    },
    {
      key: "founder", label: "What you're building", weight: 20, href: "/app/edit#founder",
      complete: !!(p.founder?.current_venture && p.founder?.stage && p.founder?.industry && p.founder?.problem),
    },
    {
      key: "vision", label: "Vision (both questions)", weight: 15, href: "/app/edit#vision",
      complete: !!(p.vision?.problem_solving && p.vision?.why_it_matters),
    },
    {
      key: "journey", label: "Journey (≥3 milestones)", weight: 15, href: "/app/edit#journey",
      complete: (p.milestones?.length ?? 0) >= 3,
    },
    {
      key: "skills", label: "Skills (≥3 tags)", weight: 10, href: "/app/edit#skills",
      complete: (p.skills?.length ?? 0) >= 3,
    },
    {
      key: "looking_for", label: "Looking For (≥1)", weight: 10, href: "/app/edit#looking",
      complete: (p.looking_for?.length ?? 0) >= 1,
    },
    {
      key: "portfolio", label: "Portfolio (≥1 item)", weight: 10, href: "/app/edit#portfolio",
      complete: (p.portfolio?.length ?? 0) >= 1,
    },
  ];
  const percent = sections.reduce((s, x) => s + (x.complete ? x.weight : 0), 0);
  return { percent, sections };
}