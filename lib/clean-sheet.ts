import { cleanSheetProbability, computeLeagueAverages, fdrFromCleanSheetProb } from "@/lib/odds-calculator";
import type {
  CleanSheetCell,
  CleanSheetData,
  OddsResponse,
  Team,
  TeamCleanSheetRow,
} from "@/lib/types";

/** A minimal fixture description shared by the live and mock builders. */
export interface FixtureLite {
  gameweek: number;
  homeId: number;
  awayId: number;
  kickoff: string | null;
}

/**
 * Build the clean-sheet matrix rows: for every team, one cell per gameweek in
 * the horizon. Cells with no fixture are marked `blank`. The model probability
 * is computed from team strengths; market probability defaults to it until an
 * odds overlay is merged in.
 */
export function buildCleanSheetRows(
  teams: Team[],
  fixtures: FixtureLite[],
  horizon: number[],
): TeamCleanSheetRow[] {
  const averages = computeLeagueAverages(teams);
  const teamById = new Map<number, Team>(teams.map((t) => [t.id, t]));

  // Index fixtures by team + gameweek for O(1) lookup.
  const byTeamGw = new Map<string, { opponent: Team; isHome: boolean; kickoff: string | null }>();
  for (const fx of fixtures) {
    const home = teamById.get(fx.homeId);
    const away = teamById.get(fx.awayId);
    if (!home || !away) continue;
    byTeamGw.set(`${fx.homeId}:${fx.gameweek}`, { opponent: away, isHome: true, kickoff: fx.kickoff });
    byTeamGw.set(`${fx.awayId}:${fx.gameweek}`, { opponent: home, isHome: false, kickoff: fx.kickoff });
  }

  return teams
    .map((team) => {
      const cells: CleanSheetCell[] = horizon.map((gw) => {
        const match = byTeamGw.get(`${team.id}:${gw}`);
        if (!match) {
          return {
            gameweek: gw,
            opponentShort: "—",
            isHome: false,
            fdr: 3,
            modelProb: 0,
            marketProb: 0,
            kickoff: null,
            blank: true,
          } satisfies CleanSheetCell;
        }
        const modelProb = cleanSheetProbability(team, match.opponent, match.isHome, averages);
        return {
          gameweek: gw,
          opponentShort: match.opponent.shortName,
          isHome: match.isHome,
          fdr: fdrFromCleanSheetProb(modelProb),
          modelProb,
          marketProb: modelProb,
          kickoff: match.kickoff,
          blank: false,
        } satisfies CleanSheetCell;
      });

      const played = cells.filter((c) => !c.blank);
      const averageProb =
        played.length > 0 ? played.reduce((sum, c) => sum + c.modelProb, 0) / played.length : 0;

      return { team, cells, averageProb } satisfies TeamCleanSheetRow;
    })
    .sort((a, b) => b.averageProb - a.averageProb);
}

/**
 * Merge an odds overlay into a dataset, replacing each cell's `marketProb` with
 * the bookmaker-implied probability where available. Returns a new dataset;
 * inputs are not mutated.
 */
export function mergeOdds(data: CleanSheetData, odds: OddsResponse): CleanSheetData {
  const probByKey = new Map<string, number>(
    odds.entries.map((e) => [`${e.teamId}:${e.gameweek}`, e.cleanSheetProb]),
  );

  const rows: TeamCleanSheetRow[] = data.rows.map((row) => ({
    ...row,
    cells: row.cells.map((cell) => {
      if (cell.blank) return cell;
      const market = probByKey.get(`${row.team.id}:${cell.gameweek}`);
      return market === undefined ? cell : { ...cell, marketProb: market };
    }),
  }));

  return { ...data, rows };
}
