import { EspnRosterResponse } from './espn.service';

export type EspnRosterAthlete = NonNullable<
  EspnRosterResponse['athletes']
>[number];

/**
 * ESPN serves rosters either flat (`athletes[]`) or grouped by position, where
 * every group carries its players in `items[]`.
 */
export function flattenRosterAthletes(
  data: EspnRosterResponse,
): EspnRosterAthlete[] {
  const entries: unknown[] = data.athletes ?? [];
  const athletes: EspnRosterAthlete[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;

    const items = (entry as { items?: unknown }).items;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === 'object') {
          athletes.push(item as EspnRosterAthlete);
        }
      }
      continue;
    }

    athletes.push(entry as EspnRosterAthlete);
  }

  return athletes;
}
