import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PortfolioItem, PortfolioKind } from "@/types/founder";
import { PORTFOLIO_LABEL } from "@/templates/shared/themeStyle";
import Counter from "@/components/Counter";
import TiltCard from "./TiltCard";
import { playClickSound, playHoverSound, playOpenSound } from "@/lib/audio";

interface PortfolioProps {
  portfolio: PortfolioItem[];
  title?: string;
  /** Templates that render their own section heading pass false. */
  showHeader?: boolean;
  className?: string;
}

const linkOf = (item: PortfolioItem) => item.url ?? item.file_url ?? null;

/**
 * Spatial portfolio showcase: category filters, fluid re-layout, tilt on hover
 * and a slide-over drawer with the full record.
 *
 * The filters are built from the kinds actually present in the data rather than
 * a fixed list, so a founder with only decks never sees an empty "Awards" pill.
 */
export default function Portfolio({ portfolio, title = "Work", showHeader = true, className = "" }: PortfolioProps) {
  const [filter, setFilter] = useState<PortfolioKind | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const kinds = useMemo(() => {
    const seen = new Set<PortfolioKind>();
    for (const p of portfolio) seen.add(p.kind);
    return [...seen];
  }, [portfolio]);

  const visible = useMemo(
    () => (filter === "all" ? portfolio : portfolio.filter((p) => p.kind === filter)),
    [portfolio, filter],
  );

  const open = openId ? (portfolio.find((p) => p.id === openId) ?? null) : null;

  // Escape closes the drawer, and the page behind it must not scroll while it
  // is up. Both are restored on unmount so a route change can't strand them.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (portfolio.length === 0) return null;

  const selectFilter = (next: PortfolioKind | "all") => {
    setFilter(next);
    playClickSound();
  };

  return (
    <section className={`relative ${className}`} aria-label={title}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -top-10 h-44 opacity-[0.16] blur-3xl"
        style={{ background: "radial-gradient(60% 100% at 30% 0%, var(--accent) 0%, transparent 70%)" }}
      />

      <header
        className={`relative z-10 mb-5 flex items-end gap-4 ${showHeader ? "justify-between" : "justify-end"}`}
      >
        {showHeader && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
        <div className="text-sm opacity-60 tabular-nums">
          <Counter value={visible.length} className="font-semibold opacity-100" />
          {visible.length === 1 ? " item" : " items"}
        </div>
      </header>

      {/* Only worth showing when there is more than one kind to switch between. */}
      {kinds.length > 1 && (
        <div className="relative z-10 mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          {(["all", ...kinds] as const).map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => selectFilter(k as PortfolioKind | "all")}
                onPointerEnter={playHoverSound}
                aria-pressed={active}
                className="pointer-events-auto relative z-10 rounded-full border border-current/20 px-3.5 py-1.5 text-sm transition hover:bg-current/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
                style={
                  active
                    ? {
                        color: "var(--accent)",
                        borderColor: "var(--accent)",
                        backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      }
                    : undefined
                }
              >
                {k === "all" ? "All" : (PORTFOLIO_LABEL[k] ?? k)}
              </button>
            );
          })}
        </div>
      )}

      <motion.ul layout={!reduceMotion} className="relative z-10 grid gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((item) => {
            const href = linkOf(item);
            return (
              <motion.li
                key={item.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              >
                <TiltCard className="h-full">
                  <div className="group flex h-full flex-col rounded-2xl border border-current/15 bg-current/[0.04] p-5 backdrop-blur-sm transition hover:border-current/30">
                    <span
                      className="mb-2 w-fit rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
                      style={{
                        color: "var(--accent)",
                        backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      }}
                    >
                      {PORTFOLIO_LABEL[item.kind] ?? item.kind}
                    </span>

                    <h3 className="font-medium leading-snug">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1.5 line-clamp-3 text-sm opacity-70">{item.description}</p>
                    )}

                    <div className="mt-4 flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenId(item.id);
                          playOpenSound();
                        }}
                        onPointerEnter={playHoverSound}
                        className="pointer-events-auto relative z-10 rounded-lg border border-current/20 px-3 py-1.5 text-sm transition hover:bg-current/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
                      >
                        View details
                      </button>

                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          // Without stopPropagation the click also reaches the
                          // tilt wrapper's handler and opens the drawer behind
                          // the newly opened tab.
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                          }}
                          className="pointer-events-auto relative z-10 rounded-lg px-3 py-1.5 text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
                          style={{ color: "var(--accent)" }}
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                  </div>
                </TiltCard>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpenId(null)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label={open.title}
              initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              // text-foreground is mandatory, not decorative: the drawer is
              // position:fixed on an opaque background but still inherits
              // `color` from the template that rendered it. Showcase sets
              // text-neutral-100, which put white text on a white panel.
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l bg-background p-6 text-foreground shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide"
                  style={{
                    color: "var(--accent)",
                    backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  }}
                >
                  {PORTFOLIO_LABEL[open.kind] ?? open.kind}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    playClickSound();
                  }}
                  aria-label="Close"
                  autoFocus
                  className="pointer-events-auto relative z-10 rounded-lg border px-2.5 py-1 text-sm transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-semibold leading-tight">{open.title}</h3>

              {open.description ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {open.description}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-muted-foreground">No description added yet.</p>
              )}

              {linkOf(open) && (
                <a
                  href={linkOf(open)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={playClickSound}
                  className="mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Open live ↗
                </a>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
