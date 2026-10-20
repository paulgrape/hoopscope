import { Injectable } from '@nestjs/common';
import { EspnService } from '../espn/espn.service';
import {
  assignPlaces,
  divisionIdForTeam,
  divisionsForConference,
  type NbaDivision,
  type StandingSplit,
} from './standings-rank';

type EspnStandingStat = {
  name?: string;
  displayValue?: string;
  value?: number;
};

type EspnStandingEntry = {
  team: {
    id: string;
    name?: string;
    displayName: string;
    shortDisplayName?: string;
    abbreviation: string;
    logos?: Array<{ href?: string }>;
    color?: string;
  };
  stats: EspnStandingStat[];
};

type EspnStandingsResponse = {
  children?: Array<{
    id: string;
    name: string;
    abbreviation: string;
    standings?: {
      seasonDisplayName?: string;
      entries?: EspnStandingEntry[];
    };
  }>;
};

export type PlayoffStatus = 'playoff' | 'play-in' | 'out';

export type StandingTeam = {
  id: string;
  displayName: string;
  shortName: string;
  abbreviation: string;
  logo: string | null;
  color: string | null;
  seed: number;
  wins: number;
  losses: number;
  winPct: string;
  gamesBehind: string;
  streak: string;
  home: string;
  road: string;
  vsDiv: string;
  vsConf: string;
  lastTen: string;
  clincher: string | null;
  playoffStatus: PlayoffStatus;
};

export type DivisionStandings = {
  id: string;
  name: string;
  teams: StandingTeam[];
};

export type ConferenceStandings = {
  id: string;
  name: string;
  abbreviation: string;
  teams: StandingTeam[];
  divisions: DivisionStandings[];
};

export type StandingsResponse = {
  season: string;
  conferences: ConferenceStandings[];
};

type ParsedStanding = StandingTeam & {
  conference: StandingSplit;
  division: StandingSplit;
  differential: number;
};

@Injectable()
export class StandingsService {
  constructor(private readonly espn: EspnService) {}

  async findAll(): Promise<StandingsResponse> {
    const data = (await this.espn.getStandings()) as EspnStandingsResponse;
    const conferences = data.children ?? [];

    const season =
      conferences[0]?.standings?.seasonDisplayName ?? 'Current Season';

    return {
      season,
      conferences: conferences.map((conference) =>
        this.buildConference(conference),
      ),
    };
  }

  private buildConference(conference: {
    id: string;
    name: string;
    abbreviation: string;
    standings?: { entries?: EspnStandingEntry[] };
  }): ConferenceStandings {
    const placed = assignPlaces(
      (conference.standings?.entries ?? []).map((entry) =>
        this.mapEntry(entry),
      ),
    );
    const teams = placed.map((team) => this.present(team));
    const presentedById = new Map(teams.map((team) => [team.id, team]));
    const side = conferenceSide(conference.name, conference.abbreviation);

    const divisions = side
      ? divisionsForConference(side)
          .map((division) =>
            this.rankDivision(
              division,
              placed.filter(
                (team) => divisionIdForTeam(team.id) === division.id,
              ),
              presentedById,
            ),
          )
          .filter((division) => division.teams.length > 0)
      : [];

    return {
      id: conference.id,
      name: conference.name,
      abbreviation: conference.abbreviation,
      teams,
      divisions,
    };
  }

  private rankDivision(
    division: NbaDivision,
    members: ParsedStanding[],
    presentedById: Map<string, StandingTeam>,
  ): DivisionStandings {
    const ranked = assignPlaces(members);
    const leader = ranked[0];

    return {
      id: division.id,
      name: division.name,
      teams: ranked.map((team) => {
        const conferenceTeam = presentedById.get(team.id) ?? this.present(team);
        return {
          ...conferenceTeam,
          seed: team.seed,
          gamesBehind: leader ? formatGamesBehind(leader, team) : '—',
        };
      }),
    };
  }

  private present(team: ParsedStanding): StandingTeam {
    const {
      conference: _conference,
      division: _division,
      differential: _differential,
      ...standing
    } = team;
    return {
      ...standing,
      playoffStatus: this.resolvePlayoffStatus(standing.seed),
    };
  }

  private mapEntry(entry: EspnStandingEntry): ParsedStanding {
    const { stats, team } = entry;
    const wins = this.readCount(stats, 'wins');
    const losses = this.readCount(stats, 'losses');

    return {
      id: team.id,
      displayName: team.displayName,
      shortName: team.shortDisplayName ?? team.name ?? team.displayName,
      abbreviation: team.abbreviation,
      logo: team.logos?.[0]?.href ?? null,
      color: team.color ?? null,
      seed: 0,
      wins,
      losses,
      winPct: this.getStat(stats, 'winPercent') ?? '—',
      gamesBehind: this.getStat(stats, 'gamesBehind') ?? '—',
      streak: this.getStat(stats, 'streak') ?? '—',
      home: this.getStat(stats, 'Home') ?? '—',
      road: this.getStat(stats, 'Road') ?? '—',
      vsDiv: this.getStat(stats, 'vs. Div.') ?? '—',
      vsConf: this.getStat(stats, 'vs. Conf.') ?? '—',
      lastTen: this.getStat(stats, 'Last Ten Games') ?? '—',
      clincher: this.getStat(stats, 'clincher'),
      playoffStatus: 'out',
      conference: readRecord(this.getStat(stats, 'vs. Conf.')),
      division: readRecord(this.getStat(stats, 'vs. Div.')),
      differential: readDifferential(findStat(stats, 'differential')),
    };
  }

  private readCount(stats: EspnStandingStat[], name: string): number {
    const parsed = Number(this.getStat(stats, name) ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getStat(stats: EspnStandingStat[], name: string): string | null {
    const stat = stats.find((item) => item.name === name);
    if (!stat) return null;
    return stat.displayValue ?? stat.value?.toString() ?? null;
  }

  private resolvePlayoffStatus(seed: number): PlayoffStatus {
    if (seed >= 1 && seed <= 6) return 'playoff';
    if (seed >= 7 && seed <= 10) return 'play-in';
    return 'out';
  }
}

function findStat(
  stats: EspnStandingStat[],
  name: string,
): EspnStandingStat | undefined {
  return stats.find((item) => item.name === name);
}

function readRecord(display: string | null): StandingSplit {
  if (!display) return { wins: 0, losses: 0 };
  const match = /^(\d+)\s*-\s*(\d+)/.exec(display.trim());
  if (!match) return { wins: 0, losses: 0 };
  return { wins: Number(match[1]), losses: Number(match[2]) };
}

function conferenceSide(
  name: string,
  abbreviation: string,
): 'east' | 'west' | null {
  const label = `${name} ${abbreviation}`.toLowerCase();
  if (label.includes('east')) return 'east';
  if (label.includes('west')) return 'west';
  return null;
}

function formatGamesBehind(
  leader: { wins: number; losses: number },
  team: { wins: number; losses: number },
): string {
  const gamesBehind =
    (leader.wins - team.wins + (team.losses - leader.losses)) / 2;
  if (gamesBehind <= 0) return '-';
  return gamesBehind.toFixed(1);
}

function readDifferential(stat: EspnStandingStat | undefined): number {
  if (!stat) return 0;
  if (typeof stat.value === 'number' && Number.isFinite(stat.value)) {
    return stat.value;
  }
  if (typeof stat.displayValue === 'string') {
    const parsed = Number(stat.displayValue);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}
