import axios, { AxiosError, AxiosHeaders, AxiosInstance } from 'axios';
import { CacheService } from '../cache/cache.service';
import { NbaStatsService } from './nba-stats.service';

function axiosError(status: number): AxiosError {
  const error = new AxiosError('upstream failed');
  error.response = {
    status,
    statusText: '',
    data: null,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('NbaStatsService', () => {
  let get: jest.Mock;
  let cache: CacheService;
  let service: NbaStatsService;

  beforeEach(() => {
    jest.useFakeTimers();
    get = jest.fn();
    jest
      .spyOn(axios, 'create')
      .mockReturnValue({ get } as unknown as AxiosInstance);

    cache = new CacheService();
    service = new NbaStatsService(cache);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('retries a transient failure before succeeding', async () => {
    get
      .mockRejectedValueOnce(axiosError(503))
      .mockResolvedValue({ data: { resultSets: [] } });

    const promise = service.getShotChartLeagueWide('2025-26');
    await jest.advanceTimersByTimeAsync(5_000);

    await expect(promise).resolves.toEqual({ resultSets: [] });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('falls back to stale cache once the retries run out', async () => {
    cache.set('nba-shotchartleaguewide:2025-26', { resultSets: [] }, -1);
    get.mockRejectedValue(axiosError(500));

    const promise = service.getShotChartLeagueWide('2025-26');
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toEqual({ resultSets: [] });
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('does not retry a client error', async () => {
    get.mockRejectedValue(axiosError(400));

    const promise = service.getShotChartDetail({
      playerId: '201939',
      season: '2025-26',
    });
    const assertion = expect(promise).rejects.toBeInstanceOf(AxiosError);
    await jest.advanceTimersByTimeAsync(5_000);

    await assertion;
    expect(get).toHaveBeenCalledTimes(1);
  });
});
