import { useEffect, useRef, useState } from "react";

/**
 * A live, scaled-down preview of one template.
 *
 * Renders the real `/templates/:id` route in an iframe at desktop width and
 * scales it into the card, rather than shipping screenshots. Screenshots go
 * stale the moment a preset changes and nobody notices until a founder picks a
 * design that no longer looks like its thumbnail; this can't drift.
 *
 * The cost is 36 iframes, so two guards apply: nothing mounts until the card
 * scrolls into view, and each frame is inert to the pointer so the whole card
 * stays a single link.
 */
const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 960;

export default function TemplateThumb({ id, title }: { id: string; title: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;

    const resize = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / DESIGN_WIDTH);
    });
    resize.observe(el);

    // rootMargin gives the frame a head start so it has usually painted by the
    // time the card is actually on screen.
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { rootMargin: "300px" },
    );
    io.observe(el);

    return () => {
      resize.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={holder}
      className="relative w-full overflow-hidden rounded-lg border bg-muted"
      style={{ aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}` }}
    >
      {visible ? (
        <iframe
          // embed=1 drops the preview banner so the thumbnail is only the design.
          src={`/templates/${id}?embed=1`}
          title={`${title} preview`}
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
          }}
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
    </div>
  );
}
