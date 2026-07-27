import type { FullProfile } from "@/types/founder";

/**
 * AI Search Indexing Score (AEO/GEO readiness).
 *
 * Each check maps to a concrete signal that answer engines actually use when
 * deciding whether they can cite a page. Weights are tuned so the things that
 * most affect citation (being published, having an entity-defining bio, having
 * declared expertise) dominate the score.
 */

export type ScoreImpact = "critical" | "high" | "medium" | "low";

export interface ScoreCheck {
  id: string;
  label: string;
  /** Why this matters for AI/LLM discovery — shown as the actionable tip. */
  tip: string;
  weight: number;
  impact: ScoreImpact;
  passed: boolean;
  /** Deep link into the editor section that fixes this. */
  href: string;
}

export interface AeoScore {
  score: number;
  grade: "Excellent" | "Strong" | "Fair" | "Needs work";
  checks: ScoreCheck[];
  passedCount: number;
  totalCount: number;
  /** Highest-impact unfixed items, ready to render as a to-do list. */
  nextActions: ScoreCheck[];
}

const MIN_BIO_LENGTH = 120;

export function computeAeoScore(profile: FullProfile | null): AeoScore {
  if (!profile) {
    return { score: 0, grade: "Needs work", checks: [], passedCount: 0, totalCount: 0, nextActions: [] };
  }

  const { identity, founder, vision, contact, skills, milestones, portfolio, looking_for } = profile;
  const bio = identity.bio?.trim() ?? "";

  const checks: ScoreCheck[] = [
    {
      id: "published",
      label: "Profile is published",
      tip: "Unpublished profiles are invisible to every crawler and AI engine. Publish from your dashboard to become indexable.",
      weight: 20,
      impact: "critical",
      passed: profile.is_published,
      href: "/app",
    },
    {
      id: "name",
      label: "Full name set",
      tip: "AI engines resolve people by name. Without one there is no entity to attach your expertise to.",
      weight: 8,
      impact: "critical",
      passed: Boolean(identity.name?.trim()),
      href: "/app/edit#identity",
    },
    {
      id: "bio",
      label: "Descriptive bio (120+ characters)",
      tip: `Write at least ${MIN_BIO_LENGTH} characters describing who you are and what you do. This is the snippet AI engines quote when answering "who is …".`,
      weight: 14,
      impact: "high",
      passed: bio.length >= MIN_BIO_LENGTH,
      href: "/app/edit#identity",
    },
    {
      id: "headline",
      label: "Headline / job title",
      tip: "A one-line role (e.g. 'Founder, Routely · Logistics') gives engines a precise jobTitle field to cite.",
      weight: 6,
      impact: "medium",
      passed: Boolean(identity.headline?.trim()),
      href: "/app/edit#identity",
    },
    {
      id: "photo",
      label: "Profile photo",
      tip: "Images populate rich results and social/AI preview cards, which raises click-through on citations.",
      weight: 4,
      impact: "low",
      passed: Boolean(identity.photo_url),
      href: "/app/edit#identity",
    },
    {
      id: "venture",
      label: "Current venture + industry",
      tip: "Naming your company and industry lets engines answer sector queries like 'logistics founders in India'.",
      weight: 10,
      impact: "high",
      passed: Boolean(founder.current_venture?.trim() && founder.industry?.trim()),
      href: "/app/edit#founder",
    },
    {
      id: "problem",
      label: "Problem statement written",
      tip: "Problem/mission text is the highest-signal content for 'what does X work on' style questions.",
      weight: 8,
      impact: "high",
      passed: Boolean(founder.problem?.trim() || founder.mission?.trim()),
      href: "/app/edit#founder",
    },
    {
      id: "vision",
      label: "Vision answered",
      tip: "Long-form vision answers give retrieval systems quotable context beyond your short bio.",
      weight: 6,
      impact: "medium",
      passed: Boolean(vision.problem_solving?.trim() && vision.why_it_matters?.trim()),
      href: "/app/edit#vision",
    },
    {
      id: "skills",
      label: "3+ skills tagged",
      tip: "Skills become schema.org `knowsAbout` — the field engines match against expertise queries.",
      weight: 8,
      impact: "high",
      passed: skills.length >= 3,
      href: "/app/edit#skills",
    },
    {
      id: "journey",
      label: "3+ journey milestones",
      tip: "Dated milestones establish track record and recency, both of which improve citation confidence.",
      weight: 5,
      impact: "medium",
      passed: milestones.length >= 3,
      href: "/app/edit#journey",
    },
    {
      id: "portfolio",
      label: "Portfolio item with a link",
      tip: "Outbound links to real work become verifiable `CreativeWork` entries engines can point to.",
      weight: 5,
      impact: "medium",
      passed: portfolio.some((p) => Boolean(p.url || p.file_url)),
      href: "/app/edit#portfolio",
    },
    {
      id: "looking_for",
      label: "Looking-for selected",
      tip: "These map to your offer catalog, powering intent queries like 'founders seeking a technical cofounder'.",
      weight: 3,
      impact: "low",
      passed: looking_for.length > 0,
      href: "/app/edit#looking",
    },
    {
      id: "contact",
      label: "Contact email set",
      tip: "A reachable contact point signals a real, active entity and enables follow-up from referrals.",
      weight: 3,
      impact: "low",
      passed: Boolean(contact.email?.trim()),
      href: "/app/edit#contact",
    },
  ];

  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const score = Math.round((earned / total) * 100);

  const impactRank: Record<ScoreImpact, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const nextActions = checks
    .filter((c) => !c.passed)
    .sort((a, b) => impactRank[a.impact] - impactRank[b.impact] || b.weight - a.weight)
    .slice(0, 4);

  return {
    score,
    grade: score >= 90 ? "Excellent" : score >= 70 ? "Strong" : score >= 45 ? "Fair" : "Needs work",
    checks,
    passedCount: checks.filter((c) => c.passed).length,
    totalCount: checks.length,
    nextActions,
  };
}
