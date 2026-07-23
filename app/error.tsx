"use client";

import * as React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div className="grid min-h-[70dvh] place-items-center px-6">
      <div className="glass-strong flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-rose-500/15 text-rose-300">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Something went sideways</h2>
          <p className="text-sm text-muted-foreground">
            The dashboard hit an unexpected error. Your data is safe — try reloading the view.
          </p>
          {error.digest && (
            <p className="pt-1 font-mono text-[11px] text-muted-foreground/60">ref: {error.digest}</p>
          )}
        </div>
        <Button onClick={reset}>
          <RefreshCcw className="size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
