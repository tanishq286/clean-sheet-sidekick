/**
 * Zero-dependency micro-haptics via the Web Audio API.
 *
 * Synthesises short clicks from an oscillator instead of shipping audio files —
 * no network request, no bundle cost, a few hundred bytes of code.
 *
 * Three constraints shape the implementation:
 *  - Browsers refuse to start an AudioContext before a user gesture, so the
 *    context is created lazily on the first real interaction and resumed if the
 *    browser suspended it.
 *  - A single shared context is reused. Creating one per click leaks hardware
 *    audio units and Safari caps how many a page may open.
 *  - Unsolicited sound is hostile, so it stays off unless the visitor opts in
 *    and is force-muted for `prefers-reduced-motion`, which is the closest
 *    standard signal for "give me a calmer page".
 */

const STORAGE_KEY = "founderid-haptics";

let ctx: AudioContext | null = null;
let unlocked = false;

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Opt-in, and never over reduced-motion. */
export function hapticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false; // private mode / storage blocked
  }
}

export function setHapticsEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable — the setting simply won't persist */
  }
  if (on) void ensureContext();
}

async function ensureContext(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  const w = window as AudioWindow;
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;

  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  // Autoplay policy parks the context until a gesture unblocks it.
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  unlocked = ctx.state === "running";
  return unlocked ? ctx : null;
}

interface Blip {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
}

function blip({ frequency, duration, gain, type = "sine" }: Blip): void {
  if (!hapticsEnabled()) return;

  void ensureContext().then((audio) => {
    if (!audio) return;

    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const now = audio.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    // Ramp up over a couple of milliseconds rather than starting at full gain:
    // an instant jump from silence produces an audible click artefact of its
    // own. Then decay exponentially — exponentialRamp cannot reach 0, hence
    // the small non-zero floor.
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.002);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(amp).connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);

    // Release the nodes once they've finished so they can be collected.
    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
    };
  });
}

/** Crisp confirmation tick for taps on buttons, cards and filter pills. */
export function playClickSound(): void {
  blip({ frequency: 800, duration: 0.015, gain: 0.05, type: "triangle" });
}

/** Quieter, lower cousin for hover — deliberately near the threshold of notice. */
export function playHoverSound(): void {
  blip({ frequency: 480, duration: 0.012, gain: 0.018, type: "sine" });
}

/** Soft two-step rise, for opening a drawer or expanding a card. */
export function playOpenSound(): void {
  blip({ frequency: 620, duration: 0.02, gain: 0.04, type: "sine" });
  window.setTimeout(() => blip({ frequency: 930, duration: 0.02, gain: 0.03, type: "sine" }), 45);
}
