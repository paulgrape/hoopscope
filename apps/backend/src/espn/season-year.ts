export type EspnRosterSeason = {
  year?: number;
  type?: number;
  name?: string;
};

export type EspnSeasonMeta = {
  year: number;
  type?: number;
  name?: string;
};

/** ESPN season.type: 1 preseason, 2 regular, 3 postseason, 4 offseason. */
const UNSTARTED_SEASON_TYPES = new Set([1, 4]);

export function isUnstartedEspnSeason(
  season?: EspnRosterSeason | null,
): boolean {
  if (!season) return false;
  if (season.type != null && UNSTARTED_SEASON_TYPES.has(Number(season.type))) {
    return true;
  }

  const name = season.name?.trim().toLowerCase() ?? '';
  return name === 'preseason' || name === 'off season' || name === 'offseason';
}

/** True when this request is the live ESPN year and that year has not started. */
export function isUnstartedCurrentSeason(
  resolvedSeason: number,
  current: EspnSeasonMeta,
): boolean {
  return resolvedSeason === current.year && isUnstartedEspnSeason(current);
}
