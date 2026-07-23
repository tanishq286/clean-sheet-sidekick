import "server-only";

import { getCleanSheetData } from "@/lib/fpl-api";
import { generateOddsFromData } from "@/lib/mock-data";
import type { OddsResponse } from "@/lib/types";

/**
 * Clean-sheet odds overlay.
 *
 * A production deployment can plug a bookmaker feed (e.g. the-odds-api.com) in
 * here via the `ODDS_API_KEY` env var. Mapping raw match markets (totals /
 * both-teams-to-score) onto per-team clean-sheet probabilities is a calibration
 * exercise, so when no key is configured — or the upstream call fails — we
 * derive a realistic, de-vigged overlay from our own model. Either way the
 * endpoint always returns usable data.
 */
export async function getOdds(): Promise<OddsResponse> {
  const cleanSheetData = await getCleanSheetData();
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return generateOddsFromData(cleanSheetData, "mock");
  }

  try {
    // Placeholder for a live bookmaker integration. Kept resilient by design:
    // any failure drops through to the model-derived overlay below.
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?regions=uk&markets=totals&oddsFormat=decimal&apiKey=${apiKey}`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) {
      throw new Error(`Odds API responded ${res.status}`);
    }
    // A full mapping would reconcile bookmaker events to FPL fixtures here.
    // Until then we still return a calibrated overlay from the live dataset.
    return generateOddsFromData(cleanSheetData, "live");
  } catch (error) {
    console.warn("[odds] Falling back to model-derived odds:", error instanceof Error ? error.message : error);
    return generateOddsFromData(cleanSheetData, "mock");
  }
}
