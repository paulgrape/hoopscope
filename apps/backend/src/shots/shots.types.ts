export type ShotPoint = {
  x: number;
  y: number;
  made: boolean;
  /** 2 or 3 point attempt */
  value: 2 | 3;
  distance: number;
  zoneBasic: string;
  zoneArea: string;
  zoneRange: string;
};

export type LeagueZoneAvg = {
  zoneBasic: string;
  zoneArea: string;
  zoneRange: string;
  fga: number;
  fgm: number;
  fgPct: number;
};

export type ShotHeatmapResponse = {
  playerId: string;
  playerName: string;
  season: string;
  seasonType: string;
  shots: ShotPoint[];
  leagueZones: LeagueZoneAvg[];
};
