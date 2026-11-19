import { EspnByTeamEntry, EspnByTeamResponse } from '../espn/espn.types';
import { TeamStatRow } from './team-stats.types';

/** Free-throw possession weight used by the standard estimate. */
const FREE_THROW_POSSESSION_WEIGHT = 0.44;

function numeric(value: number | string | null | undefined): number | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function readStats(
  data: EspnByTeamResponse,
  teamCategories: EspnByTeamEntry['categories'],
): Map<string, number | null> {
  const stats = new Map<string, number | null>();
  const seen = new Set<string>();
  const categories = teamCategories ?? [];

  (data.categories ?? []).forEach((category, index) => {
    const names = category.names ?? [];
    if (!category.name || names.length === 0 || seen.has(category.name)) return;
    seen.add(category.name);
    const values = categories[index]?.values ?? [];
    names.forEach((name, statIndex) => {
      if (!name || stats.has(name)) return;
      stats.set(name, numeric(values[statIndex]));
    });
  });

  return stats;
}

function stat(stats: Map<string, number | null>, name: string): number | null {
  return stats.get(name) ?? null;
}

function subtract(left: number | null, right: number | null): number | null {
  if (left == null || right == null) return null;
  return left - right;
}

function possessions(
  fga: number | null,
  offensiveRebounds: number | null,
  turnovers: number | null,
  fta: number | null,
): number | null {
  if (
    fga == null ||
    offensiveRebounds == null ||
    turnovers == null ||
    fta == null
  ) {
    return null;
  }
  const value =
    fga - offensiveRebounds + turnovers + FREE_THROW_POSSESSION_WEIGHT * fta;
  return value > 0 ? value : null;
}

function perHundred(
  points: number | null,
  possessionCount: number | null,
): number | null {
  if (points == null || possessionCount == null || possessionCount <= 0) {
    return null;
  }
  return (100 * points) / possessionCount;
}

/** ESPN stores offensive rebound percentage as a 0–1 ratio. */
function asPercent(value: number | null): number | null {
  if (value == null) return null;
  return Math.abs(value) <= 1 ? value * 100 : value;
}

function logoHref(
  logos: Array<{ href?: string; rel?: string[] }> | undefined,
): string | null {
  if (!logos?.length) return null;
  const preferred = logos.find(
    (logo) => logo.href && logo.rel?.includes('default'),
  );
  return preferred?.href ?? logos.find((logo) => logo.href)?.href ?? null;
}

export function parseLeagueByTeam(data: EspnByTeamResponse): TeamStatRow[] {
  const rows: TeamStatRow[] = [];

  for (const entry of data.teams ?? []) {
    const team = entry.team;
    const id = team?.id == null ? '' : String(team.id);
    const name = team?.displayName?.trim();
    if (!id || !name) continue;

    const stats = readStats(data, entry.categories);
    const gp = stat(stats, 'gamesPlayed');
    if (gp == null || gp <= 0) continue;

    const pts = stat(stats, 'avgPoints');
    const fga = stat(stats, 'avgFieldGoalsAttempted');
    const oreb = stat(stats, 'avgOffensiveRebounds');
    const topg = stat(stats, 'avgTurnovers');
    const fta = stat(stats, 'avgFreeThrowsAttempted');
    const ptsDiff = stat(stats, 'avgPointsDifferential');
    const fgaDiff = stat(stats, 'avgFieldGoalsAttemptedDifferential');
    const orDiff = stat(stats, 'avgOffensiveReboundsDifferential');
    const toDiff = stat(stats, 'avgTurnoversDifferential');
    const ftaDiff = stat(stats, 'avgFreeThrowsAttemptedDifferential');

    const pace = possessions(fga, oreb, topg, fta);
    const oppPts = subtract(pts, ptsDiff);
    const opponentPace = possessions(
      subtract(fga, fgaDiff),
      subtract(oreb, orDiff),
      subtract(topg, toDiff),
      subtract(fta, ftaDiff),
    );
    const off = perHundred(pts, pace);
    const def = perHundred(oppPts, opponentPace);

    rows.push({
      id,
      name,
      abbreviation: team?.abbreviation?.trim() || name,
      logo: logoHref(team?.logos),
      gp,
      off,
      def,
      net: off == null || def == null ? null : off - def,
      pace,
      topg,
      pts,
      oppPts,
      fgm: stat(stats, 'avgFieldGoalsMade'),
      fga,
      fgPct: stat(stats, 'fieldGoalPct'),
      threePm: stat(stats, 'avgThreePointFieldGoalsMade'),
      threePa: stat(stats, 'avgThreePointFieldGoalsAttempted'),
      threePct:
        stat(stats, 'threePointFieldGoalPct') ?? stat(stats, 'threePointPct'),
      ftm: stat(stats, 'avgFreeThrowsMade'),
      fta,
      ftPct: stat(stats, 'freeThrowPct'),
      oreb,
      orPct: asPercent(stat(stats, 'offensiveReboundPct')),
      ast: stat(stats, 'avgAssists'),
      astTo: stat(stats, 'assistTurnoverRatio'),
      scEff: stat(stats, 'scoringEfficiency'),
      shEff: stat(stats, 'shootingEfficiency'),
      dr: stat(stats, 'avgDefensiveRebounds'),
      reb: stat(stats, 'avgRebounds'),
      stl: stat(stats, 'avgSteals'),
      blk: stat(stats, 'avgBlocks'),
      pf: stat(stats, 'avgFouls'),
      ptsDiff,
      fgPctDiff: stat(stats, 'fieldGoalPctDifferential'),
      threePctDiff: stat(stats, 'threePointFieldGoalPctDifferential'),
      ftPctDiff: stat(stats, 'freeThrowPctDifferential'),
      orDiff,
      drDiff: stat(stats, 'avgDefensiveReboundsDifferential'),
      rebDiff: stat(stats, 'avgReboundsDifferential'),
      astDiff: stat(stats, 'avgAssistsDifferential'),
      toDiff,
      stlDiff: stat(stats, 'avgStealsDifferential'),
      blkDiff: stat(stats, 'avgBlocksDifferential'),
      pfDiff: stat(stats, 'avgFoulsDifferential'),
    });
  }

  return rows;
}
