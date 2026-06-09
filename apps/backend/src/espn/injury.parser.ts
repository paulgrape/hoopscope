import { EspnInjuryReport } from '../espn/espn.service';

export type PlayerInjury = {
  status: string;
  type: string | null;
  detail: string | null;
  returnDate: string | null;
};

export function findPlayerInjury(
  report: EspnInjuryReport,
  athleteId: string,
): PlayerInjury | null {
  for (const team of report.items ?? []) {
    for (const injury of team.injuries ?? []) {
      if (String(injury.athlete?.id ?? '') !== athleteId) continue;

      return {
        status: injury.status ?? 'Unknown',
        type: injury.type?.name ?? injury.type?.description ?? null,
        detail: injury.shortComment ?? injury.longComment ?? null,
        returnDate: injury.date ?? null,
      };
    }
  }

  return null;
}
