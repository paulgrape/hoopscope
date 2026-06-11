import { Injectable } from '@nestjs/common';
import { EspnService } from '../espn/espn.service';

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
        teams: (conference.standings?.entries ?? [])
          .map((entry) => this.mapEntry(entry))
          .sort((a, b) => a.seed - b.seed),
      })),
    };
  }

  private mapEntry(entry: EspnStandingEntry): StandingTeam {
    const { stats, team } = entry;
    const seed = Number(this.getStat(stats, 'playoffSeed') ?? 0);
    const wins = Number(this.getStat(stats, 'wins') ?? 0);
    const losses = Number(this.getStat(stats, 'losses') ?? 0);

    return {
      id: team.id,
      displayName: team.displayName,
      shortName: team.shortDisplayName ?? team.name ?? team.displayName,
      abbreviation: team.abbreviation,
      logo: team.logos?.[0]?.href ?? null,
      color: team.color ?? null,
      seed,
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
      playoffStatus: this.resolvePlayoffStatus(seed),
    };
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
