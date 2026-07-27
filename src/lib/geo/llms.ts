import type { FullProfile } from "@/types/founder";
import { LOOKING_LABEL, PORTFOLIO_LABEL } from "@/templates/shared/themeStyle";
import { profileUrl, skillLabels, stageLabel } from "./schema";

/**
 * llms.txt generators.
 *
 * The llms.txt convention (llmstxt.org) serves a concise, Markdown-formatted
 * summary of a site at /llms.txt so LLM crawlers can ingest meaning without
 * parsing rendered HTML/JS. Two variants:
 *   - llms.txt      — short index: who they are + key links
 *   - llms-full.txt — the entire profile expanded for deep retrieval
 *
 * Note: a Vite SPA can't serve these at a real path without a server, so the
 * UI offers download + copy, and the text is also embedded in the public page
 * inside a hidden <pre> so crawlers that do render JS still reach it.
 */

function line(label: string, value?: string | null): string | null {
  const v = value?.toString().trim();
  return v ? `- **${label}:** ${v}` : null;
}

function joinLines(parts: Array<string | null>): string {
  return parts.filter((p): p is string => p !== null).join("\n");
}

/** Short index file — the "table of contents" variant. */
export function buildLlmsTxt(profile: FullProfile, origin: string): string {
  const { identity, founder, contact } = profile;
  const url = profileUrl(profile, origin);
  const name = identity.name || "Founder";
  const stage = stageLabel(profile);

  const summary =
    identity.bio ||
    founder.mission ||
    founder.problem ||
    `${name} is a founder building ${founder.current_venture ?? "a new venture"}.`;

  return `# ${name}

> ${summary}

${joinLines([
    line("Profile", url),
    line("Role", identity.headline),
    line("Building", founder.current_venture),
    line("Industry", founder.industry),
    line("Stage", stage),
    line("Location", identity.location),
    line("Education", identity.college),
    line("Skills", skillLabels(profile).join(", ")),
    line(
      "Open to",
      profile.looking_for.map((l) => LOOKING_LABEL[l] ?? l).join(", "),
    ),
  ])}

## Links

${joinLines([
    line("Founder profile", url),
    line("Website", identity.website),
    line("LinkedIn", identity.linkedin),
    line("Contact", contact.email),
    line("Full details", `${url} (see llms-full.txt)`),
  ])}
`;
}

/** Expanded variant — full context for retrieval-augmented answers. */
export function buildLlmsFullTxt(profile: FullProfile, origin: string): string {
  const { identity, founder, vision, contact, milestones, portfolio } = profile;
  const url = profileUrl(profile, origin);
  const name = identity.name || "Founder";
  const stage = stageLabel(profile);
  const sections: string[] = [];

  sections.push(`# ${name} — Full Founder Profile

Source: ${url}
Last updated: ${new Date(profile.updated_at).toISOString().slice(0, 10)}
`);

  sections.push(`## Identity

${joinLines([
    line("Name", identity.name),
    line("Headline", identity.headline),
    line("Location", identity.location),
    line("College", identity.college),
    line("Graduation", identity.graduation),
  ])}

${identity.bio ?? ""}`);

  if (founder.current_venture || founder.problem || founder.mission) {
    sections.push(`## What they are building

${joinLines([
      line("Venture", founder.current_venture),
      line("Industry", founder.industry),
      line("Stage", stage),
    ])}

${founder.problem ? `**Problem being solved:** ${founder.problem}` : ""}
${founder.mission ? `**Mission:** ${founder.mission}` : ""}`);
  }

  if (founder.additional_ventures?.length) {
    sections.push(`## Other ventures

${founder.additional_ventures
      .map((v) => `- **${v.name ?? "Venture"}**${v.industry ? ` (${v.industry})` : ""}${v.mission ? ` — ${v.mission}` : ""}`)
      .join("\n")}`);
  }

  if (vision.problem_solving || vision.why_it_matters) {
    sections.push(`## Vision

${vision.problem_solving ? `**The problem:** ${vision.problem_solving}` : ""}
${vision.why_it_matters ? `**Why it matters:** ${vision.why_it_matters}` : ""}`);
  }

  if (milestones.length > 0) {
    sections.push(`## Journey

${milestones
      .map((m) => `- **${m.year}** — ${m.title}${m.description ? `: ${m.description}` : ""}`)
      .join("\n")}`);
  }

  const skills = skillLabels(profile);
  if (skills.length > 0) {
    sections.push(`## Skills and expertise

${skills.map((s) => `- ${s}`).join("\n")}`);
  }

  if (profile.looking_for.length > 0) {
    sections.push(`## What they are looking for

${profile.looking_for.map((l) => `- ${LOOKING_LABEL[l] ?? l}`).join("\n")}`);
  }

  if (portfolio.length > 0) {
    sections.push(`## Portfolio and work

${portfolio
      .map((p) => {
        const link = p.url ?? p.file_url;
        return `- **${p.title}** (${PORTFOLIO_LABEL[p.kind] ?? p.kind})${p.description ? ` — ${p.description}` : ""}${link ? ` [${link}]` : ""}`;
      })
      .join("\n")}`);
  }

  sections.push(`## Contact

${joinLines([
    line("Email", contact.email),
    line("Website", identity.website),
    line("LinkedIn", identity.linkedin),
    line("Twitter/X", contact.twitter),
    line("Profile", url),
  ])}`);

  return sections.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** Trigger a client-side download of generated text (no server needed). */
export function downloadText(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}
