import "server-only";

import { buildCleanSheetRows, type FixtureLite } from "@/lib/clean-sheet";
import { generateMockCleanSheetData, HORIZON_LENGTH } from "@/lib/mock-data";
import type {
  CleanSheetData,
  Defender,
  FplBootstrapRaw,
  FplEventRaw,
  FplFixtureRaw,
  FplTeamRaw,
  Gameweek,
  Team,
} from "@/lib/types";

const FPL_BASE = "https://fantasy.premierleague.com/api";
const REVALIDATE_SECONDS = 300; // 5 minutes of edge/server caching
const FETCH_TIMEOUT_MS = 6000;

const FETCH_HEADERS: HeadersInit = {
  // FPL rejects requests without a browser-like UA.
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
  Accept: "application/json",
};

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${FPL_BASE}${path}`, {
      headers: FETCH_HEADERS,
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      throw new Error(`FPL request ${path} failed with ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function toTeam(raw: FplTeamRaw): Team {
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.short_name,
    strength: raw.strength,
    attackHome: raw.strength_attack_home,
    attackAway: raw.strength_attack_away,
    defenceHome: raw.strength_defence_home,
    defenceAway: raw.strength_defence_away,
  };
}

function toGameweek(raw: FplEventRaw): Gameweek {
  return {
    id: raw.id,
    name: raw.name,
    deadline: raw.deadline_time,
    isCurrent: raw.is_current,
    isNext: raw.is_next,
    finished: raw.finished,
  };
}

function resolveHorizon(events: FplEventRaw[]): {
  horizon: number[];
  current: Gameweek | null;
  next: Gameweek | null;
} {
  const sorted = [...events].sort((a, b) => a.id - b.id);
  const currentRaw = sorted.find((e) => e.is_current) ?? null;
  const nextRaw = sorted.find((e) => e.is_next) ?? sorted.find((e) => !e.finished) ?? sorted[0] ?? null;
  const startId = nextRaw?.id ?? (currentRaw ? currentRaw.id + 1 : 1);
  const horizon = sorted
    .filter((e) => e.id >= startId)
    .slice(0, HORIZON_LENGTH)
    .map((e) => e.id);
  // Pad if the season is ending and fewer than HORIZON_LENGTH events remain.
  while (horizon.length < HORIZON_LENGTH) {
    horizon.push((horizon[horizon.length - 1] ?? startId - 1) + 1);
  }
  return {
    horizon,
    current: currentRaw ? toGameweek(currentRaw) : null,
    next: nextRaw ? toGameweek(nextRaw) : null,
  };
}

function toDefenders(elements: FplBootstrapRaw["elements"], teams: Team[]): Defender[] {
  const teamById = new Map<number, Team>(teams.map((t) => [t.id, t]));
  return elements
    .filter((el) => el.element_type === 2 && el.status === "a")
    .map((el) => {
      const team = teamById.get(el.team);
      return {
        id: el.id,
        name: el.web_name,
        teamId: el.team,
        teamShort: team?.shortName ?? "—",
        position: "DEF" as const,
        price: el.now_cost / 10,
        selectedByPercent: Number.parseFloat(el.selected_by_percent) || 0,
      };
    })
    .sort((a, b) => b.selectedByPercent - a.selectedByPercent)
    .slice(0, 60);
}

function transform(bootstrap: FplBootstrapRaw, fixturesRaw: FplFixtureRaw[]): CleanSheetData {
  if (!bootstrap.teams?.length) {
    throw new Error("FPL bootstrap returned no teams");
  }
  const teams = bootstrap.teams.map(toTeam);
  const { horizon, current, next } = resolveHorizon(bootstrap.events ?? []);
  const horizonSet = new Set(horizon);

  const fixtures: FixtureLite[] = fixturesRaw
    .filter((fx): fx is FplFixtureRaw & { event: number } => fx.event !== null && horizonSet.has(fx.event))
    .map((fx) => ({
      gameweek: fx.event,
      homeId: fx.team_h,
      awayId: fx.team_a,
      kickoff: fx.kickoff_time,
    }));

  const rows = buildCleanSheetRows(teams, fixtures, horizon);
  const defenders = toDefenders(bootstrap.elements ?? [], teams);

  return {
    horizon,
    currentGameweek: current,
    nextGameweek: next,
    rows,
    defenders,
    teams,
    source: "live",
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Fetch and transform the live FPL dataset. On any failure (network policy,
 * rate limit, malformed payload) we degrade gracefully to the mock dataset so
 * the UI never renders blank.
 */
export async function getCleanSheetData(): Promise<CleanSheetData> {
  try {
    const [bootstrap, fixtures] = await Promise.all([
      fetchJson<FplBootstrapRaw>("/bootstrap-static/"),
      fetchJson<FplFixtureRaw[]>("/fixtures/"),
    ]);
    return transform(bootstrap, fixtures);
  } catch (error) {
    console.warn("[fpl-api] Falling back to mock data:", error instanceof Error ? error.message : error);
    return generateMockCleanSheetData("mock");
  }
}
