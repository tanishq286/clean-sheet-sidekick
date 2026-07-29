import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft, Briefcase, CalendarCheck, Check, Compass, Handshake, Loader2, Send, Sparkles, WandSparkles,
} from "lucide-react";
import {
  BUDGET_MAX, BUDGET_MIN, TIMELINES, formatBudget,
  type ContactIntent, type ContactPayload, type ContactSectionProps, type Timeline,
} from "./types";
import { useMagneticGlow } from "./useMagneticGlow";
import { callRpc } from "@/lib/rpc";

const INTENTS: { id: ContactIntent; label: string; icon: typeof Briefcase; blurb: string }[] = [
  { id: "project", label: "Project Inquiry", icon: Briefcase, blurb: "Hire me for a scoped piece of work" },
  { id: "role", label: "Full-Time Role", icon: Compass, blurb: "Talk about joining your team" },
  { id: "mentorship", label: "Mentorship / Advisory", icon: Handshake, blurb: "Guidance, advice or a intro" },
  { id: "hello", label: "Say Hello", icon: Sparkles, blurb: "No agenda — just reach out" },
];

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Multi-step contact experience with dark glassmorphism, a cursor-tracking
 * ambient glow, conditional fields per intent, and a celebratory success state.
 *
 * Submission strategy (no paid services required):
 *   demoMode  -> simulated success, nothing leaves the browser
 *   endpoint  -> POST JSON (webhook / EmailJS proxy / serverless function)
 *   fallback  -> opens a prefilled mailto: draft
 */
export default function ContactSection({
  name, email, slug, calendarUrl, endpoint, demoMode = false, accent = "#FF6B35",
}: ContactSectionProps) {
  const { ref, onMouseMove, onMouseLeave, glowX, glowY, glowOpacity } = useMagneticGlow();

  const [intent, setIntent] = useState<ContactIntent | null>(null);
  const [budget, setBudget] = useState<number>(3000);
  const [timeline, setTimeline] = useState<Timeline>("1-3 months");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const successRef = useRef<HTMLDivElement | null>(null);

  const isProject = intent === "project";
  const valid = useMemo(
    () => form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.message.trim().length > 4,
    [form],
  );

  const celebrate = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const shoot = (particleRatio: number, opts: confetti.Options) =>
      confetti({ origin: { y: 0.7 }, colors: [accent, "#6BCABA", "#ffffff"], disableForReducedMotion: true, particleCount: Math.floor(200 * particleRatio), ...opts });
    shoot(0.25, { spread: 26, startVelocity: 55 });
    shoot(0.2, { spread: 60 });
    shoot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !intent || status === "sending") return;

    const payload: ContactPayload = {
      intent,
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      ...(isProject ? { budget, timeline } : {}),
      toSlug: slug,
      toName: name,
      submittedAt: new Date().toISOString(),
    };

    setStatus("sending");
    setErrorMsg("");
    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 900));
      } else if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
      } else if (slug) {
        // Deliver to the founder's inbox. Previously this branch didn't exist
        // and every real submission fell through to mailto: below — which
        // opens the *visitor's* mail client and hopes they press send. That
        // silently loses anyone browsing without a mail client configured,
        // and left the founder with no record that an enquiry was attempted.
        const { error } = await callRpc("send_profile_message", {
          _slug: slug,
          _name: payload.name,
          _email: payload.email,
          _body: payload.message,
          _intent: intent,
          _budget: isProject ? budget : null,
          _timeline: isProject ? timeline : null,
        });
        if (error) throw new Error(error.message);
      } else if (email) {
        const subject = encodeURIComponent(`[${INTENTS.find((i) => i.id === intent)?.label}] from ${payload.name}`);
        const lines = [
          payload.message, "", `From: ${payload.name} <${payload.email}>`,
          ...(isProject ? [`Budget: ${formatBudget(budget)}`, `Timeline: ${timeline}`] : []),
        ];
        window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`;
      } else {
        throw new Error("No delivery method configured for this profile.");
      }
      setStatus("sent");
      celebrate();
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const reset = () => {
    setStatus("idle");
    setIntent(null);
    setForm({ name: "", email: "", message: "" });
    setErrorMsg("");
  };

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative isolate overflow-hidden bg-[#0A0B0F] px-5 py-20 sm:px-8 sm:py-28"
      style={{ ["--accent" as string]: accent }}
      aria-labelledby="contact-heading"
    >
      {/* Ambient cursor glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-10 h-[38rem] w-[38rem] rounded-full blur-[110px]"
        style={{
          left: glowX, top: glowY, opacity: glowOpacity, x: "-50%", y: "-50%",
          background: `radial-gradient(circle, ${accent}59 0%, ${accent}1a 45%, transparent 70%)`,
          willChange: "transform, opacity",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -z-10 inset-0 opacity-[0.35]"
        style={{ background: "radial-gradient(ellipse at 20% 0%, #6BCABA22, transparent 55%)" }} />

      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-xl">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: accent }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            </span>
            Available for new conversations
          </p>
          <h2 id="contact-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Get in touch{name ? <> with <span style={{ color: accent }}>{name.split(" ")[0]}</span></> : null}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
            Pick what you have in mind — the form adapts to it.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-7">
          <AnimatePresence mode="wait" initial={false}>
            {status === "sent" ? (
              <motion.div
                key="success" ref={successRef} tabIndex={-1}
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="py-6 text-center outline-none"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 16 }}
                  className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full"
                  style={{ background: `${accent}26`, border: `1px solid ${accent}59` }}
                >
                  <Check className="h-7 w-7" style={{ color: accent }} />
                </motion.div>
                <h3 className="text-xl font-semibold text-white">Message sent!</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-white/55">
                  {demoMode ? "Demo mode — nothing was actually sent." : `Thanks ${form.name.split(" ")[0] || ""}, you'll hear back soon.`}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {calendarUrl && (
                    <a href={calendarUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-black transition-transform hover:scale-[1.02]"
                      style={{ background: accent }}>
                      <CalendarCheck className="h-4 w-4" /> Book a time
                    </a>
                  )}
                  <button onClick={reset} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm text-white/80 transition-colors hover:bg-white/5">
                    Send another
                  </button>
                </div>
              </motion.div>
            ) : !intent ? (
              <motion.div key="intents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">Step 1 — What's this about?</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {INTENTS.map((it, i) => {
                    const Icon = it.icon;
                    return (
                      <motion.button
                        key={it.id} type="button" onClick={() => setIntent(it.id)}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-white/25 hover:bg-white/[0.07]"
                      >
                        <span className="absolute inset-x-0 -bottom-px h-px opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                        <Icon className="mb-2 h-4 w-4" style={{ color: accent }} />
                        <div className="text-sm font-medium text-white">{it.label}</div>
                        <div className="mt-0.5 text-xs text-white/45">{it.blurb}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setIntent(null)} className="inline-flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/70" style={{ background: `${accent}1f` }}>
                    {INTENTS.find((i) => i.id === intent)?.label}
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {isProject && (
                    <motion.div
                      key="project-extras"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }} className="space-y-5 overflow-hidden"
                    >
                      <div>
                        <div className="mb-2 flex items-baseline justify-between">
                          <label htmlFor="budget" className="text-xs font-medium uppercase tracking-wider text-white/40">Budget</label>
                          <motion.span key={budget} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-mono text-sm font-semibold" style={{ color: accent }}>
                            {formatBudget(budget)}
                          </motion.span>
                        </div>
                        <input
                          id="budget" type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={500}
                          value={budget} onChange={(e) => setBudget(Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
                          style={{ background: `linear-gradient(90deg, ${accent} ${((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%, rgba(255,255,255,0.12) ${((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%)` }}
                        />
                      </div>
                      <div>
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">Timeline</span>
                        <div className="flex flex-wrap gap-2">
                          {TIMELINES.map((t) => (
                            <button key={t} type="button" onClick={() => setTimeline(t)} aria-pressed={timeline === t}
                              className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${timeline === t ? "text-white" : "border-white/10 text-white/55 hover:border-white/25 hover:text-white"}`}
                              style={timeline === t ? { borderColor: `${accent}80`, background: `${accent}26` } : undefined}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatingField id="cs-name" label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} accent={accent} autoComplete="name" />
                  <FloatingField id="cs-email" label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} accent={accent} autoComplete="email" />
                </div>
                <FloatingField id="cs-message" label="Brief details" value={form.message} onChange={(v) => setForm({ ...form, message: v })} accent={accent} textarea />

                {status === "error" && (
                  <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{errorMsg}</p>
                )}

                <motion.button
                  type="submit" disabled={!valid || status === "sending"}
                  whileHover={valid ? { scale: 1.01 } : undefined} whileTap={valid ? { scale: 0.99 } : undefined}
                  className="relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg text-sm font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: accent }}
                >
                  {status === "sending" ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : (<><Send className="h-4 w-4" /> Send message</>)}
                </motion.button>

                {demoMode && (
                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-white/35">
                    <WandSparkles className="h-3 w-3" /> Demo mode — submissions are simulated
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/** Floating-label input with an animated focus underline. */
function FloatingField({
  id, label, value, onChange, accent, type = "text", textarea = false, autoComplete,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  accent: string; type?: string; textarea?: boolean; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  const shared = {
    id, value, autoComplete,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    className:
      "peer w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 pt-5 pb-2 text-sm text-white outline-none transition-colors placeholder:text-transparent focus:border-white/30",
    placeholder: label,
  };

  return (
    <div className="relative">
      {textarea ? <textarea rows={4} {...shared} /> : <input type={type} {...shared} />}
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3 origin-left transition-all duration-200 ${lifted ? "top-1.5 text-[10px] uppercase tracking-wider" : "top-3.5 text-sm text-white/40"}`}
        style={lifted ? { color: accent } : undefined}
      >
        {label}
      </label>
      <motion.span
        aria-hidden className="absolute inset-x-3 bottom-0 h-px origin-left"
        style={{ background: accent }}
        initial={false} animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />
    </div>
  );
}
