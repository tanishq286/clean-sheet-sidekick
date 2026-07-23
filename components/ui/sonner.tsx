"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "glass-strong !rounded-xl !border-black/10 !text-foreground !shadow-2xl",
          description: "!text-muted-foreground",
          actionButton: "!bg-emerald-500 !text-emerald-950",
          cancelButton: "!bg-black/[0.06] !text-foreground",
          error: "!border-rose-400/30",
          success: "!border-emerald-400/30",
        },
      }}
    />
  );
}
