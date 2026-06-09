import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import {
  getLatestTeamFromCareerStats,
  parseCareerStats,
} from '../espn/athlete-career-stats.parser';
import {
  formatSeasonLabel,
  parseOverviewAverages,
} from '../espn/athlete-stats.parser';
import { findPlayerInjury } from '../espn/injury.parser';
import {
  EspnCoreAthlete,
  EspnSeasonType,
  EspnService,
} from '../espn/espn.service';
import { mapNewsArticle } from '../news/news.mapper';

export type PlayerInjury = {
  status: string;
  type: string | null;
  detail: string | null;
  returnDate: string | null;
};

export type PlayerTeamSummary = {
  id: string;
  abbreviation: string;
  displayName: string;
};

export type PlayerProfile = {
  id: string;
  fullName: string;
  jersey: string | null;
  position: string | null;
  headshot: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  birthPlace: string | null;
  experience: number;
  college: string | null;
  active: boolean | null;
  status: string | null;
  latestTeam: PlayerTeamSummary | null;
  injury: PlayerInjury | null;
};

export type PlayerSeasonAverages = {
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgPct: number;
};

export type PlayerSeasonStatsResponse = {
  season: number;
  seasonLabel: string;
  seasonType: EspnSeasonType;
  participated: boolean;
  averages: PlayerSeasonAverages | null;
};

export type PlayerCareerSeasonStats = {
  season: number;
  seasonLabel: string;
  seasonType: EspnSeasonType;
  teamId: string | null;
  teamAbbr: string | null;
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgPct: number;
};

export type PlayerCareerStatsResponse = {
  seasons: PlayerCareerSeasonStats[];
};

@Injectable()
export class PlayersService {
  constructor(
    private readonly espn: EspnService,
    private readonly cache: CacheService,
  ) {}

  async findOne(id: string): Promise<PlayerProfile> {
    const cacheKey = `player-profile:${id}`;
    const cached = this.cache.get<PlayerProfile>(cacheKey);
    if (cached) return cached;

    const [athlete, regularStats, injuries] = await Promise.all([
      this.espn.getPlayer(id),
      this.espn.getAthleteStats(id, 'regular'),
      this.espn.getLeagueInjuries().catch(() => ({ items: [] })),
    ]);

    const profile = this.mapProfile(
      athlete,
      getLatestTeamFromCareerStats(parseCareerStats(regularStats, 'regular')),
      findPlayerInjury(injuries, id),
    );

    this.cache.set(cacheKey, profile, 10 * 60 * 1000);
    return profile;
  }

  async findSeasonStats(
    id: string,
    season?: number,
    seasonType: EspnSeasonType = 'regular',
  ): Promise<PlayerSeasonStatsResponse> {
    const currentSeason = await this.espn.resolveCurrentSeasonYear();
    const resolvedSeason = season ?? currentSeason;
    const cacheKey = `player-season-stats:${id}:${resolvedSeason}:${seasonType}`;

    const cached = this.cache.get<PlayerSeasonStatsResponse>(cacheKey);
    if (cached) return cached;

    const ttl = this.espn.seasonStatsTtl(resolvedSeason, currentSeason);
    const overview = await this.espn.getAthleteOverview(
      id,
      resolvedSeason,
      seasonType,
      ttl,
    );
    const averages = parseOverviewAverages(overview, seasonType);

    const result: PlayerSeasonStatsResponse = {
      season: resolvedSeason,
      seasonLabel: formatSeasonLabel(resolvedSeason),
      seasonType,
      participated: averages != null,
      averages,
    };

    this.cache.set(cacheKey, result, ttl);
    return result;
  }

  async findCareerStats(id: string): Promise<PlayerCareerStatsResponse> {
    const cacheKey = `player-career-stats:${id}`;
    const cached = this.cache.get<PlayerCareerStatsResponse>(cacheKey);
    if (cached) return cached;

    const [regularData, playoffData] = await Promise.all([
      this.espn.getAthleteStats(id, 'regular'),
      this.espn.getAthleteStats(id, 'playoffs'),
    ]);

    const seasons = [
      ...parseCareerStats(regularData, 'regular'),
      ...parseCareerStats(playoffData, 'playoffs'),
    ].map(({ teamDisplayName: _teamDisplayName, ...season }) => season);

    const result: PlayerCareerStatsResponse = { seasons };
    this.cache.set(cacheKey, result, 24 * 60 * 60 * 1000);
    return result;
  }

  async findNews(id: string, limit = 12) {
    const cacheKey = `player-news-mapped:${id}:${limit}`;
    const cached = this.cache.get<ReturnType<typeof mapNewsArticle>[]>(cacheKey);
    if (cached) return cached;

    const data = await this.espn.getAthleteNews(id);
    const articles = (data.articles ?? [])
      .slice(0, limit)
      .map((article) => mapNewsArticle(article));

    this.cache.set(cacheKey, articles, 10 * 60 * 1000);
    return articles;
  }

  private mapProfile(
    a: EspnCoreAthlete,
    latestTeam: PlayerTeamSummary | null,
    injury: PlayerInjury | null,
  ): PlayerProfile {
    const birthPlace = [a.birthPlace?.city, a.birthPlace?.state, a.birthPlace?.country]
      .filter(Boolean)
      .join(', ');

    return {
      id: a.id,
      fullName: a.fullName ?? 'Unknown',
      jersey: a.jersey ?? null,
      position: a.position?.displayName ?? a.position?.name ?? null,
      headshot: a.headshot?.href ?? null,
      age: a.age ?? null,
      height: a.displayHeight ?? null,
      weight: a.displayWeight ?? null,
      birthPlace: birthPlace || null,
      experience: a.experience?.years ?? 0,
      college: a.college?.name ?? null,
      active: a.active ?? null,
      status: a.status?.name ?? null,
      latestTeam,
      injury,
    };
  }
}
