import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import {
  isUpstreamNotFound,
  rethrowAsNotFound,
} from '../common/upstream-errors';
import {
  getLatestTeamFromCareerStats,
  parseCareerStats,
} from '../espn/athlete-career-stats.parser';
import {
  formatSeasonLabel,
  parseOverviewAverages,
} from '../espn/athlete-stats.parser';
import {
  EspnCoreAthlete,
  EspnSeasonType,
  EspnService,
} from '../espn/espn.service';
import { findPlayerInjury } from '../espn/injury.parser';
import { flattenRosterAthletes } from '../espn/roster.parser';
import { mapNewsArticle } from '../news/news.mapper';

const PLAYER_INDEX_CACHE_KEY = 'player-index';
const PLAYER_INDEX_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_SEARCH_LIMIT = 60;

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
  threePointPct: number;
  freeThrowPct: number;
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
  threePointPct: number;
  freeThrowPct: number;
};

export type PlayerCareerStatsResponse = {
  seasons: PlayerCareerSeasonStats[];
};

export type PlayerListItem = {
  id: string;
  fullName: string;
  jersey: string | null;
  position: string | null;
  headshot: string | null;
  team: PlayerTeamSummary | null;
};

export type PlayerSearchOptions = {
  q?: string;
  teamId?: string;
  limit?: number;
};

export type PlayerSearchResponse = {
  total: number;
  players: PlayerListItem[];
};

/** Accent-insensitive, punctuation-insensitive form used for name matching. */
function normalizeSearchTerm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

@Injectable()
export class PlayersService {
  constructor(
    private readonly espn: EspnService,
    private readonly cache: CacheService,
  ) {}

  async search({
    q,
    teamId,
    limit = DEFAULT_SEARCH_LIMIT,
  }: PlayerSearchOptions = {}): Promise<PlayerSearchResponse> {
    const index = await this.loadIndex();
    const tokens = normalizeSearchTerm(q ?? '')
      .split(' ')
      .filter(Boolean);

    const matches = index.filter((player) => {
      if (teamId && player.team?.id !== teamId) return false;
      if (tokens.length === 0) return true;

      const haystack = normalizeSearchTerm(player.fullName);
      return tokens.every((token) => haystack.includes(token));
    });

    return { total: matches.length, players: matches.slice(0, limit) };
  }

  async findOne(id: string): Promise<PlayerProfile> {
    const cacheKey = `player-profile:${id}`;
    const cached = this.cache.get<PlayerProfile>(cacheKey);
    if (cached) return cached;

    const [athlete, regularStats, injuries] = await Promise.all([
      this.espn
        .getPlayer(id)
        .catch(rethrowAsNotFound(`Player ${id} not found`)),
      this.espn.getAthleteStats(id, 'regular').catch((error: unknown) => {
        if (isUpstreamNotFound(error)) return {};
        throw error;
      }),
      this.espn.getLeagueInjuries().catch(() => ({ items: [] })),
    ]);

    if (!athlete?.id) {
      throw new NotFoundException(`Player ${id} not found`);
    }

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

  async findNews(id: string, limit = 6) {
    const cacheKey = `player-news-mapped:${id}:${limit}`;
    const cached =
      this.cache.get<ReturnType<typeof mapNewsArticle>[]>(cacheKey);
    if (cached) return cached;

    const data = await this.espn.getAthleteNews(id);
    const articles = (data.articles ?? [])
      .slice(0, limit)
      .map((article) => mapNewsArticle(article));

    this.cache.set(cacheKey, articles, 10 * 60 * 1000);
    return articles;
  }

  /**
   * ESPN has no league-wide player list, so the searchable index is every
   * current roster merged into one cached, name-sorted array.
   */
  private async loadIndex(): Promise<PlayerListItem[]> {
    const cached = this.cache.get<PlayerListItem[]>(PLAYER_INDEX_CACHE_KEY);
    if (cached) return cached;

    const teams = await this.loadTeamSummaries();
    const rosters = await Promise.all(
      teams.map((team) =>
        this.espn
          .getRoster(team.id)
          .then((data) => ({ team, athletes: flattenRosterAthletes(data) }))
          .catch(() => ({ team, athletes: [] })),
      ),
    );

    const byId = new Map<string, PlayerListItem>();
    for (const { team, athletes } of rosters) {
      for (const athlete of athletes) {
        const id = athlete.id ? String(athlete.id) : '';
        const fullName = athlete.fullName?.trim() ?? '';
        if (!id || !fullName) continue;

        byId.set(id, {
          id,
          fullName,
          jersey: athlete.jersey ?? null,
          position: athlete.position?.abbreviation ?? null,
          headshot: athlete.headshot?.href ?? null,
          team,
        });
      }
    }

    const index = [...byId.values()].sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );

    if (index.length > 0) {
      this.cache.set(PLAYER_INDEX_CACHE_KEY, index, PLAYER_INDEX_TTL_MS);
    }

    return index;
  }

  private async loadTeamSummaries(): Promise<PlayerTeamSummary[]> {
    const data = await this.espn.getTeams();
    const teams = data.sports?.[0]?.leagues?.[0]?.teams ?? [];

    return teams
      .map(({ team }) => ({
        id: team.id ?? '',
        abbreviation: team.abbreviation ?? '',
        displayName: team.displayName ?? team.name ?? 'Unknown',
      }))
      .filter((team) => team.id !== '');
  }

  private mapProfile(
    a: EspnCoreAthlete,
    latestTeam: PlayerTeamSummary | null,
    injury: PlayerInjury | null,
  ): PlayerProfile {
    const birthPlace = [
      a.birthPlace?.city,
      a.birthPlace?.state,
      a.birthPlace?.country,
    ]
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
