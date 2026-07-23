"use client";

import * as React from "react";
import { getCountdown, pad2, type Countdown } from "@/lib/utils";

interface CountdownTimerProps {
  deadline: string;
  onExpire?: () => void;
}

const EMPTY: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: false };

export function CountdownTimer({ deadline, onExpire }: CountdownTimerProps) {
  const [mounted, setMounted] = React.useState(false);
  const [countdown, setCountdown] = React.useState<Countdown>(EMPTY);
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);
    const tick = () => {
      const next = getCountdown(deadline);
      setCountdown(next);
      if (next.expired && !firedRef.current) {
        firedRef.current = true;
        onExpire?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline, onExpire]);

  const blocks: Array<{ label: string; value: string }> = [
    { label: "D", value: pad2(countdown.days) },
    { label: "H", value: pad2(countdown.hours) },
    { label: "M", value: pad2(countdown.minutes) },
    { label: "S", value: pad2(countdown.seconds) },
  ];

  return (
    <div className="flex items-center gap-1.5" aria-label="Time until gameweek deadline">
      {blocks.map((b, i) => (
        <React.Fragment key={b.label}>
          <div className="flex flex-col items-center">
            <span className="min-w-[2ch] text-center font-mono text-sm font-semibold tabular-nums text-emerald-300">
              {mounted ? b.value : "--"}
            </span>
            <span className="text-[9px] font-medium uppercase text-muted-foreground">{b.label}</span>
          </div>
          {i < blocks.length - 1 && <span className="pb-3 text-muted-foreground/50">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
