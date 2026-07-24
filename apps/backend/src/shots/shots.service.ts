import { Injectable } from '@nestjs/common';
import { NbaSeasonType, NbaStatsService } from '../nba-stats/nba-stats.service';
import { LeagueZoneAvg, ShotHeatmapResponse, ShotPoint } from './shots.types';

function stringifyCell(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

@Injectable()
export class ShotsService {
  constructor(private readonly nbaStats: NbaStatsService) {}

  async getHeatmap(
    playerId: string,
    season: string,
    seasonType: NbaSeasonType = 'Regular Season',
  ): Promise<ShotHeatmapResponse> {
    const [raw, leagueRaw] = await Promise.all([
      this.nbaStats.getShotChartDetail({
        playerId,
        season,
        seasonType,
        teamId: 0,
        contextMeasure: 'FGA',
      }),
      this.nbaStats.getShotChartLeagueWide(season),
    ]);

    const detail = raw.resultSets?.find(
      (set) => set.name === 'Shot_Chart_Detail',
    );

    const leagueZones = this.parseLeagueZones(leagueRaw);

    if (!detail) {
      return {
        playerId,
        playerName: '',
        season,
        seasonType,
        shots: [],
        leagueZones,
      };
    }

    const index = Object.fromEntries(
      detail.headers.map((header, i) => [header, i]),
    ) as Record<string, number>;

    const str = (row: unknown[], key: string): string =>
      stringifyCell(row[index[key]]);
    const num = (row: unknown[], key: string): number =>
      Number(row[index[key]] ?? 0);

    let playerName = '';
    const shots: ShotPoint[] = detail.rowSet.map((row) => {
      if (!playerName) {
        const first = str(row, 'PLAYER_NAME');
        if (first) playerName = first;
      }

      const zoneBasic = str(row, 'SHOT_ZONE_BASIC');
      const shotType = str(row, 'SHOT_TYPE').toUpperCase();
      const distance = num(row, 'SHOT_DISTANCE');
      const value: 2 | 3 =
        shotType.includes('3') ||
        zoneBasic.toLowerCase().includes('3') ||
        distance >= 22
          ? 3
          : 2;

      return {
        x: num(row, 'LOC_X'),
        y: num(row, 'LOC_Y'),
        made: num(row, 'SHOT_MADE_FLAG') === 1,
        value,
        distance,
        zoneBasic,
        zoneArea: str(row, 'SHOT_ZONE_AREA'),
        zoneRange: str(row, 'SHOT_ZONE_RANGE'),
      };
    });

    return {
      playerId,
      playerName,
      season,
      seasonType,
      shots,
      leagueZones,
    };
  }

  private parseLeagueZones(raw: {
    resultSets?: Array<{
      name: string;
      headers: string[];
      rowSet: unknown[][];
    }>;
  }): LeagueZoneAvg[] {
    const set =
      raw.resultSets?.find((item) => item.name === 'League_Wide') ??
      raw.resultSets?.[0];

    if (!set) return [];

    const index = Object.fromEntries(
      set.headers.map((header, i) => [header, i]),
    ) as Record<string, number>;

    const str = (row: unknown[], key: string): string =>
      stringifyCell(row[index[key]]);
    const num = (row: unknown[], key: string): number =>
      Number(row[index[key]] ?? 0);

    return set.rowSet.map((row) => ({
      zoneBasic: str(row, 'SHOT_ZONE_BASIC'),
      zoneArea: str(row, 'SHOT_ZONE_AREA'),
      zoneRange: str(row, 'SHOT_ZONE_RANGE'),
      fga: num(row, 'FGA'),
      fgm: num(row, 'FGM'),
      fgPct: num(row, 'FG_PCT'),
    }));
  }
}
