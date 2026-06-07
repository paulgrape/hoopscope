import historicGames from './historic-games.json';

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

export interface HistoricPlayEvent {
  id: string;
  sequenceNumber: number;
  period: number;
  clock: string;
  text: string;
  shortText?: string;
  scoringPlay: boolean;
  scoreValue: number;
  teamId?: string;
  homeScore: number;
  awayScore: number;
}

export interface HistoricGame extends GameSnapshot {
  name: string;
  status: string;
  venue?: string;
  periodScores?: {
    home: number[];
    away: number[];
  };
  plays: HistoricPlayEvent[];
}

export const HISTORIC_GAMES = historicGames as HistoricGame[];
export const GAME_SNAPSHOTS: GameSnapshot[] = HISTORIC_GAMES;
