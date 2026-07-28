import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const MAX_TILT = 7; // degrees — past ~10 the text starts to look distorted

/**
 * Magnetic 3D tilt driven by pointer position.
 *
 * Pointer coordinates feed MotionValues rather than React state, so tracking
 * the cursor never re-renders — the transform is written straight to the
 * compositor. Disabled outright for reduced-motion and for coarse pointers,
 * where there is no hover to track and the tilt would only fire on tap.
 */
export default function TiltCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const spring = { stiffness: 260, damping: 24, mass: 0.4 };
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), spring);

  const finePointer =
    typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  const interactive = !reduceMotion && finePointer;

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onClick={onClick}
      style={
        interactive
          ? { rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d" }
          : undefined
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
