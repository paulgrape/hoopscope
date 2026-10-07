import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CacheService } from '../cache/cache.service';
import { EspnService } from './espn.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    isAxiosError: (err: unknown) =>
      (err as { isAxiosError?: boolean })?.isAxiosError === true,
  },
}));

function axiosError(status?: number) {
  return Object.assign(new Error(status ? `HTTP ${status}` : 'network'), {
    isAxiosError: true,
    response: status ? { status, headers: {} } : undefined,
  });
}

const fastRetryConfig: Record<string, string> = {
  ESPN_RETRY_ATTEMPTS: '2',
  ESPN_RETRY_BASE_DELAY_MS: '1',
  ESPN_RETRY_MAX_DELAY_MS: '2',
};

describe('EspnService resilience', () => {
  let service: EspnService;
  let cache: CacheService;
  let httpGet: jest.Mock;

  beforeEach(() => {
    httpGet = jest.fn();
    (axios.create as jest.Mock).mockReturnValue({ get: httpGet });

    const config = {
      get: (key: string) => fastRetryConfig[key],
    } as unknown as ConfigService;

    cache = new CacheService();
    service = new EspnService(config, cache);
  });

  it('fetches once and serves the fresh cache afterwards', async () => {
    httpGet.mockResolvedValue({ data: { ok: true } });

    await expect(service.get('/teams', 60_000)).resolves.toEqual({ ok: true });
    await expect(service.get('/teams', 60_000)).resolves.toEqual({ ok: true });

    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('filters every fallback page before returning historical roster candidates', async () => {
    httpGet.mockImplementation(
      (url: string, options?: { params?: { page?: number } }) => {
        if (url === '/teams/16')
          return Promise.resolve({
            data: {
              team: { id: '16', name: 'Timberwolves', abbreviation: 'MIN' },
            },
          });
        return Promise.resolve({
          data:
            options?.params?.page === 2
              ? {
                  athletes: [
                    {
                      athlete: {
                        id: 'traded',
                        teamId: '30',
                        teams: [
                          { abbreviation: 'CHA' },
                          { abbreviation: 'MIN' },
                        ],
                      },
                    },
                  ],
                }
              : {
                  pagination: { pages: 2 },
                  athletes: [
                    { athlete: { id: 'other', teamId: '25' } },
                    { athlete: { id: 'wolf', teamId: '16' } },
                  ],
                },
        });
      },
    );

    const result = await service.getTeamAthleteStatsFallback(
      '16',
      2025,
      'regular',
    );

    expect(result.athletes?.map((entry) => entry.athlete?.id)).toEqual([
      'wolf',
      'traded',
    ]);
    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/statistics/byathlete'),
      {
        params: {
          season: 2025,
          seasontype: 2,
          limit: 1000,
          page: 1,
          isqualified: false,
        },
        timeout: 20_000,
      },
    );
    await service.getTeamAthleteStatsFallback('16', 2025, 'regular');
    expect(httpGet).toHaveBeenCalledTimes(3);
  });

  it('de-duplicates concurrent requests for the same key', async () => {
    let resolveRequest!: (value: { data: unknown }) => void;
    httpGet.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = service.get('/scoreboard', 1000);
    const second = service.get('/scoreboard', 1000);

    resolveRequest({ data: { games: [] } });

    await expect(first).resolves.toEqual({ games: [] });
    await expect(second).resolves.toEqual({ games: [] });
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('retries retryable errors and succeeds', async () => {
    httpGet
      .mockRejectedValueOnce(axiosError(500))
      .mockRejectedValueOnce(axiosError(429))
      .mockResolvedValueOnce({ data: { ok: true } });

    await expect(service.get('/news', 1000)).resolves.toEqual({ ok: true });
    expect(httpGet).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable client errors', async () => {
    httpGet.mockRejectedValue(axiosError(404));

    await expect(service.get('/missing', 1000)).rejects.toThrow('HTTP 404');
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('falls back to stale cache when all retries fail', async () => {
    // Prime the cache, then let the entry expire.
    httpGet.mockResolvedValueOnce({ data: { version: 'stale-but-usable' } });
    await service.get('/standings', 1);
    await new Promise((resolve) => setTimeout(resolve, 10));

    httpGet.mockRejectedValue(axiosError(503));

    await expect(service.get('/standings', 1)).resolves.toEqual({
      version: 'stale-but-usable',
    });
  });

  it('rethrows when retries fail and no stale cache exists', async () => {
    httpGet.mockRejectedValue(axiosError());

    await expect(service.get('/unreachable', 1000)).rejects.toThrow('network');
    // 1 initial attempt + 2 retries.
    expect(httpGet).toHaveBeenCalledTimes(3);
  });
});

describe('EspnService request targets', () => {
  let service: EspnService;
  let httpGet: jest.Mock;

  beforeEach(() => {
    httpGet = jest.fn().mockResolvedValue({ data: { ok: true } });
    (axios.create as jest.Mock).mockReturnValue({ get: httpGet });

    const config = {
      get: (key: string) => fastRetryConfig[key],
    } as unknown as ConfigService;

    service = new EspnService(config, new CacheService());
  });

  it('keeps numeric ids on the ESPN path', async () => {
    await service.getTeam('16');
    await service.getPlayer('1966');
    await service.getAthleteOverview('1966', 2025, 'regular', 1000);
    await service.getAthleteStats('1966', 'regular');
    await service.getScoreboard('20260131');
    await service.getGameSummary('401585601');
    await service.getRoster('16', 2025);

    expect(httpGet).toHaveBeenCalledWith('/teams/16');
    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/athletes/1966'),
      { timeout: 15_000 },
    );
    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/athletes/1966/overview'),
      {
        params: { season: 2025, seasontype: 2 },
        timeout: 12_000,
      },
    );
    expect(httpGet).toHaveBeenCalledWith(
      expect.stringContaining('/athletes/1966/stats'),
      {
        params: { seasontype: 2 },
        timeout: 15_000,
      },
    );
    expect(httpGet).toHaveBeenCalledWith('/scoreboard?dates=20260131');
    expect(httpGet).toHaveBeenCalledWith('/summary?event=401585601');
    expect(httpGet).toHaveBeenCalledWith('/teams/16/roster?season=2025');
  });

  it('requests the previous regular season while ESPN is still in preseason', async () => {
    httpGet.mockImplementation((url: string) => {
      if (url === '/teams/1/roster') {
        return Promise.resolve({
          data: { season: { year: 2027, type: 1, name: 'Preseason' } },
        });
      }
      return Promise.resolve({ data: { children: [] } });
    });

    await service.getStandings();

    expect(httpGet).toHaveBeenCalledWith(
      'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2026&seasontype=2',
      { timeout: 20_000 },
    );
  });

  it('requests the current regular season once the season has started', async () => {
    for (const season of [
      { type: 2, name: 'Regular Season' },
      { type: 3, name: 'Postseason' },
    ]) {
      const httpGetForSeason = jest.fn().mockImplementation((url: string) => {
        if (url === '/teams/1/roster') {
          return Promise.resolve({
            data: {
              season: { year: 2027, type: season.type, name: season.name },
            },
          });
        }
        return Promise.resolve({ data: { children: [] } });
      });
      (axios.create as jest.Mock).mockReturnValue({ get: httpGetForSeason });
      const seasonService = new EspnService(
        {
          get: (key: string) => fastRetryConfig[key],
        } as unknown as ConfigService,
        new CacheService(),
      );

      await seasonService.getStandings();

      expect(httpGetForSeason).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2027&seasontype=2',
        { timeout: 20_000 },
      );
    }
  });

  it('rejects path, query, and absolute URL input before requesting', async () => {
    expect(() => service.getTeam('../evil')).toThrow(BadRequestException);
    expect(() => service.getTeam('https://evil.example')).toThrow(
      BadRequestException,
    );
    expect(() => service.getTeam('1?x=1')).toThrow(BadRequestException);
    await expect(service.getPlayer('../evil')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.getAthleteStats('1?x=1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(() => service.getScoreboard('20260131&x=1')).toThrow(
      BadRequestException,
    );
    expect(() => service.getRoster('16', 1800)).toThrow(BadRequestException);

    await expect(
      service.get('https://evil.example', 1000),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.get('//evil.example', 1000)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(httpGet).not.toHaveBeenCalled();
  });
});
