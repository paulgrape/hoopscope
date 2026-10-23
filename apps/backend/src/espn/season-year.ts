import { type EspnEventSeason } from './espn.types';

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

/** ESPN season.type: 1 preseason, 2 regular, 3 postseason, 4 offseason, 5 play-in. */
const UNSTARTED_SEASON_TYPES = new Set([1, 4]);

export type GameSeasonType = 'preseason' | 'regular' | 'playoffs' | 'play-in';

const SEASON_TYPE_BY_CODE: Record<number, GameSeasonType> = {
  1: 'preseason',
  2: 'regular',
  3: 'playoffs',
  5: 'play-in',
};

const SEASON_TYPE_BY_SLUG: Record<string, GameSeasonType> = {
  preseason: 'preseason',
  'regular-season': 'regular',
  'post-season': 'playoffs',
  'play-in': 'play-in',
};

/** Map an ESPN event season onto a public game season type. Unknown values are omitted. */
export function mapEspnSeasonType(
  season?: EspnEventSeason | null,
): GameSeasonType | null {
  if (!season) return null;

  if (season.type != null) {
    const code = Number(season.type);
    const mapped = SEASON_TYPE_BY_CODE[code];
    if (mapped) return mapped;
  }

  const slug = season.slug?.trim().toLowerCase() ?? '';
  return SEASON_TYPE_BY_SLUG[slug] ?? null;
}

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

/** Past years are finished. The live year is finished once ESPN reports the offseason. */
export function isSeasonComplete(
  season: number,
  current: EspnSeasonMeta,
): boolean {
  if (season < current.year) return true;
  if (season > current.year) return false;
  return Number(current.type) === 4;
}

/**
 * Regular season, play-in, postseason, and a missing type change as games are played.
 * Preseason and offseason lines stay on the long cache.
 */
export function usesLiveStatsTtl(current: EspnSeasonMeta): boolean {
  const type = current.type == null ? null : Number(current.type);
  if (type === 1 || type === 4) return false;
  return true;
}
