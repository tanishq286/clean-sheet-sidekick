"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "glass-strong !rounded-xl !border-white/10 !text-foreground !shadow-2xl",
          description: "!text-muted-foreground",
          actionButton: "!bg-emerald-500 !text-emerald-950",
          cancelButton: "!bg-white/10 !text-foreground",
          error: "!border-rose-400/30",
          success: "!border-emerald-400/30",
        },
      }}
    />
  );
}
