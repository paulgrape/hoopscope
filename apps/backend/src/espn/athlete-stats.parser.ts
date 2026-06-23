import { EspnAthleteOverview, EspnSeasonType } from './espn.service';

export type AthleteSeasonAverages = {
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgPct: number;
  threePointPct: number;
  freeThrowPct: number;
};

export const SPLIT_BY_SEASON_TYPE: Record<EspnSeasonType, string> = {
  regular: 'Regular Season',
  playoffs: 'Postseason',
};

export function formatSeasonLabel(season: number): string {
  const start = season - 1;
  return `${start}–${String(season).slice(-2)}`;
}

export function toNumber(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseOverviewAverages(
  overview: EspnAthleteOverview,
  seasonType: EspnSeasonType,
): AthleteSeasonAverages | null {
  const statistics = overview.statistics;
  if (!statistics?.names || !statistics.splits) return null;

  const splitName = SPLIT_BY_SEASON_TYPE[seasonType];
  const split = statistics.splits.find((s) => s.displayName === splitName);
  if (!split?.stats) return null;

  const values = Object.fromEntries(
    statistics.names.map((name, index) => [name, split.stats![index]]),
  );

  const gp = Number(values.gamesPlayed ?? 0);
  if (!Number.isFinite(gp) || gp <= 0) return null;

  return {
    gp,
    min: toNumber(values.avgMinutes),
    pts: toNumber(values.avgPoints),
    reb: toNumber(values.avgRebounds),
    ast: toNumber(values.avgAssists),
    stl: toNumber(values.avgSteals),
    blk: toNumber(values.avgBlocks),
    tov: toNumber(values.avgTurnovers),
    fgPct: toNumber(values.fieldGoalPct),
    threePointPct: toNumber(values.threePointPct),
    freeThrowPct: toNumber(values.freeThrowPct),
  };
}

export type OverviewPlayerIdentity = {
  id: string;
  fullName: string;
  jersey: string | null;
  position: string | null;
  headshot: string | null;
};

export function parseOverviewStats<T extends OverviewPlayerIdentity>(
  player: T,
  overview: EspnAthleteOverview,
  seasonType: EspnSeasonType,
): (T & AthleteSeasonAverages) | null {
  const averages = parseOverviewAverages(overview, seasonType);
  if (!averages) return null;

  return {
    ...player,
    ...averages,
  };
}
