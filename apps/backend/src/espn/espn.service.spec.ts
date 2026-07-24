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
