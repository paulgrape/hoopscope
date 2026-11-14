import { formatSeasonLabel } from './athlete-stats.parser';
import { EspnAthleteGamelog } from './espn.service';

export type PlayerRecentGame = {
  id: string;
  date: string;
  opponentId: string | null;
  opponentAbbr: string | null;
  homeAway: 'home' | 'away';
  result: string | null;
  score: string | null;
  min: number | null;
  pts: number | null;
  reb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  fg: string | null;
  fgPct: number | null;
  threePoint: string | null;
  threePointPct: number | null;
  freeThrow: string | null;
  freeThrowPct: number | null;
  played: boolean;
};

export type PlayerRecentGames = {
  season: number | null;
  seasonLabel: string | null;
  games: PlayerRecentGame[];
};

const DEFAULT_LIMIT = 10;

export function parseRecentGames(
  data: EspnAthleteGamelog,
  limit = DEFAULT_LIMIT,
): PlayerRecentGames {
  const season = seasonYear(data);
  const chosen = seasonTypesToRead(data);
  const names = data.names ?? [];
  const seen = new Set<string>();
  const rows: Array<{ eventId: string; stats: string[]; date: string }> = [];

  for (const seasonType of chosen) {
    for (const category of seasonType.categories ?? []) {
      for (const event of category.events ?? []) {
        if (!event.eventId || seen.has(event.eventId)) continue;
        seen.add(event.eventId);
        rows.push({
          eventId: event.eventId,
          stats: event.stats ?? [],
          date: data.events?.[event.eventId]?.gameDate ?? '',
        });
      }
    }
  }

  rows.sort((left, right) => compareDatesDesc(left.date, right.date));

  const resolvedLimit =
    Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT;

  return {
    season,
    seasonLabel: season == null ? null : formatSeasonLabel(season),
    games: rows.slice(0, resolvedLimit).map((row) => {
      const event = data.events?.[row.eventId];
      const values = statValues(names, row.stats);
      const min = readNumber(values, 'minutes');

      return {
        id: row.eventId,
        date: event?.gameDate ?? row.date,
        opponentId: event?.opponent?.id ?? null,
        opponentAbbr: event?.opponent?.abbreviation ?? null,
        homeAway: event?.atVs?.trim() === '@' ? 'away' : 'home',
        result: event?.gameResult ?? null,
        score: event?.score ?? null,
        min,
        pts: readNumber(values, 'points'),
        reb: readNumber(values, 'totalRebounds'),
        ast: readNumber(values, 'assists'),
        stl: readNumber(values, 'steals'),
        blk: readNumber(values, 'blocks'),
        tov: readNumber(values, 'turnovers'),
        fg: readText(values, 'fieldGoalsMade-fieldGoalsAttempted'),
        fgPct: readNumber(values, 'fieldGoalPct'),
        threePoint: readText(
          values,
          'threePointFieldGoalsMade-threePointFieldGoalsAttempted',
        ),
        threePointPct: readNumber(values, 'threePointPct'),
        freeThrow: readText(values, 'freeThrowsMade-freeThrowsAttempted'),
        freeThrowPct: readNumber(values, 'freeThrowPct'),
        played: min != null,
      };
    }),
  };
}

function seasonYear(data: EspnAthleteGamelog): number | null {
  const value = data.filters?.find((filter) => filter.name === 'season')?.value;
  if (!value || !/^\d+$/.test(value)) return null;
  return Number(value);
}

function seasonTypesToRead(data: EspnAthleteGamelog) {
  const seasonTypes = data.seasonTypes ?? [];
  const competitive = seasonTypes.filter(
    (seasonType) => !isPreseason(seasonType.displayName),
  );
  const hasCompetitiveGame = competitive.some((seasonType) =>
    (seasonType.categories ?? []).some(
      (category) => (category.events ?? []).length > 0,
    ),
  );

  return hasCompetitiveGame ? competitive : seasonTypes;
}

function isPreseason(displayName: string | undefined): boolean {
  return (displayName ?? '').toLowerCase().includes('preseason');
}

function compareDatesDesc(left: string, right: string): number {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
  if (Number.isNaN(leftTime)) return 1;
  if (Number.isNaN(rightTime)) return -1;
  return rightTime - leftTime;
}

function statValues(
  names: string[],
  stats: string[],
): Record<string, string | undefined> {
  return Object.fromEntries(names.map((name, index) => [name, stats[index]]));
}

function readText(
  values: Record<string, string | undefined>,
  key: string,
): string | null {
  const raw = values[key]?.trim();
  if (!raw || raw === '--' || raw.toUpperCase() === 'DNP') return null;
  return raw;
}

function readNumber(
  values: Record<string, string | undefined>,
  key: string,
): number | null {
  const raw = readText(values, key);
  if (raw == null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
