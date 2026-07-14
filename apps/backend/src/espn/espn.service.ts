import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CacheService } from '../cache/cache.service';

export interface EspnCoreAthlete {
  id: string;
  guid?: string;
  fullName?: string;
  jersey?: string;
  age?: number;
  displayHeight?: string;
  displayWeight?: string;
  active?: boolean;
  birthPlace?: {
    city?: string;
    state?: string;
    country?: string;
  };
  position?: {
    name?: string;
    displayName?: string;
  };
  headshot?: {
    href?: string;
  };
  experience?: {
    years?: number;
  };
  college?: {
    name?: string;
  };
  status?: {
    name?: string;
  };
}

export type EspnSeasonType = 'regular' | 'playoffs';

export interface EspnAthleteOverview {
  statistics?: {
    labels?: string[];
    names?: string[];
    splits?: Array<{
      displayName?: string;
      stats?: string[];
    }>;
  };
}

export interface EspnRosterResponse {
  season?: { year?: number; displayName?: string };
  athletes?: Array<{
    id: string;
    fullName?: string;
    jersey?: string;
    age?: number;
    position?: { abbreviation?: string };
    headshot?: { href?: string };
    experience?: { years?: number };
  }>;
}

export interface EspnAthleteStatsResponse {
  teams?: Record<
    string,
    {
      id?: string;
      abbreviation?: string;
      displayName?: string;
    }
  >;
  categories?: Array<{
    name?: string;
    displayName?: string;
    names?: string[];
    statistics?: Array<{
      teamId?: string;
      teamSlug?: string;
      season?: { year?: number; displayName?: string };
      stats?: string[];
    }>;
  }>;
}

export type EspnNewsArticle = {
  id: number;
  type?: string;
  headline: string;
  description?: string;
  published?: string;
  lastModified?: string;
  byline?: string;
  images?: Array<{
    type?: string;
    url?: string;
    caption?: string;
    width?: number;
    height?: number;
  }>;
  categories?: Array<{
    type?: string;
    description?: string;
  }>;
  links?: {
    web?: { href?: string };
  };
};

type EspnNowFeedItem = {
  id?: number;
  type?: string;
  headline?: string;
  description?: string;
  published?: string;
  lastModified?: string;
  byline?: string;
  images?: EspnNewsArticle['images'];
  categories?: EspnNewsArticle['categories'];
  links?: EspnNewsArticle['links'];
};

type EspnNowFeedResponse = {
  feed?: EspnNowFeedItem[];
};

export interface EspnInjuryReport {
  items?: Array<{
    id?: string;
    displayName?: string;
    injuries?: Array<{
      status?: string;
      shortComment?: string;
      longComment?: string;
      date?: string;
      athlete?: {
        id?: string;
        displayName?: string;
      };
      type?: {
        name?: string;
        description?: string;
      };
    }>;
  }>;
}

@Injectable()
export class EspnService {
  private readonly http: AxiosInstance;
  private readonly logger = new Logger(EspnService.name);

  // TTLs
  private readonly TTL_TEAMS = 24 * 60 * 60 * 1000; // 24h
  private readonly TTL_PLAYERS = 24 * 60 * 60 * 1000;
  private readonly TTL_SCORES = 60 * 1000; // 60s
  private readonly TTL_NEWS = 10 * 60 * 1000; // 10m
  private readonly TTL_INJURIES = 10 * 60 * 1000; // 10m
  private readonly TTL_STANDINGS = 30 * 60 * 1000; // 30m
  readonly TTL_SEASON_STATS_CURRENT = 30 * 60 * 1000; // 30m
  readonly TTL_SEASON_STATS_HISTORIC = 24 * 60 * 60 * 1000; // 24h

  private readonly webApiBase: string;
  private readonly coreApiBase: string;
  private readonly nowApiUrl: string;
  private readonly standingsApiBase: string;

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {
    this.webApiBase =
      this.config.get<string>('ESPN_WEB_API_BASE_URL') ??
      'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba';
    this.coreApiBase =
      this.config.get<string>('ESPN_CORE_BASE_URL') ??
      'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba';
    this.nowApiUrl =
      this.config.get<string>('ESPN_NOW_API_URL') ??
      'https://api-app.espn.com/allsports/apis/v1/now';
    this.standingsApiBase =
      this.config.get<string>('ESPN_STANDINGS_BASE_URL') ??
      'https://site.api.espn.com/apis/v2/sports/basketball';

    this.http = axios.create({
      baseURL:
        this.config.get<string>('ESPN_BASE_URL') ??
        'https://site.api.espn.com/apis/site/v2/sports/basketball/nba',
      timeout: 8000,
    });
  }

  async get<T>(path: string, ttlMs: number): Promise<T> {
    const cached = this.cache.get<T>(path);
    if (cached) return cached;

    this.logger.log(`ESPN fetch: ${path}`);
    const { data } = await this.http.get<T>(path);
    this.cache.set(path, data, ttlMs);
    return data;
  }

  getTeams() {
    return this.get('/teams', this.TTL_TEAMS);
  }
  getTeam(id: string) {
    return this.get(`/teams/${id}`, this.TTL_TEAMS);
  }
  getRoster(teamId: string, season?: number) {
    const path =
      season != null
        ? `/teams/${teamId}/roster?season=${season}`
        : `/teams/${teamId}/roster`;
    return this.get<EspnRosterResponse>(path, this.TTL_PLAYERS);
  }

  toEspnSeasonType(seasonType: EspnSeasonType): number {
    return seasonType === 'playoffs' ? 3 : 2;
  }

  seasonStatsTtl(season: number, currentSeason: number): number {
    return season >= currentSeason
      ? this.TTL_SEASON_STATS_CURRENT
      : this.TTL_SEASON_STATS_HISTORIC;
  }

  async resolveCurrentSeasonYear(): Promise<number> {
    const cacheKey = 'nba-current-season-year';
    const cached = this.cache.get<number>(cacheKey);
    if (cached) return cached;

    const data = await this.getRoster('1');
    const year = data.season?.year ?? new Date().getFullYear();
    this.cache.set(cacheKey, year, this.TTL_PLAYERS);
    return year;
  }

  async getAthleteOverview(
    athleteId: string,
    season: number,
    seasonType: EspnSeasonType,
    ttlMs: number,
  ): Promise<EspnAthleteOverview> {
    const seasontype = this.toEspnSeasonType(seasonType);
    const url = `${this.webApiBase}/athletes/${athleteId}/overview`;
    const cacheKey = `athlete-overview:${athleteId}:${season}:${seasontype}`;

    const cached = this.cache.get<EspnAthleteOverview>(cacheKey);
    if (cached) return cached;

    this.logger.log(`ESPN fetch: ${url}?season=${season}&seasontype=${seasontype}`);
    const { data } = await this.http.get<EspnAthleteOverview>(url, {
      params: { season, seasontype },
      timeout: 12_000,
    });
    this.cache.set(cacheKey, data, ttlMs);
    return data;
  }

  async getTeamAthleteStatsFallback(
    teamId: string,
    season: number,
    seasonType: EspnSeasonType,
  ): Promise<unknown> {
    const seasontype = this.toEspnSeasonType(seasonType);
    const url = `${this.webApiBase}/statistics/byathlete`;
    const cacheKey = `byathlete:${teamId}:${season}:${seasontype}`;

    const cached = this.cache.get<unknown>(cacheKey);
    if (cached) return cached;

    this.logger.log(
      `ESPN fetch: ${url}?team=${teamId}&season=${season}&seasontype=${seasontype}`,
    );
    const { data } = await this.http.get<unknown>(url, {
      params: { team: teamId, season, seasontype, limit: 200 },
      timeout: 20_000,
    });
    this.cache.set(cacheKey, data, this.TTL_PLAYERS);
    return data;
  }
  async getPlayer(id: string): Promise<EspnCoreAthlete> {
    const url = `${this.coreApiBase}/athletes/${id}`;

    const cached = this.cache.get<EspnCoreAthlete>(url);
    if (cached) return cached;

    const { data } = await this.http.get<EspnCoreAthlete>(url, {
      timeout: 15_000,
    });
    this.cache.set(url, data, this.TTL_PLAYERS);
    return data;
  }
  getScoreboard(date?: string) {
    const path = date ? `/scoreboard?dates=${date}` : '/scoreboard';
    return this.get(path, this.TTL_SCORES);
  }
  getGameSummary(eventId: string) {
    return this.get(`/summary?event=${eventId}`, this.TTL_SCORES);
  }
  getNews() {
    return this.get('/news?limit=50', this.TTL_NEWS);
  }

  async getAthleteStats(
    athleteId: string,
    seasonType: EspnSeasonType = 'regular',
  ): Promise<EspnAthleteStatsResponse> {
    const seasontype = this.toEspnSeasonType(seasonType);
    const url = `${this.webApiBase}/athletes/${athleteId}/stats`;
    const cacheKey = `athlete-stats:${athleteId}:${seasontype}`;

    const cached = this.cache.get<EspnAthleteStatsResponse>(cacheKey);
    if (cached) return cached;

    this.logger.log(`ESPN fetch: ${url}?seasontype=${seasontype}`);
    const { data } = await this.http.get<EspnAthleteStatsResponse>(url, {
      params: { seasontype },
      timeout: 15_000,
    });
    this.cache.set(cacheKey, data, this.TTL_PLAYERS);
    return data;
  }

  async getAthleteNews(athleteId: string): Promise<{ articles?: EspnNewsArticle[] }> {
    const cacheKey = `athlete-news-now:${athleteId}:6`;
    const cached = this.cache.get<{ articles?: EspnNewsArticle[] }>(cacheKey);
    if (cached) return cached;

    const athlete = await this.getPlayer(athleteId);
    if (!athlete.guid) {
      this.logger.warn(`No contentcategory guid for athlete ${athleteId}`);
      return { articles: [] };
    }

    this.logger.log(
      `ESPN fetch: ${this.nowApiUrl} contentcategories=${athlete.guid}`,
    );
    const { data } = await this.http.get<EspnNowFeedResponse>(this.nowApiUrl, {
      params: {
        region: 'us',
        lang: 'en',
        contentorigin: 'espn',
        limit: 6,
        content:
          'shortstop,story,blog,recap,theundefeated,fivethirtyeight,video',
        contentcategories: athlete.guid,
        enable: 'header,authors',
      },
      timeout: 15_000,
    });

    const articles: EspnNewsArticle[] = (data.feed ?? [])
      .filter((item): item is EspnNowFeedItem & { id: number; headline: string } =>
        typeof item.id === 'number' && Boolean(item.headline),
      )
      .map((item) => ({
        id: item.id,
        type: item.type,
        headline: item.headline,
        description: item.description,
        published: item.published,
        lastModified: item.lastModified,
        byline: item.byline,
        images: item.images,
        categories: item.categories,
        links: item.links,
      }));

    const result = { articles };
    this.cache.set(cacheKey, result, this.TTL_NEWS);
    return result;
  }

  async getLeagueInjuries(): Promise<EspnInjuryReport> {
    const path = '/injuries';
    const cacheKey = 'league-injuries';

    const cached = this.cache.get<EspnInjuryReport>(cacheKey);
    if (cached) return cached;

    this.logger.log(`ESPN fetch: ${path}`);
    const { data } = await this.http.get<EspnInjuryReport>(path, {
      timeout: 15_000,
    });
    this.cache.set(cacheKey, data, this.TTL_INJURIES);
    return data;
  }

  async getStandings(league = 'nba') {
    const url = `${this.standingsApiBase}/${league}/standings`;

    const cached = this.cache.get<unknown>(url);
    if (cached) return cached;

    this.logger.log(`ESPN fetch: ${url}`);
    const { data } = await this.http.get<unknown>(url, { timeout: 20_000 });
    this.cache.set(url, data, this.TTL_STANDINGS);
    return data;
  }
}
