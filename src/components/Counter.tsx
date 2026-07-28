import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface CounterProps {
  value: number;
  /** Rendered before/after the number, e.g. "+" or "yrs". */
  suffix?: string;
  prefix?: string;
  className?: string;
  /** Seconds the count-up takes. Ignored when reduced motion is requested. */
  duration?: number;
}

/**
 * Counts from 0 to `value` the first time it scrolls into view.
 *
 * The tween drives a MotionValue and writes straight to the text node, so the
 * ~60 intermediate frames never re-render the React tree — only one DOM node is
 * touched per frame. With reduced motion requested the final number is painted
 * immediately and no animation runs at all.
 */
export default function Counter({ value, suffix, prefix, className, duration = 1.2 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });

  const started = useRef(false);

  useEffect(() => {
    if (!numberRef.current) return;

    if (reduceMotion) {
      numberRef.current.textContent = String(value);
      return;
    }
    // Paint a 0 only before the first run. Re-zeroing on every `value` change
    // would make a later update (a filter narrowing 4 items to 2) blink to 0
    // and then animate down from 4 — the spring resumes from where it is.
    if (!started.current) numberRef.current.textContent = "0";
    if (inView) {
      started.current = true;
      motionValue.set(value);
    }
  }, [inView, value, reduceMotion, motionValue]);

  useEffect(() => {
    if (reduceMotion) return;
    return spring.on("change", (latest) => {
      if (numberRef.current) numberRef.current.textContent = String(Math.round(latest));
    });
  }, [spring, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {/* aria-hidden on the animated node; the accessible name carries the real
          value so screen readers announce the total, not a stream of numbers. */}
      <span ref={numberRef} aria-hidden="true">
        0
      </span>
      <span className="sr-only">{value}</span>
      {suffix}
    </span>
  );
}
