import type { CleanSheetData, Defender, OddsMode, TeamCleanSheetRow } from "@/lib/types";

export interface RotationPick {
  defenderId: number;
  name: string;
  teamShort: string;
  opponentShort: string;
  isHome: boolean;
  prob: number;
  blank: boolean;
  starting: boolean;
}

export interface RotationGameweek {
  gameweek: number;
  picks: RotationPick[];
  expectedCleanSheets: number;
}

export interface RotationPlan {
  slots: number;
  gameweeks: RotationGameweek[];
  totalExpectedCleanSheets: number;
  /** Average clean-sheet coverage per gameweek, 0..1 (per starting slot). */
  coverage: number;
}

export const MAX_ROTATION_DEFENDERS = 4;

/**
 * Given a shortlist of defenders, work out — for every gameweek in the horizon —
 * which of them to start so that expected clean sheets are maximised. Each week
 * the `slots` best fixtures (by clean-sheet probability) are picked.
 */
export function computeRotationPlan(
  selected: Defender[],
  data: CleanSheetData,
  mode: OddsMode,
  slots: number,
): RotationPlan {
  const rowByTeam = new Map<number, TeamCleanSheetRow>(data.rows.map((r) => [r.team.id, r]));
  const gwIndex = new Map<number, number>(data.horizon.map((gw, i) => [gw, i]));

  const gameweeks: RotationGameweek[] = data.horizon.map((gw) => {
    const idx = gwIndex.get(gw) ?? 0;
    const picks: RotationPick[] = selected.map((def) => {
      const row = rowByTeam.get(def.teamId);
      const cell = row?.cells[idx];
      const prob = cell && !cell.blank ? (mode === "market" ? cell.marketProb : cell.modelProb) : 0;
      return {
        defenderId: def.id,
        name: def.name,
        teamShort: def.teamShort,
        opponentShort: cell?.opponentShort ?? "—",
        isHome: cell?.isHome ?? false,
        prob,
        blank: cell?.blank ?? true,
        starting: false,
      };
    });

    picks.sort((a, b) => b.prob - a.prob);
    let expected = 0;
    for (let i = 0; i < picks.length; i += 1) {
      if (i < slots && !picks[i].blank) {
        picks[i].starting = true;
        expected += picks[i].prob;
      }
    }

    return { gameweek: gw, picks, expectedCleanSheets: expected };
  });

  const total = gameweeks.reduce((sum, gw) => sum + gw.expectedCleanSheets, 0);
  const denom = Math.max(gameweeks.length * slots, 1);
  return {
    slots,
    gameweeks,
    totalExpectedCleanSheets: total,
    coverage: total / denom,
  };
}
