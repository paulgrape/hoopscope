import { formatSeasonLabel, toNumber } from './athlete-stats.parser';
import { EspnAthleteStatsResponse, EspnSeasonType } from './espn.service';

export type ParsedCareerSeasonStats = {
  season: number;
  seasonLabel: string;
  seasonType: EspnSeasonType;
  teamId: string | null;
  teamAbbr: string | null;
  teamDisplayName: string | null;
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgPct: number;
};

function resolveTeamAbbr(
  data: EspnAthleteStatsResponse,
  teamId: string | null,
  teamSlug: string | undefined,
): string | null {
  if (!teamId && !teamSlug) return null;

  const teams = data.teams ?? {};
  if (teamSlug && teams[teamSlug]?.abbreviation) {
    return teams[teamSlug].abbreviation ?? null;
  }

  for (const team of Object.values(teams)) {
    if (teamId && String(team.id) === teamId) {
      return team.abbreviation ?? null;
    }
  }

  return null;
}

function resolveTeamDisplayName(
  data: EspnAthleteStatsResponse,
  teamId: string | null,
  teamSlug: string | undefined,
): string | null {
  const teams = data.teams ?? {};
  if (teamSlug && teams[teamSlug]?.displayName) {
    return teams[teamSlug].displayName ?? null;
  }

  for (const team of Object.values(teams)) {
    if (teamId && String(team.id) === teamId) {
      return team.displayName ?? null;
    }
  }

  return null;
}

export function parseCareerStats(
  data: EspnAthleteStatsResponse,
  seasonType: EspnSeasonType,
): ParsedCareerSeasonStats[] {
  const averagesCategory = data.categories?.find(
    (category) => category.name === 'averages',
  );
  const names = averagesCategory?.names ?? [];
  if (names.length === 0) return [];

  const seasons: ParsedCareerSeasonStats[] = [];

  for (const entry of averagesCategory?.statistics ?? []) {
    const values = Object.fromEntries(
      names.map((name, index) => [name, entry.stats?.[index]]),
    );

    const seasonYear = Number(entry.season?.year ?? 0);
    const gp = Number(values.gamesPlayed ?? 0);
    if (!Number.isFinite(seasonYear) || seasonYear <= 0) continue;
    if (!Number.isFinite(gp) || gp <= 0) continue;

    const teamId = entry.teamId ? String(entry.teamId) : null;
    const isSeasonTotal = teamId == null;

    seasons.push({
      season: seasonYear,
      seasonLabel: entry.season?.displayName ?? formatSeasonLabel(seasonYear),
      seasonType,
      teamId,
      teamAbbr: isSeasonTotal
        ? 'TOT'
        : resolveTeamAbbr(data, teamId, entry.teamSlug),
      teamDisplayName: isSeasonTotal
        ? 'Total'
        : resolveTeamDisplayName(data, teamId, entry.teamSlug),
      gp,
      min: toNumber(values.avgMinutes),
      pts: toNumber(values.avgPoints),
      reb: toNumber(values.avgRebounds),
      ast: toNumber(values.avgAssists),
      stl: toNumber(values.avgSteals),
      blk: toNumber(values.avgBlocks),
      tov: toNumber(values.avgTurnovers),
      fgPct: toNumber(values.fieldGoalPct),
    });
  }

  seasons.sort((a, b) => {
    if (b.season !== a.season) return b.season - a.season;
    if (a.seasonType === b.seasonType) return 0;
    return a.seasonType === 'regular' ? -1 : 1;
  });

  return seasons;
}

export function getLatestTeamFromCareerStats(
  seasons: ParsedCareerSeasonStats[],
): {
  id: string;
  abbreviation: string;
  displayName: string;
} | null {
  const latestRegular = seasons.find(
    (season) => season.seasonType === 'regular' && season.teamId,
  );
  if (!latestRegular?.teamId) return null;

  const splits = seasons.filter(
    (season) =>
      season.seasonType === 'regular' &&
      season.season === latestRegular.season &&
      season.teamId,
  );
  const latestSplit = splits[splits.length - 1] ?? latestRegular;
  if (!latestSplit.teamId) return null;

  return {
    id: latestSplit.teamId,
    abbreviation: latestSplit.teamAbbr ?? latestSplit.teamId,
    displayName:
      latestSplit.teamDisplayName ?? latestSplit.teamAbbr ?? latestSplit.teamId,
  };
}
