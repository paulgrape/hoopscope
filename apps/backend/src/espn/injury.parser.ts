import {
  EspnInjuryEntry,
  EspnInjuryReport,
  EspnInjuryTeam,
} from '../espn/espn.service';

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
  for (const team of injuryTeams(report)) {
    for (const injury of team.injuries ?? []) {
      if (athleteIdFrom(injury) !== athleteId) continue;

      return {
        status: injury.status ?? 'Unknown',
        type: injuryBodyPart(injury),
        detail: injury.shortComment ?? injury.longComment ?? null,
        returnDate: injury.details?.returnDate ?? null,
      };
    }
  }

  return null;
}

function injuryTeams(report: EspnInjuryReport): EspnInjuryTeam[] {
  return report.injuries ?? report.items ?? [];
}

function athleteIdFrom(injury: EspnInjuryEntry): string | null {
  if (injury.athlete?.id) return String(injury.athlete.id);

  const links = injury.athlete?.links ?? [];
  const href =
    links.find((link) => link.rel?.includes('playercard'))?.href ??
    links.find((link) => link.href?.includes('/id/'))?.href;
  const match = href ? /\/id\/(\d+)/.exec(href) : null;
  return match?.[1] ?? null;
}

function injuryBodyPart(injury: EspnInjuryEntry): string | null {
  const detailType = injury.details?.type?.trim();
  if (detailType) return detailType;

  const name = injury.type?.name?.trim();
  if (name && !name.startsWith('INJURY_STATUS')) return name;

  return null;
}
