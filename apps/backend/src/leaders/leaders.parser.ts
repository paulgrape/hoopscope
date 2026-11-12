import { EspnByAthleteResponse, espnHeadshotHref } from '../espn/espn.types';
import { LeaderSeasonRow, LeaderStat } from './leaders.types';

const STAT_NAMES: Record<LeaderStat, string> = {
  pts: 'avgPoints',
  reb: 'avgRebounds',
  ast: 'avgAssists',
  stl: 'avgSteals',
  blk: 'avgBlocks',
  min: 'avgMinutes',
  threePm: 'avgThreePointFieldGoalsMade',
  fgPct: 'fieldGoalPct',
  threePointPct: 'threePointFieldGoalPct',
  freeThrowPct: 'freeThrowPct',
};

function numeric(value: number | string | null | undefined): number | null {
  if (value == null || (typeof value === 'string' && value.trim() === ''))
    return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function parseLeagueByAthlete(
  data: EspnByAthleteResponse,
): LeaderSeasonRow[] {
  const names = new Map(
    data.categories?.map((category) => [category.name, category.names ?? []]),
  );
  const rows = new Map<string, LeaderSeasonRow>();
  for (const entry of data.athletes ?? []) {
    const athlete = entry.athlete;
    if (!athlete?.id || !(athlete.displayName || athlete.fullName)) continue;
    const stats = new Map<string, number | null>();
    for (const category of entry.categories ?? []) {
      for (const [index, name] of (names.get(category.name) ?? []).entries()) {
        stats.set(name, numeric(category.values?.[index]));
      }
    }
    const team =
      athlete.teams?.find((team) => team.id === athlete.teamId) ??
      athlete.teams?.[0];
    const row: LeaderSeasonRow = {
      playerId: athlete.id,
      name: athlete.displayName || athlete.fullName!,
      headshot: espnHeadshotHref(athlete.headshot),
      position: athlete.position?.abbreviation ?? null,
      teamId: athlete.teamId ?? team?.id ?? null,
      teamAbbreviation: team?.abbreviation ?? athlete.teamShortName ?? null,
      teamName: team?.displayName ?? team?.name ?? athlete.teamName ?? null,
      gamesPlayed: stats.get('gamesPlayed') ?? 0,
      values: Object.fromEntries(
        Object.entries(STAT_NAMES).map(([key, name]) => [
          key,
          stats.get(name) ?? null,
        ]),
      ) as LeaderSeasonRow['values'],
      fgm: stats.get('fieldGoalsMade') ?? 0,
      ftm: stats.get('freeThrowsMade') ?? 0,
      threePmTotal: stats.get('threePointFieldGoalsMade') ?? 0,
    };
    const previous = rows.get(row.playerId);
    if (!previous || row.gamesPlayed > previous.gamesPlayed)
      rows.set(row.playerId, row);
  }
  return [...rows.values()];
}
