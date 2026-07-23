import { NextResponse } from "next/server";
import { getOdds } from "@/lib/odds-source";

// Odds move slower than fixtures; cache for 10 minutes.
export const revalidate = 600;

/**
 * Server-side proxy for the clean-sheet odds overlay. Always returns 200 — the
 * overlay is model-derived when no bookmaker feed is configured or reachable.
 */
export async function GET(): Promise<NextResponse> {
  const odds = await getOdds();
  return NextResponse.json(odds, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      "X-Data-Source": odds.source,
    },
  });
}
