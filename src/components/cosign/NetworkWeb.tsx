import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { RELATIONSHIP_LABEL, type ProfileCoSign } from "@/lib/cosign";

/**
 * The co-sign web: this founder at the centre, their verified peers around it.
 *
 * Plain SVG on a fixed 0..100 viewBox with `preserveAspectRatio`, so it scales
 * to any template width without measuring anything — no canvas, no layout
 * library, no resize listeners. Peers are placed on a circle by index, which
 * is stable across renders: a force simulation would look livelier and would
 * also move every node whenever one was added, which is worse for something
 * people scan for a specific name.
 */
const SIZE = 100;
const CENTRE = SIZE / 2;
const RADIUS = 34;

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function NetworkWeb({
  cosigns, centreName, centrePhoto, accent = "#FF6B35",
}: {
  cosigns: ProfileCoSign[];
  centreName: string;
  centrePhoto?: string | null;
  accent?: string;
}) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  // One node per peer. The same person vouching for two projects is one
  // relationship, not two nodes — showing them twice would overstate the
  // size of the network, which is the one thing this graphic asserts.
  const nodes = useMemo(() => {
    const seen = new Map<string, ProfileCoSign>();
    for (const c of cosigns) if (!seen.has(c.peer_slug)) seen.set(c.peer_slug, c);
    const list = [...seen.values()];
    return list.map((c, i) => {
      // Start at the top and go clockwise; the -90° offset keeps a single
      // node directly above the centre rather than out to the right.
      const angle = (i / Math.max(list.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        cosign: c,
        x: CENTRE + Math.cos(angle) * RADIUS,
        y: CENTRE + Math.sin(angle) * RADIUS,
        projects: cosigns.filter((o) => o.peer_slug === c.peer_slug),
      };
    });
  }, [cosigns]);

  if (nodes.length === 0) return null;

  const active = nodes.find((n) => n.cosign.peer_slug === hovered);

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-8 text-center">
        <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.25em] opacity-60">
          Co-Sign Network
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Verified by {nodes.length} {nodes.length === 1 ? "peer" : "peers"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm opacity-70">
          People who worked with {centreName} and vouched for it. Each one accepted the
          endorsement themselves.
        </p>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mx-auto block h-auto w-full max-w-md overflow-visible"
          role="img"
          aria-label={`${centreName} is co-signed by ${nodes.map((n) => n.cosign.peer_name).join(", ")}`}
        >
          {nodes.map((n, i) => (
            <motion.line
              key={`line-${n.cosign.peer_slug}`}
              x1={CENTRE} y1={CENTRE} x2={n.x} y2={n.y}
              stroke="currentColor"
              strokeWidth={hovered === n.cosign.peer_slug ? 0.6 : 0.3}
              className="transition-[stroke-width]"
              opacity={hovered && hovered !== n.cosign.peer_slug ? 0.12 : 0.35}
              initial={reduce ? false : { pathLength: 0 }}
              whileInView={reduce ? undefined : { pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
            />
          ))}

          {/* Centre */}
          <circle cx={CENTRE} cy={CENTRE} r="9" fill={accent} opacity="0.14" />
          {centrePhoto ? (
            <>
              <clipPath id="cosign-centre-clip">
                <circle cx={CENTRE} cy={CENTRE} r="7" />
              </clipPath>
              <image
                href={centrePhoto} x={CENTRE - 7} y={CENTRE - 7} width="14" height="14"
                clipPath="url(#cosign-centre-clip)" preserveAspectRatio="xMidYMid slice"
              />
            </>
          ) : (
            <>
              <circle cx={CENTRE} cy={CENTRE} r="7" fill={accent} opacity="0.9" />
              <text
                x={CENTRE} y={CENTRE} textAnchor="middle" dominantBaseline="central"
                fontSize="4.5" fontWeight="700" fill="#fff"
              >
                {initials(centreName)}
              </text>
            </>
          )}

          {nodes.map((n, i) => {
            const dim = hovered !== null && hovered !== n.cosign.peer_slug;
            return (
              // Dimming is a CSS class rather than a motion value: the
              // entrance animation runs once via whileInView, and animating
              // opacity from two sources would have them fight on hover.
              <a
                key={n.cosign.peer_slug}
                href={`/u/${n.cosign.peer_slug}`}
                aria-label={`${n.cosign.peer_name} — ${RELATIONSHIP_LABEL[n.cosign.relationship_type]}`}
                onMouseEnter={() => setHovered(n.cosign.peer_slug)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(n.cosign.peer_slug)}
                onBlur={() => setHovered(null)}
                className={`cursor-pointer outline-none transition-opacity ${dim ? "opacity-40" : "opacity-100"}`}
              >
              <motion.g
                initial={reduce ? false : { opacity: 0, scale: 0.5 }}
                whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.2 + i * 0.06 }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              >
                <circle cx={n.x} cy={n.y} r="6.5" fill="currentColor" opacity="0.06" />
                {n.cosign.peer_photo_url ? (
                  <>
                    <clipPath id={`clip-${n.cosign.peer_slug}`}>
                      <circle cx={n.x} cy={n.y} r="5" />
                    </clipPath>
                    <image
                      href={n.cosign.peer_photo_url} x={n.x - 5} y={n.y - 5} width="10" height="10"
                      clipPath={`url(#clip-${n.cosign.peer_slug})`} preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <>
                    <circle cx={n.x} cy={n.y} r="5" fill="currentColor" opacity="0.14" />
                    <text
                      x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                      fontSize="3.4" fontWeight="700" fill="currentColor"
                    >
                      {initials(n.cosign.peer_name)}
                    </text>
                  </>
                )}
                <circle
                  cx={n.x} cy={n.y} r="5"
                  fill="none" stroke={accent}
                  strokeWidth={hovered === n.cosign.peer_slug ? 0.7 : 0.35}
                  opacity={hovered === n.cosign.peer_slug ? 1 : 0.5}
                />
              </motion.g>
              </a>
            );
          })}
        </svg>

        {/* Hovercard. Rendered in normal flow beneath the graph rather than
            floating: an absolutely-positioned card would need collision
            handling against 36 different template layouts, and on a phone
            there is nowhere for it to float to anyway. */}
        <div className="mt-6 min-h-[104px]">
          {active ? (
            <a
              href={`/u/${active.cosign.peer_slug}`}
              className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-current/15 bg-current/[0.04] p-4 transition hover:bg-current/[0.07]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-current/10 text-sm font-bold">
                {active.cosign.peer_photo_url ? (
                  <img src={active.cosign.peer_photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(active.cosign.peer_name)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{active.cosign.peer_name}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-current/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide opacity-70">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {RELATIONSHIP_LABEL[active.cosign.relationship_type]}
                  </span>
                </span>
                {active.cosign.peer_headline && (
                  <span className="mt-0.5 block text-sm opacity-70">{active.cosign.peer_headline}</span>
                )}
                <span className="mt-1.5 block text-xs opacity-60">
                  {active.projects.map((p) => p.project_title).filter(Boolean).join(" · ") || "Co-signed work"}
                </span>
                {active.cosign.note && (
                  <span className="mt-2 block border-l-2 border-current/20 pl-2.5 text-sm italic opacity-80">
                    “{active.cosign.note}”
                  </span>
                )}
              </span>
            </a>
          ) : (
            <p className="text-center text-xs opacity-50">
              Hover or focus a node to see who they are — click to open their profile.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
