import { Injectable } from '@nestjs/common';
import { EspnService } from '../espn/espn.service';
import { assignPlaces, type StandingSplit } from './standings-rank';

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

export type ConferenceStandings = {
  id: string;
  name: string;
  abbreviation: string;
  teams: StandingTeam[];
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
      conferences: conferences.map((conference) => ({
        id: conference.id,
        name: conference.name,
        abbreviation: conference.abbreviation,
        teams: this.rankEntries(conference.standings?.entries ?? []),
      })),
    };
  }

  private rankEntries(entries: EspnStandingEntry[]): StandingTeam[] {
    return assignPlaces(entries.map((entry) => this.mapEntry(entry))).map(
      (team) => this.present(team),
    );
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
