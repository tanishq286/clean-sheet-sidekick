"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchCleanSheetData, fetchOdds } from "@/lib/api-client";
import type { CleanSheetData, OddsResponse } from "@/lib/types";

export const queryKeys = {
  cleanSheet: ["clean-sheet"] as const,
  odds: ["odds"] as const,
};

export function useCleanSheetData(): UseQueryResult<CleanSheetData, Error> {
  return useQuery({
    queryKey: queryKeys.cleanSheet,
    queryFn: fetchCleanSheetData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useOdds(): UseQueryResult<OddsResponse, Error> {
  return useQuery({
    queryKey: queryKeys.odds,
    queryFn: fetchOdds,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
