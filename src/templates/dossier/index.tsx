import type { TemplateProps } from "../types";
import { themeStyle, STAGE_LABEL, LOOKING_LABEL, SKILL_LABEL, PORTFOLIO_LABEL } from "../shared/themeStyle";

export default function DossierTemplate({ profile }: TemplateProps) {
  const { identity, founder, vision, contact, looking_for, skills, milestones, portfolio, theme } = profile;
  const docId = profile.slug.toUpperCase().slice(0, 8);
  const date = new Date().toISOString().slice(0, 10);

  return (
    <div style={themeStyle(theme)} className="min-h-screen bg-[#ececea] text-neutral-900 font-['JetBrains_Mono'] text-[13px]">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        {/* CLASSIFIED HEADER STRIP */}
        <div className="bg-neutral-900 text-[#ececea] px-5 py-3 flex flex-wrap justify-between items-center gap-2 text-[10px] uppercase tracking-[0.25em]">
          <span>Founder Dossier · {docId}</span>
          <span style={{ color: "var(--accent)" }}>● {founder.stage ? STAGE_LABEL[founder.stage] : "Stage Unspecified"}</span>
          <span>Issued {date}</span>
        </div>

        <div className="bg-white border border-neutral-900/20 border-t-0 grid md:grid-cols-12">
          {/* SUBJECT PANEL */}
          <aside className="md:col-span-4 p-6 md:p-8 border-b md:border-b-0 md:border-r border-neutral-900/15 space-y-6 bg-[#f7f6f3]">
            {identity.photo_url ? (
              <div className="relative">
                <img src={identity.photo_url} alt={identity.name} className="w-full aspect-square object-cover grayscale border border-neutral-900/30" />
                <div className="absolute top-2 left-2 text-[9px] uppercase tracking-widest bg-white/90 px-2 py-0.5">SUBJECT 01</div>
                <div className="absolute bottom-2 right-2 text-[9px] uppercase tracking-widest bg-white/90 px-2 py-0.5" style={{ color: "var(--accent)" }}>● REC</div>
              </div>
            ) : (
              <div className="w-full aspect-square border-2 border-dashed border-neutral-300 flex items-center justify-center text-[10px] uppercase text-neutral-400">No photograph</div>
            )}

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] opacity-60 mb-1">Subject Name</div>
              <div className="text-xl font-bold tracking-tight">{identity.name ?? "Unnamed Founder"}</div>
            </div>

            <dl className="space-y-2 text-xs">
              <Field label="Location" v={identity.location} />
              <Field label="Institution" v={identity.college} />
              <Field label="Class" v={identity.graduation} />
              <Field label="Industry" v={founder.industry} />
            </dl>

            <div className="pt-4 border-t border-neutral-900/15 space-y-2 text-xs">
              <div className="text-[10px] uppercase tracking-[0.25em] opacity-60 mb-2">Contact Channels</div>
              <Field label="Email" v={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} />
              <Field label="Phone" v={contact.phone} href={contact.phone ? `tel:${contact.phone}` : undefined} />
              <Field label="Website" v={identity.website?.replace(/^https?:\/\//, "")} href={identity.website} />
              <Field label="LinkedIn" v={identity.linkedin ? "Profile" : undefined} href={identity.linkedin} />
            </div>
          </aside>

          {/* BRIEF */}
          <main className="md:col-span-8 p-6 md:p-10 space-y-10">
            <Block n="01" title="Executive Brief">
              <div className="text-2xl font-bold leading-tight tracking-tight font-sans mb-2">{founder.current_venture ?? "Untitled Venture"}</div>
              {identity.bio && <p className="leading-relaxed opacity-90">{identity.bio}</p>}
            </Block>

            <Block n="02" title="Problem / Mission">
              <Row k="Problem" v={founder.problem} />
              <Row k="Mission" v={founder.mission} />
              <Row k="Solving" v={vision.problem_solving} />
              <Row k="Why" v={vision.why_it_matters} />
            </Block>

            <Block n="03" title="Capabilities">
              <div className="flex flex-wrap gap-1 mt-1">
                {skills.length === 0 && <span className="opacity-50">— None declared</span>}
                {skills.map((s) => (
                  <span key={s.id} className="text-[11px] px-2 py-0.5 border border-neutral-900/40 bg-white">
                    {SKILL_LABEL[s.tag] ?? s.tag}
                  </span>
                ))}
              </div>
            </Block>

            <Block n="04" title="Requesting">
              <ul className="grid grid-cols-2 gap-y-1 gap-x-6">
                {looking_for.length === 0 && <li className="opacity-50">— None specified</li>}
                {looking_for.map((l) => (
                  <li key={l} className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-neutral-900 inline-flex items-center justify-center text-[10px]" style={{ color: "var(--accent)" }}>✓</span>
                    {LOOKING_LABEL[l] ?? l}
                  </li>
                ))}
              </ul>
            </Block>

            {milestones.length > 0 && (
              <Block n="05" title="Chronology">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-widest opacity-60">
                    <tr className="border-b border-neutral-900/30">
                      <th className="text-left py-1 w-16">Year</th>
                      <th className="text-left py-1">Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((m, i) => (
                      <tr key={m.id} className="border-b border-neutral-900/10 align-top">
                        <td className="py-2 pr-4 tabular-nums" style={{ color: "var(--accent)" }}>{m.year}</td>
                        <td className="py-2">
                          <div className="font-semibold">{String(i + 1).padStart(2, "0")} · {m.title}</div>
                          {m.description && <div className="opacity-70 mt-0.5">{m.description}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Block>
            )}

            {portfolio.length > 0 && (
              <Block n="06" title="Attachments">
                <ul className="space-y-1.5">
                  {portfolio.map((p, i) => (
                    <li key={p.id} className="flex items-start gap-3 border-b border-dotted border-neutral-900/20 pb-1.5">
                      <span className="opacity-50 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-60 w-32 shrink-0 pt-0.5">[{PORTFOLIO_LABEL[p.kind]}]</span>
                      <a className="flex-1 underline-offset-2 hover:underline" style={{ color: "var(--accent)" }} href={p.url ?? p.file_url ?? "#"} target="_blank" rel="noreferrer">
                        {p.title}
                      </a>
                      <span className="opacity-40">↗</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </main>
        </div>

        {/* FOOTER STAMP */}
        <div className="mt-4 flex flex-wrap justify-between items-center gap-2 text-[10px] uppercase tracking-[0.25em] opacity-60">
          <span>End of dossier</span>
          <span style={{ color: "var(--accent)" }}>// Verified</span>
          <span>Page 01 / 01</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, href }: { label: string; v?: string; href?: string }) {
  if (!v) return null;
  return (
    <div className="flex justify-between gap-3 border-b border-dotted border-neutral-900/20 pb-1">
      <dt className="text-[10px] uppercase tracking-widest opacity-60 self-center shrink-0">{label}</dt>
      <dd className="text-right truncate">{href ? <a className="underline-offset-2 hover:underline" href={href} target="_blank" rel="noreferrer">{v}</a> : v}</dd>
    </div>
  );
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3 pb-1 border-b border-neutral-900/30">
        <span className="text-[10px] tabular-nums px-1.5 py-0.5 bg-neutral-900 text-white">§ {n}</span>
        <h3 className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 text-xs">
      <span className="text-[10px] uppercase tracking-widest opacity-60 pt-0.5">{k}</span>
      <p className="leading-relaxed">{v}</p>
    </div>
  );
}