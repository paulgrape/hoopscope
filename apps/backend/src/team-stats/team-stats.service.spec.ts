import { ServiceUnavailableException, ValidationPipe } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { SeasonStatsQueryDto } from '../common/dto/season-stats-query.dto';
import { EspnByTeamResponse } from '../espn/espn.types';
import { EspnService } from '../espn/espn.service';
import { parseLeagueByTeam } from './team-stats.parser';
import { TeamStatsService } from './team-stats.service';

function feed(): EspnByTeamResponse {
  return {
    categories: [
      { name: 'general', names: ['gamesPlayed'] },
      {
        name: 'offensive',
        names: [
          'avgPoints',
          'avgTurnovers',
          'avgFieldGoalsAttempted',
          'avgOffensiveRebounds',
          'avgFreeThrowsAttempted',
        ],
      },
      {
        name: 'differential',
        names: [
          'avgPointsDifferential',
          'avgFieldGoalsAttemptedDifferential',
          'avgOffensiveReboundsDifferential',
          'avgTurnoversDifferential',
          'avgFreeThrowsAttemptedDifferential',
        ],
      },
    ],
    teams: [
      {
        team: { id: '7', displayName: 'Denver Nuggets', abbreviation: 'DEN' },
        categories: [
          { values: [82] },
          { values: [122.1, 12.2, 87.8, 9.8, 25.8] },
          { values: [5.1, -3.4, -1.4, 0.9, 2.6] },
        ],
      },
    ],
  };
}

describe('TeamStatsService', () => {
  let cache: CacheService;
  let service: TeamStatsService;
  let espn: {
    resolveCurrentSeason: jest.Mock;
    getLeagueByTeam: jest.Mock;
    seasonStatsTtl: jest.Mock;
  };
  const key = 'team-stats:rows:2027:regular';

  beforeEach(() => {
    cache = new CacheService();
    espn = {
      resolveCurrentSeason: jest
        .fn()
        .mockResolvedValue({ year: 2027, type: 2 }),
      getLeagueByTeam: jest.fn().mockResolvedValue(feed()),
      seasonStatsTtl: jest.fn().mockReturnValue(1_800_000),
    };
    service = new TeamStatsService(espn as unknown as EspnService, cache);
  });

  it('caches slim rows and skips ESPN on a cache hit', async () => {
    const set = jest.spyOn(cache, 'set');
    const result = await service.findAll();
    expect(result).toMatchObject({
      season: 2027,
      seasonLabel: '2026–27',
      currentSeason: 2027,
      seasonType: 'regular',
    });
    expect(result.teams[0]).toMatchObject({ id: '7', topg: 12.2, pts: 122.1 });
    await service.findAll();
    expect(espn.getLeagueByTeam).toHaveBeenCalledTimes(1);
    expect(espn.seasonStatsTtl).toHaveBeenCalledWith(2027, 2027);
    expect(set).toHaveBeenCalledWith(key, parseLeagueByTeam(feed()), 1_800_000);
  });

  it('requests the asked season and season type', async () => {
    espn.seasonStatsTtl.mockReturnValue(86_400_000);
    await service.findAll({ season: 2025, seasonType: 'playoffs' });
    expect(espn.getLeagueByTeam).toHaveBeenCalledWith(2025, 'playoffs');
    expect(espn.seasonStatsTtl).toHaveBeenCalledWith(2025, 2027);
    expect(cache.get('team-stats:rows:2025:playoffs')).not.toBeNull();
  });

  it('does not cache a failed fetch and retries the next request', async () => {
    espn.getLeagueByTeam.mockRejectedValueOnce(new Error('offline'));
    await expect(service.findAll()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(cache.getStale(key)).toBeNull();
    expect((await service.findAll()).teams).toHaveLength(1);
    expect(espn.getLeagueByTeam).toHaveBeenCalledTimes(2);
  });

  it('serves stale rows when ESPN fails', async () => {
    cache.set(key, parseLeagueByTeam(feed()), -1);
    espn.getLeagueByTeam.mockRejectedValue(new Error('offline'));
    expect((await service.findAll()).teams).toHaveLength(1);
    expect(cache.get(key)).toBeNull();
  });

  it.each(['regular', 'playoffs'] as const)(
    'returns an empty unstarted %s season without fetching',
    async (seasonType) => {
      cache.set(
        `team-stats:rows:2027:${seasonType}`,
        parseLeagueByTeam(feed()),
        60_000,
      );
      espn.resolveCurrentSeason.mockResolvedValue({ year: 2027, type: 1 });
      const result = await service.findAll({ seasonType });
      expect(result.teams).toEqual([]);
      expect(espn.getLeagueByTeam).not.toHaveBeenCalled();
    },
  );

  it('coalesces concurrent cold requests', async () => {
    const results = await Promise.all([service.findAll(), service.findAll()]);
    expect(results[0].teams).toHaveLength(1);
    expect(espn.getLeagueByTeam).toHaveBeenCalledTimes(1);
  });
});

describe('team stats query validation', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const transform = (value: Record<string, unknown>) =>
    pipe.transform(value, { type: 'query', metatype: SeasonStatsQueryDto });

  it('accepts a season and season type', async () => {
    await expect(
      transform({ season: '2026', seasonType: 'playoffs' }),
    ).resolves.toMatchObject({ season: 2026, seasonType: 'playoffs' });
  });

  it.each([{ season: '1946' }, { season: 'bad' }, { seasonType: 'preseason' }])(
    'rejects invalid query %j',
    async (query) => {
      await expect(transform(query)).rejects.toThrow();
    },
  );
});
