import { useCallback, useRef } from "react";
import { useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";

interface MagneticGlow {
  ref: React.RefObject<HTMLDivElement | null>;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  /** Ready-to-spread style for the ambient glow layer. */
  glowX: MotionValue<string>;
  glowY: MotionValue<string>;
  glowOpacity: MotionValue<number>;
}

/**
 * Ambient neon glow that trails the cursor with a spring, plus a subtle
 * parallax. Uses motion values (not React state) so pointer movement never
 * triggers a re-render — this is what keeps it at 60fps.
 *
 * Respects prefers-reduced-motion by damping the spring to an instant settle.
 */
export function useMagneticGlow(): MagneticGlow {
  const ref = useRef<HTMLDivElement | null>(null);

  const reduced =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const spring = reduced
    ? { stiffness: 1000, damping: 100, mass: 0.1 }
    : { stiffness: 150, damping: 20, mass: 0.5 };

  const rawX = useMotionValue(50);
  const rawY = useMotionValue(50);
  const opacity = useMotionValue(0);

  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);
  const glowOpacity = useSpring(opacity, { stiffness: 120, damping: 22 });

  const glowX = useTransform(x, (v) => `${v}%`);
  const glowY = useTransform(y, (v) => `${v}%`);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      rawX.set(((e.clientX - rect.left) / rect.width) * 100);
      rawY.set(((e.clientY - rect.top) / rect.height) * 100);
      opacity.set(1);
    },
    [rawX, rawY, opacity],
  );

  const onMouseLeave = useCallback(() => opacity.set(0), [opacity]);

  return { ref, onMouseMove, onMouseLeave, glowX, glowY, glowOpacity };
}
