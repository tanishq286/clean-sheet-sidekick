import { buildCleanSheetRows, type FixtureLite } from "@/lib/clean-sheet";
import { deVig } from "@/lib/odds-calculator";
import { clamp, seededRandom } from "@/lib/utils";
import type {
  CleanSheetData,
  DataSource,
  Defender,
  Gameweek,
  OddsEntry,
  OddsResponse,
  Team,
} from "@/lib/types";

/** Number of upcoming gameweeks the matrix spans. */
export const HORIZON_LENGTH = 6;

/**
 * Twenty Premier League clubs with plausible FPL-style strength ratings.
 * These power the mock/offline experience and act as the resilient fallback
 * whenever the live FPL API is unreachable or rate-limited.
 */
const TEAM_SEED: ReadonlyArray<Omit<Team, "id">> = [
  { name: "Manchester City", shortName: "MCI", strength: 5, attackHome: 1380, attackAway: 1360, defenceHome: 1350, defenceAway: 1330 },
  { name: "Arsenal", shortName: "ARS", strength: 5, attackHome: 1340, attackAway: 1320, defenceHome: 1360, defenceAway: 1340 },
  { name: "Liverpool", shortName: "LIV", strength: 5, attackHome: 1350, attackAway: 1330, defenceHome: 1330, defenceAway: 1290 },
  { name: "Chelsea", shortName: "CHE", strength: 4, attackHome: 1280, attackAway: 1250, defenceHome: 1270, defenceAway: 1240 },
  { name: "Newcastle", shortName: "NEW", strength: 4, attackHome: 1270, attackAway: 1230, defenceHome: 1280, defenceAway: 1250 },
  { name: "Tottenham", shortName: "TOT", strength: 4, attackHome: 1290, attackAway: 1260, defenceHome: 1200, defenceAway: 1170 },
  { name: "Aston Villa", shortName: "AVL", strength: 4, attackHome: 1240, attackAway: 1210, defenceHome: 1220, defenceAway: 1190 },
  { name: "Manchester United", shortName: "MUN", strength: 4, attackHome: 1230, attackAway: 1200, defenceHome: 1210, defenceAway: 1180 },
  { name: "Brighton", shortName: "BHA", strength: 3, attackHome: 1210, attackAway: 1180, defenceHome: 1190, defenceAway: 1160 },
  { name: "West Ham", shortName: "WHU", strength: 3, attackHome: 1170, attackAway: 1140, defenceHome: 1160, defenceAway: 1130 },
  { name: "Crystal Palace", shortName: "CRY", strength: 3, attackHome: 1150, attackAway: 1120, defenceHome: 1180, defenceAway: 1150 },
  { name: "Brentford", shortName: "BRE", strength: 3, attackHome: 1180, attackAway: 1130, defenceHome: 1150, defenceAway: 1110 },
  { name: "Fulham", shortName: "FUL", strength: 3, attackHome: 1140, attackAway: 1110, defenceHome: 1160, defenceAway: 1130 },
  { name: "Bournemouth", shortName: "BOU", strength: 3, attackHome: 1160, attackAway: 1120, defenceHome: 1130, defenceAway: 1100 },
  { name: "Wolves", shortName: "WOL", strength: 3, attackHome: 1120, attackAway: 1090, defenceHome: 1140, defenceAway: 1110 },
  { name: "Everton", shortName: "EVE", strength: 3, attackHome: 1110, attackAway: 1080, defenceHome: 1170, defenceAway: 1140 },
  { name: "Nottingham Forest", shortName: "NFO", strength: 2, attackHome: 1100, attackAway: 1070, defenceHome: 1120, defenceAway: 1090 },
  { name: "Leicester", shortName: "LEI", strength: 2, attackHome: 1090, attackAway: 1060, defenceHome: 1080, defenceAway: 1050 },
  { name: "Ipswich", shortName: "IPS", strength: 2, attackHome: 1070, attackAway: 1040, defenceHome: 1060, defenceAway: 1030 },
  { name: "Southampton", shortName: "SOU", strength: 2, attackHome: 1060, attackAway: 1030, defenceHome: 1050, defenceAway: 1020 },
];

interface DefenderSeed {
  name: string;
  teamShort: string;
  price: number;
  ownership: number;
}

/** A curated pool of defenders spread across the strongest defensive sides. */
const DEFENDER_SEED: ReadonlyArray<DefenderSeed> = [
  { name: "Gvardiol", teamShort: "MCI", price: 6.1, ownership: 28.4 },
  { name: "Aké", teamShort: "MCI", price: 5.2, ownership: 9.1 },
  { name: "Saliba", teamShort: "ARS", price: 6.3, ownership: 31.7 },
  { name: "Gabriel", teamShort: "ARS", price: 6.2, ownership: 34.2 },
  { name: "White", teamShort: "ARS", price: 5.9, ownership: 12.5 },
  { name: "Van Dijk", teamShort: "LIV", price: 6.4, ownership: 22.9 },
  { name: "Alexander-Arnold", teamShort: "LIV", price: 7.0, ownership: 26.1 },
  { name: "Robertson", teamShort: "LIV", price: 6.0, ownership: 8.3 },
  { name: "Cucurella", teamShort: "CHE", price: 5.3, ownership: 18.7 },
  { name: "James", teamShort: "CHE", price: 5.4, ownership: 7.6 },
  { name: "Hall", teamShort: "NEW", price: 4.9, ownership: 15.2 },
  { name: "Burn", teamShort: "NEW", price: 4.6, ownership: 6.8 },
  { name: "Trippier", teamShort: "NEW", price: 5.7, ownership: 5.4 },
  { name: "Van de Ven", teamShort: "TOT", price: 4.8, ownership: 11.0 },
  { name: "Porro", teamShort: "TOT", price: 5.5, ownership: 9.9 },
  { name: "Konsa", teamShort: "AVL", price: 4.6, ownership: 7.1 },
  { name: "Digne", teamShort: "AVL", price: 4.5, ownership: 4.2 },
  { name: "Dalot", teamShort: "MUN", price: 5.0, ownership: 6.3 },
  { name: "De Ligt", teamShort: "MUN", price: 4.9, ownership: 3.8 },
  { name: "Estupiñán", teamShort: "BHA", price: 4.9, ownership: 5.6 },
  { name: "Van Hecke", teamShort: "BHA", price: 4.4, ownership: 3.1 },
  { name: "Kilman", teamShort: "WHU", price: 4.4, ownership: 4.7 },
  { name: "Guéhi", teamShort: "CRY", price: 4.5, ownership: 10.8 },
  { name: "Mitchell", teamShort: "CRY", price: 4.6, ownership: 6.5 },
  { name: "Collins", teamShort: "BRE", price: 4.5, ownership: 5.9 },
  { name: "Robinson", teamShort: "FUL", price: 4.7, ownership: 8.2 },
  { name: "Andersen", teamShort: "FUL", price: 4.5, ownership: 3.4 },
  { name: "Kerkez", teamShort: "BOU", price: 4.7, ownership: 6.1 },
  { name: "Senesi", teamShort: "BOU", price: 4.5, ownership: 4.0 },
  { name: "Ait-Nouri", teamShort: "WOL", price: 4.9, ownership: 5.2 },
  { name: "Tarkowski", teamShort: "EVE", price: 4.6, ownership: 7.8 },
  { name: "Mykolenko", teamShort: "EVE", price: 4.4, ownership: 3.6 },
  { name: "Murillo", teamShort: "NFO", price: 4.6, ownership: 9.4 },
  { name: "Aina", teamShort: "NFO", price: 4.7, ownership: 8.1 },
];

function buildTeams(): Team[] {
  return TEAM_SEED.map((seed, index) => ({ id: index + 1, ...seed }));
}

/**
 * Round-robin schedule via the circle method. Every team plays exactly once per
 * gameweek. Home/away alternates so venues are balanced across the horizon.
 */
function buildSchedule(teams: Team[], horizon: number[]): FixtureLite[] {
  const ids = teams.map((t) => t.id);
  const n = ids.length;
  const fixtures: FixtureLite[] = [];
  const rotation = ids.slice();
  const now = Date.now();

  horizon.forEach((gw, round) => {
    for (let i = 0; i < n / 2; i += 1) {
      const a = rotation[i];
      const b = rotation[n - 1 - i];
      // Alternate home advantage each round for fairness.
      const homeId = (round + i) % 2 === 0 ? a : b;
      const awayId = homeId === a ? b : a;
      const kickoff = new Date(now + round * 7 * 86_400_000 + i * 2 * 3_600_000).toISOString();
      fixtures.push({ gameweek: gw, homeId, awayId, kickoff });
    }
    // Rotate all but the first element.
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop() as number);
    rotation.splice(0, rotation.length, fixed, ...rest);
  });

  return fixtures;
}

function buildDefenders(teams: Team[]): Defender[] {
  const idByShort = new Map<string, number>(teams.map((t) => [t.shortName, t.id]));
  return DEFENDER_SEED.map((seed, index) => ({
    id: 1000 + index,
    name: seed.name,
    teamId: idByShort.get(seed.teamShort) ?? 0,
    teamShort: seed.teamShort,
    position: "DEF" as const,
    price: seed.price,
    selectedByPercent: seed.ownership,
  })).filter((d) => d.teamId !== 0);
}

function buildGameweeks(startId: number): { horizon: number[]; current: Gameweek; next: Gameweek } {
  const now = Date.now();
  const horizon = Array.from({ length: HORIZON_LENGTH }, (_, i) => startId + i);
  const current: Gameweek = {
    id: startId - 1,
    name: `Gameweek ${startId - 1}`,
    deadline: new Date(now - 2 * 86_400_000).toISOString(),
    isCurrent: true,
    isNext: false,
    finished: false,
  };
  const next: Gameweek = {
    id: startId,
    name: `Gameweek ${startId}`,
    // Always in the future so the countdown is live in the demo.
    deadline: new Date(now + 2 * 86_400_000 + 4 * 3_600_000 + 37 * 60_000).toISOString(),
    isCurrent: false,
    isNext: true,
    finished: false,
  };
  return { horizon, current, next };
}

/** Full mock dataset used offline and as the API fallback. */
export function generateMockCleanSheetData(source: DataSource = "mock"): CleanSheetData {
  const teams = buildTeams();
  const { horizon, current, next } = buildGameweeks(24);
  const fixtures = buildSchedule(teams, horizon);
  const rows = buildCleanSheetRows(teams, fixtures, horizon);
  const defenders = buildDefenders(teams);

  return {
    horizon,
    currentGameweek: current,
    nextGameweek: next,
    rows,
    defenders,
    teams,
    source,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Derive a realistic odds overlay from a clean-sheet dataset. Each fixture's
 * model probability is nudged by seeded noise to emulate a market, wrapped in a
 * bookmaker margin, then de-vigged back into an implied probability.
 */
export function generateOddsFromData(data: CleanSheetData, source: DataSource = "mock"): OddsResponse {
  const rand = seededRandom(0x5eed);
  const margin = 1.06;
  const entries: OddsEntry[] = [];

  for (const row of data.rows) {
    for (const cell of row.cells) {
      if (cell.blank) continue;
      const noise = (rand() - 0.5) * 0.12;
      const trueYes = clamp(cell.modelProb + noise, 0.03, 0.92);
      const yesOdds = margin / trueYes;
      const noOdds = margin / (1 - trueYes);
      entries.push({
        teamId: row.team.id,
        gameweek: cell.gameweek,
        cleanSheetProb: deVig(yesOdds, noOdds),
      });
    }
  }

  return { source, generatedAt: new Date().toISOString(), entries };
}
