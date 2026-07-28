import type { TemplateProps } from "../types";
import Milestones from "@/components/Milestones";
import Portfolio from "@/components/Portfolio";
import { motion } from "framer-motion";
import { themeStyle, STAGE_LABEL, LOOKING_LABEL, SKILL_LABEL } from "../shared/themeStyle";

export default function MinimalTemplate({ profile }: TemplateProps) {
  const { identity, founder, vision, contact, looking_for, skills, milestones, portfolio, theme } = profile;
  return (
    <div style={themeStyle(theme)} className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-xl mx-auto px-6 py-32 space-y-24">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-8">
          {identity.photo_url && (
            <img src={identity.photo_url} alt={identity.name} className="w-16 h-16 rounded-full object-cover ring-1 ring-neutral-200" />
          )}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
              {founder.stage ? `${STAGE_LABEL[founder.stage]} stage` : "Founder"}{identity.location ? ` · ${identity.location}` : ""}
            </div>
            <h1 className="text-5xl font-light tracking-tight">{identity.name ?? "Your Name"}</h1>
          </div>
          {identity.bio && <p className="text-xl leading-relaxed text-neutral-600 font-light">{identity.bio}</p>}
        </motion.header>

        {founder.current_venture && (
          <Section label="Currently">
            <p className="text-xl font-normal leading-snug">
              Building <span className="font-medium" style={{ color: "var(--accent)" }}>{founder.current_venture}</span>
              {founder.industry && <span className="text-neutral-500"> · {founder.industry}</span>}
            </p>
            {founder.problem && <p className="mt-3 text-neutral-600 leading-relaxed">{founder.problem}</p>}
          </Section>
        )}

        {(vision.problem_solving || vision.why_it_matters) && (
          <Section label="Vision">
            <div className="space-y-5">
              {vision.problem_solving && (
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Problem</div>
                  <p className="leading-relaxed">{vision.problem_solving}</p>
                </div>
              )}
              {vision.why_it_matters && (
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Why it matters</div>
                  <p className="leading-relaxed">{vision.why_it_matters}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {milestones.length > 0 && (
          <Section label="Journey">
            <Milestones milestones={milestones} showHeader={false} variant="vivid" />
          </Section>
        )}

        {skills.length > 0 && (
          <Section label="Skills">
            <p className="text-neutral-600 leading-loose">{skills.map((s) => SKILL_LABEL[s.tag] ?? s.tag).join(" · ")}</p>
          </Section>
        )}

        {looking_for.length > 0 && (
          <Section label="Open to">
            <div className="flex flex-wrap gap-2">
              {looking_for.map((l) => (
                <span key={l} className="text-sm px-3 py-1 rounded-full border border-current/15" style={{ color: "var(--accent)" }}>
                  {LOOKING_LABEL[l] ?? l}
                </span>
              ))}
            </div>
          </Section>
        )}

        {portfolio.length > 0 && (
          <Section label="Selected work">
            <Portfolio portfolio={portfolio} showHeader={false} variant="vivid" />
          </Section>
        )}

        <footer className="pt-8 border-t border-neutral-100 text-sm text-neutral-500 flex flex-wrap gap-x-6 gap-y-2">
          {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-neutral-900 transition">{contact.email}</a>}
          {identity.linkedin && <a href={identity.linkedin} target="_blank" rel="noreferrer" className="hover:text-neutral-900 transition">LinkedIn</a>}
          {identity.website && <a href={identity.website} target="_blank" rel="noreferrer" className="hover:text-neutral-900 transition">{identity.website.replace(/^https?:\/\//, "")}</a>}
        </footer>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5 }}
      className="grid md:grid-cols-[100px_1fr] gap-3 md:gap-8">
      <div className="text-xs uppercase tracking-wider text-neutral-400 pt-1">{label}</div>
      <div>{children}</div>
    </motion.section>
  );
}