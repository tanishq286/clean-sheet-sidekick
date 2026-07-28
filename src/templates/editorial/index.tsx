import type { TemplateProps } from "../types";
import { motion } from "framer-motion";
import Milestones from "@/components/Milestones";
import Portfolio from "@/components/Portfolio";
import { themeStyle, STAGE_LABEL, LOOKING_LABEL, SKILL_LABEL } from "../shared/themeStyle";

export default function EditorialTemplate({ profile }: TemplateProps) {
  const { identity, founder, vision, contact, looking_for, skills, milestones, portfolio, theme } = profile;
  const dark = theme.mode === "dark";
  return (
    <div style={themeStyle(theme)} className={`min-h-screen ${dark ? "bg-[#0e0d0b] text-[#f3eee5]" : "bg-[#f3eee5] text-[#1a1815]"}`} >
      {/* Masthead */}
      <div className={`border-b-4 border-double ${dark ? "border-[#f3eee5]/40" : "border-[#1a1815]/40"}`}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center text-[10px] uppercase tracking-[0.4em] font-['Instrument_Serif']">
          <span>The Founder Review</span>
          <span style={{ color: "var(--accent)" }}>Vol. 01 · No. 03</span>
          <span className="hidden md:inline">Est. {new Date().getFullYear()}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        {/* HERO — magazine cover */}
        <header className="grid md:grid-cols-12 gap-10 mb-20 pb-16 border-b border-current/15">
          <div className="md:col-span-8">
            <div className="text-xs uppercase tracking-[0.4em] mb-8" style={{ color: "var(--accent)" }}>
              Featured · {founder.stage ? STAGE_LABEL[founder.stage] : "Founder"}
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
              className="font-['Instrument_Serif'] text-[clamp(3.5rem,9vw,8rem)] leading-[0.92] tracking-tight">
              {identity.name ?? "Your Name"}
            </motion.h1>
            {identity.bio && (
              <p className="mt-8 font-['Fraunces'] text-2xl md:text-3xl leading-snug italic max-w-2xl opacity-90">
                "{identity.bio}"
              </p>
            )}
          </div>
          <div className="md:col-span-4 flex flex-col gap-6">
            {identity.photo_url && (
              <img src={identity.photo_url} alt={identity.name} className="w-full aspect-[3/4] object-cover grayscale" />
            )}
            <dl className="text-sm font-['Fraunces'] space-y-1">
              {identity.location && <Row k="Based" v={identity.location} />}
              {identity.college && <Row k="School" v={identity.college} />}
              {contact.email && <Row k="Write" v={contact.email} href={`mailto:${contact.email}`} />}
              {identity.website && <Row k="Web" v={identity.website.replace(/^https?:\/\//, "")} href={identity.website} />}
            </dl>
          </div>
        </header>

        {/* THE FEATURE — drop cap */}
        {founder.current_venture && (
          <section className="mb-24 grid md:grid-cols-12 gap-10">
            <div className="md:col-span-3">
              <div className="text-xs uppercase tracking-[0.4em] mb-2" style={{ color: "var(--accent)" }}>The Venture</div>
              <div className="font-['Instrument_Serif'] text-4xl leading-tight">{founder.current_venture}</div>
              {founder.industry && <div className="mt-2 text-sm uppercase tracking-wider opacity-60">{founder.industry}</div>}
            </div>
            <div className="md:col-span-9 md:columns-2 gap-10 font-['Fraunces'] text-lg leading-[1.7]">
              {founder.problem && (
                <p className="mb-4">
                  <span className="float-left font-['Instrument_Serif'] text-7xl leading-[0.85] pr-3 pt-1" style={{ color: "var(--accent)" }}>
                    {founder.problem.charAt(0)}
                  </span>
                  {founder.problem.slice(1)}
                </p>
              )}
              {founder.mission && <p className="italic opacity-90">— {founder.mission}</p>}
            </div>
          </section>
        )}

        {/* VISION — pull quotes */}
        {(vision.problem_solving || vision.why_it_matters) && (
          <section className="mb-24 py-16 border-y border-current/15">
            <div className="text-xs uppercase tracking-[0.4em] text-center mb-12" style={{ color: "var(--accent)" }}>Vision</div>
            <div className="grid md:grid-cols-2 gap-12">
              {vision.problem_solving && (
                <blockquote className="font-['Instrument_Serif'] text-3xl md:text-4xl leading-tight">
                  <span style={{ color: "var(--accent)" }} className="text-5xl mr-2">"</span>
                  {vision.problem_solving}
                  <footer className="mt-4 text-xs uppercase tracking-[0.3em] opacity-60 not-italic">— Problem to solve</footer>
                </blockquote>
              )}
              {vision.why_it_matters && (
                <blockquote className="font-['Instrument_Serif'] text-3xl md:text-4xl leading-tight md:text-right">
                  <span style={{ color: "var(--accent)" }} className="text-5xl mr-2">"</span>
                  {vision.why_it_matters}
                  <footer className="mt-4 text-xs uppercase tracking-[0.3em] opacity-60 not-italic">— Why it matters</footer>
                </blockquote>
              )}
            </div>
          </section>
        )}

        {/* JOURNEY */}
        {milestones.length > 0 && (
          <section className="mb-24 grid md:grid-cols-12 gap-10">
            <div className="md:col-span-3 text-xs uppercase tracking-[0.4em]" style={{ color: "var(--accent)" }}>Chronicle</div>
            <div className="md:col-span-9">
              <Milestones milestones={milestones} showHeader={false} variant="document" />
            </div>
          </section>
        )}

        {/* SKILLS + OPEN TO */}
        <section className="mb-24 grid md:grid-cols-2 gap-12 py-12 border-y border-current/15">
          {skills.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-[0.4em] mb-6" style={{ color: "var(--accent)" }}>Disciplines</div>
              <p className="font-['Instrument_Serif'] text-3xl leading-snug">
                {skills.map((s) => SKILL_LABEL[s.tag] ?? s.tag).join(" · ")}
              </p>
            </div>
          )}
          {looking_for.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-[0.4em] mb-6" style={{ color: "var(--accent)" }}>In Search Of</div>
              <ul className="font-['Fraunces'] text-xl space-y-2">
                {looking_for.map((l) => <li key={l}>— {LOOKING_LABEL[l] ?? l}</li>)}
              </ul>
            </div>
          )}
        </section>

        {/* PORTFOLIO */}
        {portfolio.length > 0 && (
          <section className="mb-16">
            <div className="text-xs uppercase tracking-[0.4em] mb-8 text-center" style={{ color: "var(--accent)" }}>Selected Works</div>
            <Portfolio portfolio={portfolio} showHeader={false} variant="document" />
          </section>
        )}

        {/* COLOPHON */}
        <footer className="mt-20 pt-8 border-t-4 border-double border-current/40 flex flex-wrap justify-between items-end gap-4 text-xs uppercase tracking-[0.3em]">
          <span>End · {identity.name ?? "Anonymous"}</span>
          <span style={{ color: "var(--accent)" }}>✦</span>
          <span>Set in Instrument Serif & Fraunces</span>
        </footer>
      </div>
    </div>
  );
}

function Row({ k, v, href }: { k: string; v: string; href?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-current/15 py-1">
      <dt className="uppercase text-[10px] tracking-[0.3em] opacity-60 self-center">{k}</dt>
      <dd className="text-right">{href ? <a href={href} className="hover:underline">{v}</a> : v}</dd>
    </div>
  );
}