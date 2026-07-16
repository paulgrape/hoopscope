import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { CacheService } from '../cache/cache.service';

const SHOT_CHART_TTL_MS = 24 * 60 * 60 * 1000;

export type NbaSeasonType =
  | 'Regular Season'
  | 'Playoffs'
  | 'Pre Season'
  | 'All Star';

export type ShotChartDetailParams = {
  playerId: string | number;
  season: string;
  seasonType?: NbaSeasonType;
  teamId?: number;
  contextMeasure?: string;
};

export type NbaStatsResultSet = {
  name: string;
  headers: string[];
  rowSet: unknown[][];
};

export type NbaStatsResponse = {
  resultSets?: NbaStatsResultSet[];
};

@Injectable()
export class NbaStatsService {
  private readonly logger = new Logger(NbaStatsService.name);
  private readonly http: AxiosInstance;
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly cache: CacheService) {
    this.http = axios.create({
      baseURL: 'https://stats.nba.com/stats',
      timeout: 15000,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Connection: 'keep-alive',
        Origin: 'https://www.nba.com',
        Referer: 'https://www.nba.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'x-nba-stats-origin': 'stats',
        'x-nba-stats-token': 'true',
      },
    });
  }

  async getShotChartDetail(
    params: ShotChartDetailParams,
  ): Promise<NbaStatsResponse> {
    const seasonType = params.seasonType ?? 'Regular Season';
    const teamId = params.teamId ?? 0;
    const contextMeasure = params.contextMeasure ?? 'FGA';
    const playerId = String(params.playerId);

    const cacheKey = `nba-shotchartdetail:${playerId}:${params.season}:${seasonType}:${teamId}:${contextMeasure}`;

    const cached = this.cache.get<NbaStatsResponse>(cacheKey);
    if (cached !== null) return cached;

    const existing = this.inFlight.get(cacheKey);
    if (existing) return existing as Promise<NbaStatsResponse>;

    const promise = this.fetchShotChartDetail(
      {
        playerId,
        season: params.season,
        seasonType,
        teamId,
        contextMeasure,
      },
      cacheKey,
    ).finally(() => {
      this.inFlight.delete(cacheKey);
    });

    this.inFlight.set(cacheKey, promise);
    return promise;
  }

  async getShotChartLeagueWide(season: string): Promise<NbaStatsResponse> {
    const cacheKey = `nba-shotchartleaguewide:${season}`;

    const cached = this.cache.get<NbaStatsResponse>(cacheKey);
    if (cached !== null) return cached;

    const existing = this.inFlight.get(cacheKey);
    if (existing) return existing as Promise<NbaStatsResponse>;

    const promise = this.fetchShotChartLeagueWide(season, cacheKey).finally(
      () => {
        this.inFlight.delete(cacheKey);
      },
    );

    this.inFlight.set(cacheKey, promise);
    return promise;
  }

  private async fetchShotChartLeagueWide(
    season: string,
    cacheKey: string,
  ): Promise<NbaStatsResponse> {
    try {
      const { data } = await this.http.get<NbaStatsResponse>(
        '/shotchartleaguewide',
        {
          params: {
            LeagueID: '00',
            Season: season,
          },
        },
      );

      this.cache.set(cacheKey, data, SHOT_CHART_TTL_MS);
      return data;
    } catch (err) {
      const stale = this.cache.getStale<NbaStatsResponse>(cacheKey);
      if (stale !== null) {
        this.logger.warn(
          `NBA Stats shotchartleaguewide failed for ${cacheKey}; serving stale cache`,
        );
        return stale;
      }

      this.logger.error(
        `NBA Stats shotchartleaguewide failed for ${cacheKey}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }

  private async fetchShotChartDetail(
    params: {
      playerId: string;
      season: string;
      seasonType: NbaSeasonType;
      teamId: number;
      contextMeasure: string;
    },
    cacheKey: string,
  ): Promise<NbaStatsResponse> {
    try {
      const { data } = await this.http.get<NbaStatsResponse>(
        '/shotchartdetail',
        {
          params: {
            AheadBehind: '',
            ClutchTime: '',
            ContextFilter: '',
            ContextMeasure: params.contextMeasure,
            DateFrom: '',
            DateTo: '',
            EndPeriod: 10,
            EndRange: 28800,
            GameID: '',
            GameSegment: '',
            LastNGames: 0,
            LeagueID: '00',
            Location: '',
            Month: 0,
            OpponentTeamID: 0,
            Outcome: '',
            Period: 0,
            PlayerID: params.playerId,
            PlayerPosition: '',
            PointDiff: '',
            Position: '',
            RangeType: 0,
            RookieYear: '',
            Season: params.season,
            SeasonSegment: '',
            SeasonType: params.seasonType,
            StartPeriod: 1,
            StartRange: 0,
            TeamID: params.teamId,
            VsConference: '',
            VsDivision: '',
          },
        },
      );

      this.cache.set(cacheKey, data, SHOT_CHART_TTL_MS);
      return data;
    } catch (err) {
      const stale = this.cache.getStale<NbaStatsResponse>(cacheKey);
      if (stale !== null) {
        this.logger.warn(
          `NBA Stats shotchartdetail failed for ${cacheKey}; serving stale cache`,
        );
        return stale;
      }

      this.logger.error(
        `NBA Stats shotchartdetail failed for ${cacheKey}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }
}
