import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Milestone } from "@/types/founder";
import Counter from "@/components/Counter";
import { playClickSound, playHoverSound, playOpenSound } from "@/lib/audio";

interface MilestonesProps {
  milestones: Milestone[];
  /** Heading shown above the timeline. */
  title?: string;
  /** Templates that render their own section heading pass false. */
  showHeader?: boolean;
  className?: string;
}

/**
 * Interactive journey timeline.
 *
 * Each milestone is a button; activating it expands an inline detail panel via
 * AnimatePresence. Only one is open at a time — a second tap on the open card
 * collapses it, so the control is a genuine toggle rather than a one-way door.
 *
 * Every badge here is derived from data that actually exists on the row
 * (year, description, position). Nothing invents a verification state: a
 * public profile must not display a status the database cannot back up.
 */
export default function Milestones({ milestones, title = "Journey", showHeader = true, className = "" }: MilestonesProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  if (milestones.length === 0) return null;

  // Rows arrive ordered by order_index; the last one is the most recent step.
  const latestId = milestones[milestones.length - 1]?.id;

  const toggle = (id: string) => {
    const opening = openId !== id;
    setOpenId(opening ? id : null);
    if (opening) playOpenSound();
    else playClickSound();
  };

  return (
    <section className={`relative ${className}`} aria-label={title}>
      {/* Decorative wash. pointer-events-none is load-bearing: without it this
          layer sits above the timeline and silently eats every click. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -top-8 h-40 opacity-[0.18] blur-3xl"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, var(--accent) 0%, transparent 70%)" }}
      />

      <header
        className={`relative z-10 mb-6 flex items-end gap-4 ${showHeader ? "justify-between" : "justify-end"}`}
      >
        {showHeader && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
        <div className="text-sm opacity-60 tabular-nums">
          <Counter value={milestones.length} className="font-semibold opacity-100" />
          {milestones.length === 1 ? " milestone" : " milestones"}
        </div>
      </header>

      <ol className="relative z-10 space-y-3">
        {/* Connector rail, behind the nodes and inert to the pointer. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[11px] top-2 bottom-2 w-px"
          style={{ background: "linear-gradient(to bottom, var(--accent), transparent)" }}
        />

        {milestones.map((m) => {
          const isOpen = openId === m.id;
          const hasDetail = Boolean(m.description);
          const panelId = `milestone-panel-${m.id}`;

          return (
            <li key={m.id} className="relative pl-9">
              {/* Node. Glows brighter while its card is open. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-4 grid h-6 w-6 place-items-center"
              >
                <motion.span
                  className="block rounded-full"
                  animate={
                    reduceMotion
                      ? undefined
                      : { scale: isOpen ? 1.35 : 1, opacity: isOpen ? 1 : 0.75 }
                  }
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: "var(--accent)",
                    boxShadow: isOpen ? "0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent)" : "none",
                  }}
                />
              </span>

              <motion.div layout={!reduceMotion} className="rounded-xl border border-current/15 bg-current/[0.04] backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  onPointerEnter={playHoverSound}
                  aria-expanded={isOpen}
                  aria-controls={hasDetail ? panelId : undefined}
                  className="pointer-events-auto relative z-10 flex w-full items-start gap-3 rounded-xl p-4 text-left transition hover:bg-current/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
                >
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      {m.year && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                          style={{
                            color: "var(--accent)",
                            backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)",
                          }}
                        >
                          {m.year}
                        </span>
                      )}
                      {m.id === latestId && (
                        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[11px] font-medium opacity-60">
                          Latest
                        </span>
                      )}
                      {hasDetail && (
                        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[11px] font-medium opacity-60">
                          Details
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block font-medium leading-snug">{m.title}</span>
                  </span>

                  {hasDetail && (
                    <motion.span
                      aria-hidden="true"
                      className="mt-1 shrink-0 opacity-50"
                      animate={reduceMotion ? undefined : { rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ⌄
                    </motion.span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && hasDetail && (
                    <motion.div
                      id={panelId}
                      key="panel"
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-current/15 px-4 py-3 text-sm leading-relaxed opacity-75">
                        {m.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
