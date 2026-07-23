"use client";

import { getDeviceId, getSupabaseClient } from "@/lib/supabase";
import type { HeatmapFilters } from "@/lib/types";

export type PresetKind = "squad" | "filters";

export interface SquadPresetPayload {
  defenderIds: number[];
  slots: number;
}

export type FiltersPresetPayload = HeatmapFilters;

export type PresetPayload = SquadPresetPayload | FiltersPresetPayload;

export interface SavedPreset<T extends PresetPayload = PresetPayload> {
  id: string;
  kind: PresetKind;
  name: string;
  payload: T;
  updatedAt: string;
}

interface PresetRow {
  id: string;
  kind: PresetKind;
  name: string;
  payload: PresetPayload;
  updated_at: string;
}

const TABLE = "saved_presets";

function toPreset<T extends PresetPayload>(row: PresetRow): SavedPreset<T> {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    payload: row.payload as T,
    updatedAt: row.updated_at,
  };
}

export async function listPresets<T extends PresetPayload>(kind: PresetKind): Promise<SavedPreset<T>[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, kind, name, payload, updated_at")
    .eq("kind", kind)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PresetRow[]).map((row) => toPreset<T>(row));
}

export async function savePreset<T extends PresetPayload>(
  kind: PresetKind,
  name: string,
  payload: T,
): Promise<SavedPreset<T>> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ device_id: getDeviceId(), kind, name: name.trim().slice(0, 60), payload })
    .select("id, kind, name, payload, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return toPreset<T>(data as PresetRow);
}

export async function deletePreset(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
