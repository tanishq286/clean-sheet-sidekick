import type { TemplateProps } from "../types";
import { motion } from "framer-motion";
import { themeStyle, STAGE_LABEL, LOOKING_LABEL, SKILL_LABEL, PORTFOLIO_LABEL } from "../shared/themeStyle";

export default function ResumeTemplate({ profile }: TemplateProps) {
  const { identity, founder, vision, contact, looking_for, skills, milestones, portfolio, theme } = profile;
  const [firstName, ...rest] = (identity.name ?? "Your Name").split(" ");
  const lastName = rest.join(" ");

  return (
    <div style={themeStyle(theme)} className="min-h-screen bg-[#f5f3ee] text-neutral-900 font-['Rubik']">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 backdrop-blur bg-[#f5f3ee]/80 border-b border-neutral-900/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-3 flex items-center justify-between text-xs uppercase tracking-[0.2em]">
          <span>{identity.name ?? "Founder"}</span>
          <span style={{ color: "var(--accent)" }}>● {founder.stage ? STAGE_LABEL[founder.stage] : "Founder"}</span>
          {contact.email && <a href={`mailto:${contact.email}`} className="hidden md:inline hover:opacity-60">{contact.email}</a>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-24">
        {/* HERO — colossal display */}
        <section className="relative pt-8 pb-20">
          <div className="text-[10px] uppercase tracking-[0.4em] opacity-50 mb-6">001 — Identity</div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-['Archivo_Black'] text-[clamp(4rem,18vw,14rem)] leading-[0.82] tracking-[-0.04em] uppercase">
            {firstName}<br />
            <span style={{ color: "var(--accent)" }}>{lastName || "—"}</span>
          </motion.h1>
          <div className="mt-10 grid md:grid-cols-[1fr_auto] gap-10 items-end">
            {identity.bio && <p className="text-xl md:text-2xl leading-snug max-w-2xl text-neutral-700">{identity.bio}</p>}
            {identity.photo_url && (
              <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                src={identity.photo_url} alt={identity.name}
                style={{ borderColor: "var(--accent)" }}
                className="w-40 h-52 md:w-56 md:h-72 object-cover border-[6px] rotate-[2deg] shadow-2xl" />
            )}
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-sm border-t border-neutral-900/15 pt-6">
            {identity.location && <Meta k="Based" v={identity.location} />}
            {identity.college && <Meta k="School" v={identity.college} />}
            {identity.graduation && <Meta k="Class of" v={identity.graduation} />}
            {identity.website && <Meta k="Web" v={identity.website.replace(/^https?:\/\//, "")} href={identity.website} />}
            {identity.linkedin && <Meta k="In" v="LinkedIn" href={identity.linkedin} />}
          </div>
        </section>

        {/* BUILDING + VISION — asymmetric */}
        <section className="grid md:grid-cols-12 gap-8 py-16 border-t border-neutral-900/15">
          <div className="md:col-span-1 text-[10px] uppercase tracking-[0.4em] opacity-50">002</div>
          <div className="md:col-span-5">
            <h3 className="text-xs uppercase tracking-[0.3em] mb-6" style={{ color: "var(--accent)" }}>Building</h3>
            {founder.current_venture && <div className="font-['Archivo_Black'] text-4xl md:text-5xl leading-tight mb-3 uppercase">{founder.current_venture}</div>}
            {founder.industry && <div className="text-sm uppercase tracking-wider opacity-60 mb-6">{founder.industry}</div>}
            {founder.problem && <p className="text-lg leading-relaxed">{founder.problem}</p>}
            {founder.mission && <p className="mt-4 italic text-neutral-600">"{founder.mission}"</p>}
            {(founder.additional_ventures?.length ?? 0) > 0 && (
              <div className="mt-8 space-y-4">
                <div className="text-[10px] uppercase tracking-[0.3em] opacity-60">Also building</div>
                {founder.additional_ventures!.map((v, i) => (
                  <div key={v.id ?? `venture-${i}`} className="border-l-2 pl-4" style={{ borderColor: "var(--accent)" }}>
                    <div className="font-['Archivo_Black'] text-xl uppercase">{v.name || "Untitled"}</div>
                    <div className="text-xs uppercase tracking-wider opacity-60">{[v.industry, v.stage ? STAGE_LABEL[v.stage] : null].filter(Boolean).join(" · ")}</div>
                    {v.problem && <p className="mt-2 text-sm text-neutral-700 leading-relaxed">{v.problem}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-6 md:pl-12 md:border-l border-neutral-900/15 space-y-8">
            <h3 className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>Vision</h3>
            {vision.problem_solving && <div><div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Problem</div><p className="text-xl leading-snug">{vision.problem_solving}</p></div>}
            {vision.why_it_matters && <div><div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Why it matters</div><p className="text-xl leading-snug">{vision.why_it_matters}</p></div>}
          </div>
        </section>

        {/* JOURNEY + SKILLS */}
        <section className="grid md:grid-cols-12 gap-8 py-16 border-t border-neutral-900/15">
          <div className="md:col-span-1 text-[10px] uppercase tracking-[0.4em] opacity-50">003</div>
          <div className="md:col-span-7">
            <h3 className="text-xs uppercase tracking-[0.3em] mb-8" style={{ color: "var(--accent)" }}>Journey</h3>
            <ol className="relative">
              {milestones.map((m, i) => (
                <motion.li key={m.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-[90px_1fr] gap-6 py-5 border-b border-neutral-900/10 last:border-0">
                  <div className="font-['Archivo_Black'] text-2xl" style={{ color: "var(--accent)" }}>{m.year}</div>
                  <div>
                    <div className="font-medium text-lg mb-1">{m.title}</div>
                    {m.description && <p className="text-sm text-neutral-600 leading-relaxed">{m.description}</p>}
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
          <div className="md:col-span-4 md:col-start-9 space-y-10">
            {skills.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "var(--accent)" }}>Toolkit</h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s.id} className="px-3 py-1 text-xs uppercase tracking-wider border border-neutral-900/30 rounded-full hover:bg-neutral-900 hover:text-[#f5f3ee] transition">
                      {SKILL_LABEL[s.tag] ?? s.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {looking_for.length > 0 && (
              <div className="p-6 border-2 border-dashed" style={{ borderColor: "var(--accent)" }}>
                <h3 className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "var(--accent)" }}>Open To</h3>
                <ul className="space-y-2">{looking_for.map((l) => <li key={l} className="flex gap-2"><span style={{ color: "var(--accent)" }}>→</span>{LOOKING_LABEL[l] ?? l}</li>)}</ul>
              </div>
            )}
          </div>
        </section>

        {/* PORTFOLIO */}
        {portfolio.length > 0 && (
          <section className="grid md:grid-cols-12 gap-8 py-16 border-t border-neutral-900/15">
            <div className="md:col-span-1 text-[10px] uppercase tracking-[0.4em] opacity-50">004</div>
            <div className="md:col-span-11">
              <h3 className="text-xs uppercase tracking-[0.3em] mb-8" style={{ color: "var(--accent)" }}>Portfolio</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-900/15">
                {portfolio.map((p) => (
                  <a key={p.id} href={p.url ?? p.file_url ?? "#"} target="_blank" rel="noreferrer"
                    className="group bg-[#f5f3ee] p-6 hover:bg-white transition flex flex-col gap-3 min-h-[160px]">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--accent)" }}>{PORTFOLIO_LABEL[p.kind]}</span>
                      <span className="text-neutral-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition">↗</span>
                    </div>
                    <div className="font-['Archivo_Black'] text-xl uppercase leading-tight">{p.title}</div>
                    {p.description && <p className="text-sm text-neutral-600 mt-auto">{p.description}</p>}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FOOTER CTA */}
        <footer className="py-20 border-t border-neutral-900/15">
          <div className="font-['Archivo_Black'] text-[clamp(2.5rem,8vw,6rem)] leading-[0.9] uppercase">
            Let's<br /><span style={{ color: "var(--accent)" }}>build →</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            {contact.email && <a href={`mailto:${contact.email}`} className="px-5 py-2 bg-neutral-900 text-[#f5f3ee] rounded-full hover:opacity-80">{contact.email}</a>}
            {contact.phone && <a href={`tel:${contact.phone}`} className="px-5 py-2 border border-neutral-900 rounded-full hover:bg-neutral-900 hover:text-[#f5f3ee] transition">{contact.phone}</a>}
            {identity.linkedin && <a href={identity.linkedin} className="px-5 py-2 border border-neutral-900 rounded-full hover:bg-neutral-900 hover:text-[#f5f3ee] transition">LinkedIn</a>}
          </div>
        </footer>
      </div>
    </div>
  );
}

function Meta({ k, v, href }: { k: string; v: string; href?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest opacity-50">{k}</div>
      {href ? <a href={href} target="_blank" rel="noreferrer" className="hover:opacity-60">{v}</a> : <div>{v}</div>}
    </div>
  );
}