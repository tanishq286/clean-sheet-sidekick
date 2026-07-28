import { useEffect, useState } from "react";
import { hapticsEnabled, setHapticsEnabled, playClickSound } from "@/lib/audio";

/**
 * Opt-in control for the interface's micro-haptics.
 *
 * The audio layer defaults to silent — a page that makes noise unprompted is a
 * page people close — so without this control the feature would be unreachable.
 * Hidden entirely when the visitor asks for reduced motion, since in that case
 * `hapticsEnabled()` refuses to return true and the button could not do
 * anything but mislead.
 */
export default function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  const [available, setAvailable] = useState(false);

  // Read preferences after mount: localStorage and matchMedia are unavailable
  // during SSR/prerender, and reading them in useState would desync hydration.
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setAvailable(!reduced);
    setOn(hapticsEnabled());
  }, []);

  if (!available) return null;

  const toggle = () => {
    const next = !on;
    setHapticsEnabled(next);
    setOn(next);
    // Play only when switching on, so the click both confirms the change and
    // demonstrates what was just enabled.
    if (next) playClickSound();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={on ? "Interface sounds on" : "Interface sounds off"}
      className={`pointer-events-auto relative z-10 inline-flex items-center gap-1.5 rounded-full border border-current/20 px-3 py-1.5 text-xs opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40 ${className}`}
    >
      <span aria-hidden="true">{on ? "♪" : "🔇"}</span>
      <span>{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
