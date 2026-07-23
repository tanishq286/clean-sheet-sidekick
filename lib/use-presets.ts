"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePreset,
  listPresets,
  savePreset,
  type PresetKind,
  type PresetPayload,
  type SavedPreset,
} from "@/lib/presets";
import { isSupabaseConfigured } from "@/lib/supabase";

export interface UsePresetsResult<T extends PresetPayload> {
  enabled: boolean;
  presets: SavedPreset<T>[];
  isLoading: boolean;
  isError: boolean;
  save: (name: string, payload: T) => Promise<void>;
  remove: (id: string) => Promise<void>;
  isSaving: boolean;
}

export function usePresets<T extends PresetPayload>(kind: PresetKind): UsePresetsResult<T> {
  const queryClient = useQueryClient();
  const enabled = isSupabaseConfigured();
  const queryKey = ["presets", kind] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => listPresets<T>(kind),
    enabled,
    staleTime: 60_000,
    retry: 0,
  });

  const saveMutation = useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: T }) => savePreset<T>(kind, name, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deletePreset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    enabled,
    presets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isSaving: saveMutation.isPending,
    save: async (name, payload) => {
      await saveMutation.mutateAsync({ name, payload });
    },
    remove: async (id) => {
      await removeMutation.mutateAsync(id);
    },
  };
}
