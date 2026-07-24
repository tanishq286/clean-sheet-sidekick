import type { TemplateProps } from "../types";
import { motion } from "framer-motion";
import { themeStyle, STAGE_LABEL, LOOKING_LABEL, SKILL_LABEL, PORTFOLIO_LABEL } from "../shared/themeStyle";

type VentureCard = {
  name?: string | null;
  industry?: string | null;
  stage?: string | null;
  problem?: string | null;
  mission?: string | null;
  primary: boolean;
  [key: string]: unknown;
};

// Cinematic showcase: full-bleed cover, large portrait, venture cards as gallery.
export default function ShowcaseTemplate({ profile }: TemplateProps) {
  const { identity, founder, vision, contact, looking_for, skills, milestones, portfolio, theme } = profile;
  const ventures = [
    founder.current_venture
      ? { name: founder.current_venture, industry: founder.industry, stage: founder.stage, problem: founder.problem, mission: founder.mission, primary: true }
      : null,
    ...((founder.additional_ventures ?? []).map((v) => ({ ...v, primary: false }))),
  ].filter(Boolean) as Array<VentureCard>;

  return (
    <div style={themeStyle(theme)} className="min-h-screen bg-[#0b0b0d] text-neutral-100">
      {/* Cinematic hero */}
      <section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
        {identity.cover_url ? (
          <img src={identity.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 30%, var(--accent), #0b0b0d 70%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d]/40 to-transparent" />

        <div className="relative h-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-16">
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-end">
            {identity.photo_url && (
              <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
                src={identity.photo_url} alt={identity.name}
                className="w-32 h-40 md:w-44 md:h-56 object-cover rounded-md shadow-2xl ring-1 ring-white/20" />
            )}
            <div>
              <div className="text-xs uppercase tracking-[0.4em] mb-4" style={{ color: "var(--accent)" }}>
                {founder.stage ? STAGE_LABEL[founder.stage] : "Founder"} {identity.location ? `· ${identity.location}` : ""}
              </div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                className="text-[clamp(3rem,10vw,9rem)] font-black leading-[0.9] tracking-tight">
                {identity.name ?? "Your Name"}
              </motion.h1>
              {identity.headline && <p className="mt-4 text-xl md:text-2xl text-neutral-300 max-w-2xl">{identity.headline}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 space-y-24">
        {identity.bio && (
          <section className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.4em] mb-4" style={{ color: "var(--accent)" }}>About</div>
            <p className="text-2xl leading-snug text-neutral-200">{identity.bio}</p>
          </section>
        )}

        {ventures.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <div className="text-xs uppercase tracking-[0.4em] mb-2" style={{ color: "var(--accent)" }}>Ventures</div>
                <h2 className="text-4xl md:text-5xl font-black">What I'm building</h2>
              </div>
              <span className="text-sm text-neutral-500">{ventures.length} {ventures.length === 1 ? "venture" : "ventures"}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-white/10 border border-white/10">
              {ventures.map((v, i) => (
                <motion.article key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="bg-[#0b0b0d] p-8 md:p-10 relative group hover:bg-[#15151a] transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Venture {String(i + 1).padStart(2, "0")}
                    </div>
                    {v.primary && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "var(--accent)", color: "#0b0b0d" }}>Current</span>}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black leading-tight">{v.name || "Untitled"}</h3>
                  <div className="mt-2 text-sm uppercase tracking-wider text-neutral-400">
                    {[v.industry, v.stage ? STAGE_LABEL[v.stage] : null].filter(Boolean).join(" · ")}
                  </div>
                  {v.problem && <p className="mt-6 text-neutral-300 leading-relaxed">{v.problem}</p>}
                  {v.mission && (
                    <p className="mt-6 text-lg italic border-l-2 pl-4" style={{ borderColor: "var(--accent)" }}>"{v.mission}"</p>
                  )}
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {(vision.problem_solving || vision.why_it_matters) && (
          <section className="grid md:grid-cols-2 gap-12 py-12 border-y border-white/10">
            {vision.problem_solving && (
              <div>
                <div className="text-xs uppercase tracking-[0.4em] mb-3" style={{ color: "var(--accent)" }}>The problem</div>
                <p className="text-2xl leading-snug">{vision.problem_solving}</p>
              </div>
            )}
            {vision.why_it_matters && (
              <div>
                <div className="text-xs uppercase tracking-[0.4em] mb-3" style={{ color: "var(--accent)" }}>Why it matters</div>
                <p className="text-2xl leading-snug">{vision.why_it_matters}</p>
              </div>
            )}
          </section>
        )}

        {milestones.length > 0 && (
          <section>
            <div className="text-xs uppercase tracking-[0.4em] mb-3" style={{ color: "var(--accent)" }}>Journey</div>
            <h2 className="text-4xl md:text-5xl font-black mb-10">How I got here</h2>
            <ol className="space-y-0">
              {milestones.map((m, i) => (
                <motion.li key={m.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="grid md:grid-cols-[120px_1fr] gap-6 py-6 border-t border-white/10 last:border-b">
                  <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>{m.year}</div>
                  <div>
                    <div className="text-xl font-semibold mb-1">{m.title}</div>
                    {m.description && <p className="text-neutral-400 leading-relaxed">{m.description}</p>}
                  </div>
                </motion.li>
              ))}
            </ol>
          </section>
        )}

        <section className="grid md:grid-cols-2 gap-12">
          {skills.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-[0.4em] mb-4" style={{ color: "var(--accent)" }}>Toolkit</div>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s.id} className="px-3 py-1.5 text-sm rounded-full border border-white/20 hover:border-white/60 transition">
                    {SKILL_LABEL[s.tag] ?? s.tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {looking_for.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-[0.4em] mb-4" style={{ color: "var(--accent)" }}>Open to</div>
              <ul className="space-y-2 text-lg">
                {looking_for.map((l) => <li key={l} className="flex items-center gap-3"><span style={{ color: "var(--accent)" }}>→</span>{LOOKING_LABEL[l] ?? l}</li>)}
              </ul>
            </div>
          )}
        </section>

        {portfolio.length > 0 && (
          <section>
            <div className="text-xs uppercase tracking-[0.4em] mb-3" style={{ color: "var(--accent)" }}>Selected work</div>
            <h2 className="text-4xl md:text-5xl font-black mb-10">Portfolio</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map((p) => (
                <a key={p.id} href={p.url ?? p.file_url ?? "#"} target="_blank" rel="noreferrer"
                  className="group block p-6 border border-white/10 hover:border-white/60 hover:bg-white/5 transition min-h-[180px]">
                  <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>{PORTFOLIO_LABEL[p.kind]}</div>
                  <div className="text-2xl font-bold leading-tight group-hover:underline">{p.title}</div>
                  {p.description && <p className="mt-3 text-sm text-neutral-400 leading-relaxed line-clamp-4">{p.description}</p>}
                </a>
              ))}
            </div>
          </section>
        )}

        <footer className="pt-12 border-t border-white/10">
          <div className="text-5xl md:text-7xl font-black leading-[0.95]">
            Let's <span style={{ color: "var(--accent)" }}>connect.</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            {contact.email && <a href={`mailto:${contact.email}`} className="px-5 py-2.5 rounded-full font-semibold" style={{ backgroundColor: "var(--accent)", color: "#0b0b0d" }}>{contact.email}</a>}
            {identity.linkedin && <a href={identity.linkedin} className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10">LinkedIn</a>}
            {identity.website && <a href={identity.website} className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10">Website</a>}
          </div>
        </footer>
      </div>
    </div>
  );
}