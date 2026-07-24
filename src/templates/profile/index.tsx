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

// LinkedIn-inspired profile: cover banner, avatar, ventures grid, journey, skills.
export default function ProfileTemplate({ profile }: TemplateProps) {
  const { identity, founder, vision, contact, looking_for, skills, milestones, portfolio, theme } = profile;
  const ventures = [
    founder.current_venture
      ? { name: founder.current_venture, industry: founder.industry, stage: founder.stage, problem: founder.problem, mission: founder.mission, primary: true }
      : null,
    ...((founder.additional_ventures ?? []).map((v) => ({ ...v, primary: false }))),
  ].filter(Boolean) as Array<VentureCard>;

  return (
    <div style={themeStyle(theme)} className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="max-w-5xl mx-auto pb-20">
        {/* Cover + avatar card */}
        <div className="bg-white shadow-sm rounded-b-2xl overflow-hidden border border-neutral-200">
          <div className="relative h-48 md:h-64 w-full">
            {identity.cover_url ? (
              <img src={identity.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, var(--accent), #111827)` }} />
            )}
          </div>
          <div className="px-6 md:px-10 pb-8 -mt-16 md:-mt-20">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {identity.photo_url ? (
                <img src={identity.photo_url} alt={identity.name}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-white shadow-lg" />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ring-white shadow-lg bg-neutral-200 flex items-center justify-center text-4xl font-bold text-neutral-400">
                  {(identity.name ?? "?").charAt(0)}
                </div>
              )}
            </motion.div>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{identity.name ?? "Your Name"}</h1>
                {identity.headline && <p className="mt-1 text-lg text-neutral-700">{identity.headline}</p>}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-500">
                  {identity.location && <span>📍 {identity.location}</span>}
                  {identity.college && <span>🎓 {identity.college}{identity.graduation ? ` · ${identity.graduation}` : ""}</span>}
                  {founder.stage && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
                      ● {STAGE_LABEL[founder.stage]}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="px-4 py-2 rounded-full text-sm font-semibold text-white shadow"
                    style={{ backgroundColor: "var(--accent)" }}>Get in touch</a>
                )}
                {identity.linkedin && (
                  <a href={identity.linkedin} target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-neutral-300 hover:bg-neutral-50">LinkedIn</a>
                )}
                {identity.website && (
                  <a href={identity.website} target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-neutral-300 hover:bg-neutral-50">Website</a>
                )}
              </div>
            </div>
            {identity.bio && (
              <p className="mt-6 text-base leading-relaxed text-neutral-700 max-w-3xl">{identity.bio}</p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6 px-2">
          <div className="lg:col-span-2 space-y-6">
            {/* Ventures */}
            {ventures.length > 0 && (
              <Card title="Ventures" badge={`${ventures.length}`}>
                <div className="grid sm:grid-cols-2 gap-4">
                  {ventures.map((v, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                      className="relative rounded-xl border border-neutral-200 p-5 hover:shadow-md transition bg-white">
                      {v.primary && (
                        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: "var(--accent)", color: "white" }}>Current</span>
                      )}
                      <div className="text-xl font-bold leading-tight">{v.name || "Untitled venture"}</div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                        {[v.industry, v.stage ? STAGE_LABEL[v.stage] : null].filter(Boolean).join(" · ")}
                      </div>
                      {v.problem && <p className="mt-3 text-sm text-neutral-700 leading-relaxed line-clamp-4">{v.problem}</p>}
                      {v.mission && <p className="mt-3 text-sm italic text-neutral-600 border-l-2 pl-3" style={{ borderColor: "var(--accent)" }}>"{v.mission}"</p>}
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {(vision.problem_solving || vision.why_it_matters) && (
              <Card title="Vision">
                <div className="space-y-4">
                  {vision.problem_solving && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Problem I'm solving</div>
                      <p className="text-neutral-800 leading-relaxed">{vision.problem_solving}</p>
                    </div>
                  )}
                  {vision.why_it_matters && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Why it matters</div>
                      <p className="text-neutral-800 leading-relaxed">{vision.why_it_matters}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {milestones.length > 0 && (
              <Card title="Journey">
                <ol className="space-y-5">
                  {milestones.map((m) => (
                    <li key={m.id} className="grid grid-cols-[64px_1fr] gap-4">
                      <div className="text-sm font-bold tabular-nums pt-0.5" style={{ color: "var(--accent)" }}>{m.year}</div>
                      <div className="border-l-2 border-neutral-200 pl-4 -ml-2">
                        <div className="font-semibold">{m.title}</div>
                        {m.description && <p className="text-sm text-neutral-600 leading-relaxed mt-1">{m.description}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            {portfolio.length > 0 && (
              <Card title="Featured work">
                <div className="grid sm:grid-cols-2 gap-3">
                  {portfolio.map((p) => (
                    <a key={p.id} href={p.url ?? p.file_url ?? "#"} target="_blank" rel="noreferrer"
                      className="block rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 hover:shadow-sm transition group">
                      <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--accent)" }}>
                        {PORTFOLIO_LABEL[p.kind]}
                      </div>
                      <div className="font-semibold leading-snug group-hover:underline">{p.title}</div>
                      {p.description && <p className="text-sm text-neutral-600 mt-2 line-clamp-3">{p.description}</p>}
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            {skills.length > 0 && (
              <Card title="Skills">
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s.id} className="px-3 py-1 rounded-full text-xs font-medium border"
                      style={{ borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)", color: "var(--accent)" }}>
                      {SKILL_LABEL[s.tag] ?? s.tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}
            {looking_for.length > 0 && (
              <Card title="Open to">
                <ul className="space-y-2">
                  {looking_for.map((l) => (
                    <li key={l} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                      {LOOKING_LABEL[l] ?? l}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card title="Contact">
              <ul className="text-sm space-y-2">
                {contact.email && <li><span className="text-neutral-500 w-20 inline-block">Email</span><a className="hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></li>}
                {contact.phone && <li><span className="text-neutral-500 w-20 inline-block">Phone</span>{contact.phone}</li>}
                {contact.twitter && <li><span className="text-neutral-500 w-20 inline-block">Twitter</span>{contact.twitter}</li>}
                {identity.website && <li><span className="text-neutral-500 w-20 inline-block">Web</span><a className="hover:underline" href={identity.website} target="_blank" rel="noreferrer">{identity.website.replace(/^https?:\/\//, "")}</a></li>}
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Card({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 md:p-7">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {badge && <span className="text-xs font-semibold text-neutral-500">{badge}</span>}
      </div>
      {children}
    </section>
  );
}