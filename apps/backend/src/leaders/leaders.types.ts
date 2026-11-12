import type { EspnSeasonType } from '../espn/espn.service';

export const LEADER_STATS = [
  'pts',
  'reb',
  'ast',
  'stl',
  'blk',
  'min',
  'threePm',
  'fgPct',
  'threePointPct',
  'freeThrowPct',
] as const;

export type LeaderStat = (typeof LEADER_STATS)[number];
export type QualificationStat = 'gp' | 'fgm' | 'ftm' | 'threePmTotal';

export interface LeaderPlayer {
  playerId: string;
  name: string;
  headshot: string | null;
  position: string | null;
  teamId: string | null;
  teamAbbreviation: string | null;
  teamName: string | null;
  gamesPlayed: number;
}

/** Only these small records are retained; never cache the raw byathlete feed. */
export interface LeaderSeasonRow extends LeaderPlayer {
  values: Record<LeaderStat, number | null>;
  fgm: number;
  ftm: number;
  threePmTotal: number;
}

export interface LeaderCategory {
  stat: LeaderStat;
  label: string;
  abbreviation: string;
  format: 'average' | 'percent';
  qualification: {
    stat: QualificationStat;
    minimum: number;
    teamGames: number;
  };
  leaders: Array<LeaderPlayer & { rank: number; value: number }>;
}

export interface LeadersResponse {
  season: number;
  seasonLabel: string;
  seasonType: EspnSeasonType;
  currentSeason: number;
  categories: LeaderCategory[];
}
