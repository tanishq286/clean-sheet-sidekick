/**
 * Domain + API types for Clean Sheet Sidekick.
 * Strict typing throughout — no `any`.
 */

/* ------------------------------------------------------------------ */
/* Raw Fantasy Premier League API shapes (subset we consume)          */
/* ------------------------------------------------------------------ */

export interface FplTeamRaw {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

export interface FplElementRaw {
  id: number;
  web_name: string;
  team: number;
  element_type: number; // 1 = GKP, 2 = DEF, 3 = MID, 4 = FWD
  now_cost: number; // price in tenths of a million (e.g. 55 => £5.5m)
  selected_by_percent: string;
  status: string; // "a" = available
}

export interface FplEventRaw {
  id: number;
  name: string;
  deadline_time: string; // ISO
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}

export interface FplBootstrapRaw {
  teams: FplTeamRaw[];
  elements: FplElementRaw[];
  events: FplEventRaw[];
}

export interface FplFixtureRaw {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string | null;
  finished: boolean;
}

/* ------------------------------------------------------------------ */
/* Derived domain model                                               */
/* ------------------------------------------------------------------ */

export type Position = "GKP" | "DEF" | "MID" | "FWD";

export type OddsMode = "model" | "market";

export type Venue = "all" | "home" | "away";

export interface Team {
  id: number;
  name: string;
  shortName: string;
  strength: number;
  attackHome: number;
  attackAway: number;
  defenceHome: number;
  defenceAway: number;
}

export interface Gameweek {
  id: number;
  name: string;
  deadline: string; // ISO
  isCurrent: boolean;
  isNext: boolean;
  finished: boolean;
}

export interface CleanSheetCell {
  gameweek: number;
  opponentShort: string;
  isHome: boolean;
  /** Fixture Difficulty Rating, 1 (easiest) .. 5 (hardest). */
  fdr: number;
  /** Model-derived clean-sheet probability, 0..1. */
  modelProb: number;
  /** Market (odds-implied) clean-sheet probability, 0..1. */
  marketProb: number;
  kickoff: string | null;
  /** No fixture scheduled this gameweek. */
  blank: boolean;
}

export interface TeamCleanSheetRow {
  team: Team;
  /** One cell per gameweek in the horizon (blank cells included). */
  cells: CleanSheetCell[];
  /** Mean model probability across played fixtures in the horizon. */
  averageProb: number;
}

export interface Defender {
  id: number;
  name: string;
  teamId: number;
  teamShort: string;
  position: Position;
  /** Price in millions, e.g. 5.5. */
  price: number;
  selectedByPercent: number;
}

export interface CleanSheetData {
  horizon: number[]; // ordered gameweek ids
  currentGameweek: Gameweek | null;
  nextGameweek: Gameweek | null;
  rows: TeamCleanSheetRow[];
  defenders: Defender[];
  teams: Team[];
  source: DataSource;
  generatedAt: string; // ISO
}

export type DataSource = "live" | "mock";

/* ------------------------------------------------------------------ */
/* Odds overlay (served by /api/odds)                                 */
/* ------------------------------------------------------------------ */

export interface OddsEntry {
  teamId: number;
  gameweek: number;
  /** Odds-implied, de-vigged clean-sheet probability, 0..1. */
  cleanSheetProb: number;
}

export interface OddsResponse {
  source: DataSource;
  generatedAt: string;
  entries: OddsEntry[];
}

/* ------------------------------------------------------------------ */
/* Filters                                                            */
/* ------------------------------------------------------------------ */

export interface HeatmapFilters {
  teamIds: number[]; // empty => all teams
  minPrice: number;
  maxPrice: number;
  venue: Venue;
  /** Show only fixtures with FDR <= this value. */
  maxFdr: number;
}
