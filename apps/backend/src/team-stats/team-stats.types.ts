import type { EspnSeasonType } from '../espn/espn.service';

export interface TeamStatRow {
  id: string;
  name: string;
  abbreviation: string;
  logo: string | null;
  gp: number;
  off: number | null;
  def: number | null;
  net: number | null;
  pace: number | null;
  topg: number | null;
  pts: number | null;
  oppPts: number | null;
  fgm: number | null;
  fga: number | null;
  fgPct: number | null;
  threePm: number | null;
  threePa: number | null;
  threePct: number | null;
  ftm: number | null;
  fta: number | null;
  ftPct: number | null;
  oreb: number | null;
  orPct: number | null;
  ast: number | null;
  astTo: number | null;
  scEff: number | null;
  shEff: number | null;
  dr: number | null;
  reb: number | null;
  stl: number | null;
  blk: number | null;
  pf: number | null;
  ptsDiff: number | null;
  fgPctDiff: number | null;
  threePctDiff: number | null;
  ftPctDiff: number | null;
  orDiff: number | null;
  drDiff: number | null;
  rebDiff: number | null;
  astDiff: number | null;
  toDiff: number | null;
  stlDiff: number | null;
  blkDiff: number | null;
  pfDiff: number | null;
}

export interface TeamStatsResponse {
  season: number;
  seasonLabel: string;
  seasonType: EspnSeasonType;
  currentSeason: number;
  teams: TeamStatRow[];
}
