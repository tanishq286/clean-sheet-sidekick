export const CONTACT_INTENTS = ["project", "role", "mentorship", "hello"] as const;
export type ContactIntent = (typeof CONTACT_INTENTS)[number];

export const TIMELINES = ["<1 month", "1-3 months", "Flexible"] as const;
export type Timeline = (typeof TIMELINES)[number];

export interface ContactPayload {
  intent: ContactIntent;
  name: string;
  email: string;
  message: string;
  /** Only present for project inquiries. */
  budget?: number;
  timeline?: Timeline;
  /** Slug of the profile being contacted. */
  toSlug: string;
  toName?: string;
  submittedAt: string;
}

export interface ContactSectionProps {
  /** Recipient display name, shown in the heading. */
  name?: string;
  /** Recipient email — used for the mailto fallback. */
  email?: string;
  /** Profile slug, included in the payload. */
  slug: string;
  /** Optional scheduling link surfaced in the success state. */
  calendarUrl?: string;
  /**
   * POST target for submissions (webhook, EmailJS proxy, serverless fn).
   * When omitted the form falls back to opening a prefilled mailto: draft,
   * so the section is always functional with zero backend setup.
   */
  endpoint?: string;
  /**
   * Demo mode: simulates a successful send without any network call.
   * Used by the builder preview so users can test the flow safely.
   */
  demoMode?: boolean;
  accent?: string;
}

export const BUDGET_MIN = 1000;
export const BUDGET_MAX = 10000;

export function formatBudget(value: number): string {
  if (value >= BUDGET_MAX) return "$10k+";
  return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
}
