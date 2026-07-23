import { clamp } from "@/lib/utils";
import type { Team } from "@/lib/types";

/**
 * Clean-sheet probability model.
 *
 * We estimate the expected goals a team concedes in a fixture (xGC) from the
 * FPL strength ratings, then treat goals conceded as a Poisson process:
 *
 *   P(clean sheet) = P(0 goals conceded) = e^(-xGC)
 *
 * xGC is scaled by the opponent's attacking strength, the team's own defensive
 * strength, and a home/away venue adjustment.
 */

const LEAGUE_AVG_GOALS_CONCEDED = 1.35;
const HOME_DEFENCE_FACTOR = 0.88; // sides concede ~12% fewer at home
const AWAY_DEFENCE_FACTOR = 1.12;

export interface LeagueAverages {
  attack: number;
  defence: number;
}

export function computeLeagueAverages(teams: Team[]): LeagueAverages {
  if (teams.length === 0) return { attack: 1200, defence: 1200 };
  let attack = 0;
  let defence = 0;
  for (const t of teams) {
    attack += (t.attackHome + t.attackAway) / 2;
    defence += (t.defenceHome + t.defenceAway) / 2;
  }
  return { attack: attack / teams.length, defence: defence / teams.length };
}

export function expectedGoalsConceded(
  team: Team,
  opponent: Team,
  isHome: boolean,
  averages: LeagueAverages,
): number {
  const opponentAttack = isHome ? opponent.attackAway : opponent.attackHome;
  const ownDefence = isHome ? team.defenceHome : team.defenceAway;

  const attackFactor = opponentAttack / averages.attack;
  // Higher defensive strength => fewer goals conceded, so we invert.
  const defenceFactor = averages.defence / Math.max(ownDefence, 1);
  const venueFactor = isHome ? HOME_DEFENCE_FACTOR : AWAY_DEFENCE_FACTOR;

  const xgc = LEAGUE_AVG_GOALS_CONCEDED * attackFactor * defenceFactor * venueFactor;
  return clamp(xgc, 0.2, 3.5);
}

export function cleanSheetProbability(
  team: Team,
  opponent: Team,
  isHome: boolean,
  averages: LeagueAverages,
): number {
  const xgc = expectedGoalsConceded(team, opponent, isHome, averages);
  return clamp(Math.exp(-xgc), 0.02, 0.9);
}

/** Difficulty rating (1 easy .. 5 hard) derived from the clean-sheet chance. */
export function fdrFromCleanSheetProb(prob: number): number {
  if (prob >= 0.55) return 1;
  if (prob >= 0.42) return 2;
  if (prob >= 0.3) return 3;
  if (prob >= 0.2) return 4;
  return 5;
}

/* ------------------------------------------------------------------ */
/* Bookmaker odds helpers                                             */
/* ------------------------------------------------------------------ */

/** Convert decimal odds (e.g. 2.50) to an implied probability. */
export function impliedProbability(decimalOdds: number): number {
  if (decimalOdds <= 1) return 0;
  return 1 / decimalOdds;
}

/**
 * Remove the bookmaker margin ("vig") from a two-way market so the two
 * outcomes sum to 1. Returns the de-vigged probability of the "yes" side.
 */
export function deVig(yesOdds: number, noOdds: number): number {
  const yes = impliedProbability(yesOdds);
  const no = impliedProbability(noOdds);
  const overround = yes + no;
  if (overround <= 0) return 0;
  return clamp(yes / overround, 0.01, 0.99);
}
