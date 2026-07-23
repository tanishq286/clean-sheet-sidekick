"use client";

import * as React from "react";
import { Bookmark, Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { usePresets } from "@/lib/use-presets";
import type { PresetKind, PresetPayload } from "@/lib/presets";
import { cn } from "@/lib/utils";

interface PresetBarProps<T extends PresetPayload> {
  kind: PresetKind;
  label: string;
  /** Build the payload to persist from current state. */
  getPayload: () => T;
  /** Apply a loaded preset to the UI. */
  onLoad: (payload: T) => void;
  /** Whether the current state is savable (e.g. squad has at least one pick). */
  canSave: boolean;
  className?: string;
}

export function PresetBar<T extends PresetPayload>({
  kind,
  label,
  getPayload,
  onLoad,
  canSave,
  className,
}: PresetBarProps<T>) {
  const { enabled, presets, save, remove, isSaving } = usePresets<T>(kind);
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  if (!enabled) return null;

  const commitSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await save(trimmed, getPayload());
      toast.success(`Saved "${trimmed}"`);
      setName("");
      setAdding(false);
    } catch (error) {
      toast.error("Couldn't save", {
        description: error instanceof Error ? error.message : "Check your Supabase table exists.",
      });
    }
  };

  const handleDelete = async (id: string, presetName: string) => {
    try {
      await remove(id);
      toast.success(`Deleted "${presetName}"`);
    } catch (error) {
      toast.error("Couldn't delete", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Bookmark className="size-3.5" />
        {label}
      </span>

      {presets.map((preset) => (
        <span
          key={preset.id}
          className="group inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 py-0.5 pl-2.5 pr-1 text-xs text-emerald-700"
        >
          <button
            onClick={() => {
              onLoad(preset.payload);
              toast.success(`Loaded "${preset.name}"`);
            }}
            className="font-medium hover:underline"
          >
            {preset.name}
          </button>
          <button
            onClick={() => handleDelete(preset.id, preset.name)}
            aria-label={`Delete ${preset.name}`}
            className="rounded-full p-0.5 text-emerald-700/60 transition-colors hover:bg-emerald-500/20 hover:text-emerald-800"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      {presets.length === 0 && <span className="text-xs text-muted-foreground/70">none yet</span>}

      {adding ? (
        <span className="inline-flex items-center gap-1">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commitSave();
              if (e.key === "Escape") {
                setAdding(false);
                setName("");
              }
            }}
            maxLength={60}
            placeholder="Preset name"
            className="h-7 w-32 rounded-md border border-black/10 bg-white/80 px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          />
          <button
            onClick={() => void commitSave()}
            disabled={!name.trim() || isSaving}
            aria-label="Confirm save"
            className="grid size-7 place-items-center rounded-md bg-emerald-500 text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          </button>
        </span>
      ) : (
        <button
          onClick={() => setAdding(true)}
          disabled={!canSave}
          className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-black/20 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-3" />
          Save current
        </button>
      )}
    </div>
  );
}
