import { ServiceUnavailableException, ValidationPipe } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { EspnService } from '../espn/espn.service';
import { LeadersQueryDto } from './leaders-query.dto';
import { leagueFixture } from './leaders.fixture';
import { parseLeagueByAthlete } from './leaders.parser';
import { LeadersService } from './leaders.service';

describe('LeadersService', () => {
  let cache: CacheService;
  let service: LeadersService;
  let espn: {
    resolveCurrentSeason: jest.Mock;
    getLeagueByAthlete: jest.Mock;
    seasonStatsTtl: jest.Mock;
  };
  const key = 'leaders:rows:2027:regular';

  beforeEach(() => {
    cache = new CacheService();
    espn = {
      resolveCurrentSeason: jest
        .fn()
        .mockResolvedValue({ year: 2027, type: 2 }),
      getLeagueByAthlete: jest.fn().mockResolvedValue(leagueFixture()),
      seasonStatsTtl: jest.fn().mockReturnValue(1_800_000),
    };
    service = new LeadersService(espn as unknown as EspnService, cache);
  });

  it('caches only slim rows with the season TTL, skipping ESPN on cache hits', async () => {
    const set = jest.spyOn(cache, 'set');
    const result = await service.findAll();
    expect(result).toMatchObject({
      season: 2027,
      seasonLabel: '2026–27',
      currentSeason: 2027,
      seasonType: 'regular',
    });
    await service.findAll({ stat: 'ast', limit: 50 });
    expect(espn.getLeagueByAthlete).toHaveBeenCalledTimes(1);
    expect(espn.seasonStatsTtl).toHaveBeenCalledWith(2027, 2027);
    expect(set).toHaveBeenCalledWith(
      key,
      parseLeagueByAthlete(leagueFixture()),
      1_800_000,
    );
  });

  it('does not cache a failed fetch as an empty board and retries next request', async () => {
    espn.getLeagueByAthlete.mockRejectedValueOnce(new Error('offline'));
    await expect(service.findAll()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(cache.getStale(key)).toBeNull();
    expect((await service.findAll()).categories[0].leaders).toHaveLength(1);
    expect(espn.getLeagueByAthlete).toHaveBeenCalledTimes(2);
  });

  it('serves stale rows without extending their TTL on an ESPN failure', async () => {
    cache.set(key, parseLeagueByAthlete(leagueFixture()), -1);
    espn.getLeagueByAthlete.mockRejectedValue(new Error('offline'));
    expect(
      (await service.findAll({ stat: 'pts' })).categories[0].leaders,
    ).toHaveLength(1);
    expect(cache.get(key)).toBeNull();
  });

  it.each(['regular', 'playoffs'] as const)(
    'returns an empty unstarted %s season without fetching or serving old rows',
    async (seasonType) => {
      cache.set(
        `leaders:rows:2027:${seasonType}`,
        parseLeagueByAthlete(leagueFixture()),
        60_000,
      );
      espn.resolveCurrentSeason.mockResolvedValue({ year: 2027, type: 1 });
      const result = await service.findAll({ seasonType });
      expect(
        result.categories.every((category) => category.leaders.length === 0),
      ).toBe(true);
      expect(espn.getLeagueByAthlete).not.toHaveBeenCalled();
    },
  );

  it('fetches historical playoffs separately and uses the historical TTL', async () => {
    espn.seasonStatsTtl.mockReturnValue(86_400_000);
    await service.findAll({ season: 2025, seasonType: 'playoffs' });
    expect(espn.getLeagueByAthlete).toHaveBeenCalledWith(2025, 'playoffs');
    expect(espn.seasonStatsTtl).toHaveBeenCalledWith(2025, 2027);
    expect(cache.get('leaders:rows:2025:playoffs')).not.toBeNull();
  });

  it('filters categories, defaults to five, and caps a full list at fifty', async () => {
    const base = parseLeagueByAthlete(leagueFixture())[0];
    cache.set(
      key,
      Array.from({ length: 60 }, (_, index) => ({
        ...base,
        playerId: String(index),
      })),
      60_000,
    );
    expect((await service.findAll()).categories[0].leaders).toHaveLength(5);
    const result = await service.findAll({ stat: 'pts', limit: 100 });
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].stat).toBe('pts');
    expect(result.categories[0].leaders).toHaveLength(50);
  });

  it('caches a successful empty season and coalesces concurrent cold requests', async () => {
    espn.getLeagueByAthlete.mockResolvedValue({ categories: [], athletes: [] });
    const results = await Promise.all([
      service.findAll(),
      service.findAll({ stat: 'pts' }),
    ]);
    expect(
      results[0].categories.every((category) => category.leaders.length === 0),
    ).toBe(true);
    expect(cache.get(key)).toEqual([]);
    await service.findAll();
    expect(espn.getLeagueByAthlete).toHaveBeenCalledTimes(1);
  });
});

describe('leaders query validation', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const transform = (value: Record<string, unknown>) =>
    pipe.transform(value, { type: 'query', metatype: LeadersQueryDto });

  it('reuses season validation and caps positive integer limits', async () => {
    await expect(
      transform({
        season: '2026',
        seasonType: 'playoffs',
        stat: 'threePm',
        limit: '200',
      }),
    ).resolves.toMatchObject({
      season: 2026,
      seasonType: 'playoffs',
      stat: 'threePm',
      limit: 50,
    });
  });

  it.each([
    { season: '1946' },
    { season: '2101' },
    { season: 'bad' },
    { seasonType: 'preseason' },
    { stat: 'unknown' },
    { limit: '0' },
    { limit: '-1' },
    { limit: '1.5' },
    { limit: '51.5' },
    { limit: 'Infinity' },
    { limit: ['2', '3'] },
  ])('rejects invalid query %j', async (query) => {
    await expect(transform(query)).rejects.toThrow();
  });
});
