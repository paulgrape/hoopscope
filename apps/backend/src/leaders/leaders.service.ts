import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { formatSeasonLabel } from '../espn/athlete-stats.parser';
import { EspnService } from '../espn/espn.service';
import { isUnstartedCurrentSeason } from '../espn/season-year';
import { LeadersQueryDto } from './leaders-query.dto';
import { rankLeaders } from './leaders-rank';
import { parseLeagueByAthlete } from './leaders.parser';
import { LeaderSeasonRow, LeadersResponse } from './leaders.types';

@Injectable()
export class LeadersService {
  private readonly logger = new Logger(LeadersService.name);
  private readonly inFlight = new Map<string, Promise<LeaderSeasonRow[]>>();

  constructor(
    private readonly espn: EspnService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: LeadersQueryDto = {}): Promise<LeadersResponse> {
    const current = await this.espn.resolveCurrentSeason();
    const season = query.season ?? current.year;
    const seasonType = query.seasonType ?? 'regular';
    let rows: LeaderSeasonRow[] = [];
    if (!isUnstartedCurrentSeason(season, current)) {
      const key = `leaders:rows:${season}:${seasonType}`;
      const cached = this.cache.get<LeaderSeasonRow[]>(key);
      if (cached !== null) rows = cached;
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
        rows = await pending;
      }
    }
    return {
      season,
      seasonLabel: formatSeasonLabel(season),
      seasonType,
      currentSeason: current.year,
      categories: rankLeaders(rows, seasonType, query.stat, query.limit),
    };
  }

  private async loadRows(
    key: string,
    season: number,
    seasonType: 'regular' | 'playoffs',
    currentSeason: number,
  ): Promise<LeaderSeasonRow[]> {
    try {
      const rows = parseLeagueByAthlete(
        await this.espn.getLeagueByAthlete(season, seasonType),
      );
      this.cache.set(
        key,
        rows,
        this.espn.seasonStatsTtl(season, currentSeason),
      );
      return rows;
    } catch (error) {
      const stale = this.cache.getStale<LeaderSeasonRow[]>(key);
      if (stale !== null) {
        this.logger.warn(
          `ESPN leaders unavailable for ${season}; serving stale rows`,
        );
        return stale;
      }
      throw new ServiceUnavailableException(
        'Season leaders are temporarily unavailable',
        { cause: error },
      );
    }
  }
}
