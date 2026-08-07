import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { rethrowAsNotFound } from '../common/upstream-errors';
import {
  formatSeasonLabel,
  parseOverviewStats,
} from '../espn/athlete-stats.parser';
import { EspnSeasonType, EspnService } from '../espn/espn.service';
import { EspnByAthleteEntry, espnHeadshotHref } from '../espn/espn.types';

export type TeamSeasonType = EspnSeasonType;

export type TeamSeasonStatPlayer = {
  id: string;
  fullName: string;
  jersey: string | null;
  position: string | null;
  headshot: string | null;
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

export type TeamSeasonStatsResponse = {
  season: number;
  seasonLabel: string;
  seasonType: TeamSeasonType;
  participated: boolean;
  players: TeamSeasonStatPlayer[];
};

type RosterPlayer = {
  id: string;
  fullName: string;
  jersey: string | null;
  position: string | null;
  headshot: string | null;
};

@Injectable()
export class TeamsService {
  constructor(
    private readonly espn: EspnService,
    private readonly cache: CacheService,
  ) {}

  async findAll() {
    const data = await this.espn.getTeams();
    const teams = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
    return teams.map(({ team }) => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      displayName: team.displayName,
      logo: team.logos?.[0]?.href ?? null,
      color: team.color,
      alternateColor: team.alternateColor,
      location: team.location,
    }));
  }

  async findOne(id: string) {
    const data = await this.espn
      .getTeam(id)
      .catch(rethrowAsNotFound(`Team ${id} not found`));
    const team = data?.team;
    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }

    return {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      displayName: team.displayName,
      logo: team.logos?.[0]?.href ?? null,
      color: team.color,
      alternateColor: team.alternateColor,
      location: team.location,
      record: team.record?.items?.[0]?.summary ?? null,
    };
  }

  async findRoster(teamId: string) {
    const data = await this.espn.getRoster(teamId);
    return (data.athletes ?? []).map((p) => ({
      id: p.id,
      fullName: p.fullName ?? 'Unknown',
      jersey: p.jersey ?? null,
      position: p.position?.abbreviation ?? null,
      headshot: p.headshot?.href ?? null,
      age: p.age,
      experience: p.experience?.years ?? 0,
    }));
  }

  async findSeasonStats(
    teamId: string,
    season?: number,
    seasonType: TeamSeasonType = 'regular',
  ): Promise<TeamSeasonStatsResponse> {
    const currentSeason = await this.espn.resolveCurrentSeasonYear();
    const resolvedSeason = season ?? currentSeason;
    const cacheKey = `team-stats:${teamId}:${resolvedSeason}:${seasonType}`;

    const cached = this.cache.get<TeamSeasonStatsResponse>(cacheKey);
    if (cached) return cached;

    const ttl = this.espn.seasonStatsTtl(resolvedSeason, currentSeason);
    const roster = await this.resolveSeasonRoster(
      teamId,
      resolvedSeason,
      seasonType,
    );

    const players = (
      await this.mapWithConcurrency(
        roster,
        async (player) => {
          const overview = await this.espn.getAthleteOverview(
            player.id,
            resolvedSeason,
            seasonType,
            ttl,
          );
          return parseOverviewStats(player, overview, seasonType);
        },
        8,
      )
    ).filter((player): player is TeamSeasonStatPlayer => player != null);

    players.sort((a, b) => b.pts - a.pts);

    const participated =
      seasonType === 'regular' ? players.length > 0 : players.length > 0;

    const result: TeamSeasonStatsResponse = {
      season: resolvedSeason,
      seasonLabel: formatSeasonLabel(resolvedSeason),
      seasonType,
      participated,
      players: seasonType === 'playoffs' && !participated ? [] : players,
    };

    this.cache.set(cacheKey, result, ttl);
    return result;
  }

  private async resolveSeasonRoster(
    teamId: string,
    season: number,
    seasonType: TeamSeasonType,
  ): Promise<RosterPlayer[]> {
    const data = await this.espn.getRoster(teamId, season);
    const athletes = data.athletes ?? [];

    if (athletes.length > 0) {
      return athletes.map((p) => ({
        id: p.id,
        fullName: p.fullName ?? 'Unknown',
        jersey: p.jersey ?? null,
        position: p.position?.abbreviation ?? null,
        headshot: p.headshot?.href ?? null,
      }));
    }

    return this.rosterFromByAthleteFallback(teamId, season, seasonType);
  }

  private async rosterFromByAthleteFallback(
    teamId: string,
    season: number,
    seasonType: TeamSeasonType,
  ): Promise<RosterPlayer[]> {
    const data = await this.espn.getTeamAthleteStatsFallback(
      teamId,
      season,
      seasonType,
    );

    const athletes: EspnByAthleteEntry[] =
      data?.athletes ??
      data?.items ??
      data?.leaders ??
      data?.categories?.[0]?.leaders ??
      [];

    return athletes
      .map((entry) => {
        const athlete = entry.athlete ?? entry;
        const id = String(athlete?.id ?? entry?.id ?? '');
        if (!id) return null;

        return {
          id,
          fullName:
            athlete?.displayName ??
            athlete?.fullName ??
            athlete?.shortName ??
            'Unknown',
          jersey: athlete?.jersey ?? null,
          position:
            athlete?.position?.abbreviation ??
            athlete?.position?.displayName ??
            null,
          headshot: espnHeadshotHref(athlete?.headshot),
        } satisfies RosterPlayer;
      })
      .filter((player): player is RosterPlayer => player != null);
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    mapper: (item: T, index: number) => Promise<R>,
    limit: number,
  ): Promise<R[]> {
    if (items.length === 0) return [];

    const results = new Array<R>(items.length);
    let nextIndex = 0;

    const workers = Array.from(
      { length: Math.min(limit, items.length) },
      async () => {
        while (nextIndex < items.length) {
          const index = nextIndex++;
          results[index] = await mapper(items[index], index);
        }
      },
    );

    await Promise.all(workers);
    return results;
  }
}
