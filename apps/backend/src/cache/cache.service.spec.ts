import { CacheService } from './cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new CacheService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a fresh value within its TTL', () => {
    cache.set('key', { a: 1 }, 1000);
    expect(cache.get('key')).toEqual({ a: 1 });
  });

  it('returns null for missing keys', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('expires values after the TTL', () => {
    cache.set('key', 'value', 1000);
    jest.advanceTimersByTime(1001);
    expect(cache.get('key')).toBeNull();
  });

  it('serves expired values via getStale', () => {
    cache.set('key', 'value', 1000);
    jest.advanceTimersByTime(5000);
    expect(cache.get('key')).toBeNull();
    expect(cache.getStale('key')).toBe('value');
  });

  it('evicts expired entries first when full', () => {
    cache.set('expired', 'old', 10);
    jest.advanceTimersByTime(100);

    for (let i = 0; i < 499; i++) {
      cache.set(`key-${i}`, i, 60_000);
    }

    // The 500th insert triggers eviction of the expired entry.
    cache.set('new', 'value', 60_000);

    expect(cache.getStale('expired')).toBeNull();
    expect(cache.get('new')).toBe('value');
    expect(cache.get('key-0')).toBe(0);
  });

  it('evicts oldest entries when full with nothing expired', () => {
    for (let i = 0; i < 500; i++) {
      cache.set(`key-${i}`, i, 60_000);
    }

    cache.set('overflow', 'value', 60_000);

    expect(cache.get('overflow')).toBe('value');
    // Oldest 20% were evicted.
    expect(cache.get('key-0')).toBeNull();
    expect(cache.get('key-499')).toBe(499);
  });
});
