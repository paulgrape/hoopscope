export interface PlayerStat {
  name: string;
  points: number;
  rebounds: number;
  assists: number;
  minutes: string;
}

export interface TeamSnapshot {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  color: string;
}

export interface GameSnapshot {
  id: string;
  homeTeam: TeamSnapshot;
  awayTeam: TeamSnapshot;
  homePlayers: PlayerStat[];
  awayPlayers: PlayerStat[];
  finalScore: { home: number; away: number };
  date: string;
}

export const GAME_SNAPSHOTS: GameSnapshot[] = [];
