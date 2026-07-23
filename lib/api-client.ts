import type { CleanSheetData, OddsResponse } from "@/lib/types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Request to ${url} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function fetchCleanSheetData(): Promise<CleanSheetData> {
  return getJson<CleanSheetData>("/api/fpl");
}

export function fetchOdds(): Promise<OddsResponse> {
  return getJson<OddsResponse>("/api/odds");
}
