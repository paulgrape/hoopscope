import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { SeasonStatsQueryDto } from '../common/dto/season-stats-query.dto';
import { formatSeasonLabel } from '../espn/athlete-stats.parser';
import { EspnSeasonType, EspnService } from '../espn/espn.service';
import { isUnstartedCurrentSeason } from '../espn/season-year';
import { parseLeagueByTeam } from './team-stats.parser';
import { TeamStatRow, TeamStatsResponse } from './team-stats.types';

@Injectable()
export class TeamStatsService {
  private readonly logger = new Logger(TeamStatsService.name);
  private readonly inFlight = new Map<string, Promise<TeamStatRow[]>>();

  constructor(
    private readonly espn: EspnService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: SeasonStatsQueryDto = {}): Promise<TeamStatsResponse> {
    const current = await this.espn.resolveCurrentSeason();
    const season = query.season ?? current.year;
    const seasonType = query.seasonType ?? 'regular';
    let teams: TeamStatRow[] = [];
    if (!isUnstartedCurrentSeason(season, current)) {
      const key = `team-stats:rows:${season}:${seasonType}`;
      const cached = this.cache.get<TeamStatRow[]>(key);
      if (cached !== null) teams = cached;
      else {
        let pending = this.inFlight.get(key);
        if (!pending) {
          pending = this.loadRows(
            key,
            season,
            seasonType,
            current.year,
          ).finally(() => this.inFlight.delete(key));
          this.inFlight.set(key, pending);
        }
        teams = await pending;
      }
    }
    return {
      season,
      seasonLabel: formatSeasonLabel(season),
      seasonType,
      currentSeason: current.year,
      teams,
    };
  }

  private async loadRows(
    key: string,
    season: number,
    seasonType: EspnSeasonType,
    currentSeason: number,
  ): Promise<TeamStatRow[]> {
    try {
      const teams = parseLeagueByTeam(
        await this.espn.getLeagueByTeam(season, seasonType),
      );
      this.cache.set(
        key,
        teams,
        this.espn.seasonStatsTtl(season, currentSeason),
      );
      return teams;
    } catch (error) {
      const stale = this.cache.getStale<TeamStatRow[]>(key);
      if (stale !== null) {
        this.logger.warn(
          `ESPN team stats unavailable for ${season}; serving stale rows`,
        );
        return stale;
      }
      throw new ServiceUnavailableException(
        'Team stats are temporarily unavailable',
        { cause: error },
      );
    }
  }
}
