import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

describe('CircuitBreaker', () => {
  const failing = () => Promise.reject(new Error('upstream down'));

  async function trip(breaker: CircuitBreaker, times: number) {
    for (let i = 0; i < times; i++) {
      await expect(breaker.execute(failing)).rejects.toThrow('upstream down');
    }
  }

  it('stays closed while calls succeed', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 2 });

    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe(
      'ok',
    );
    expect(breaker.state).toBe('closed');
  });

  it('opens after the failure threshold and then fails fast', async () => {
    const breaker = new CircuitBreaker('test', {
      failureThreshold: 2,
      cooldownMs: 1_000,
    });

    await trip(breaker, 2);
    expect(breaker.state).toBe('open');

    const send = jest.fn();
    await expect(breaker.execute(send)).rejects.toBeInstanceOf(
      CircuitOpenError,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('resets a run of failures once a call succeeds', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 3 });

    await trip(breaker, 2);
    await breaker.execute(() => Promise.resolve('ok'));
    await trip(breaker, 2);

    expect(breaker.state).toBe('closed');
  });

  it('probes once after the cooldown and closes on success', async () => {
    jest.useFakeTimers().setSystemTime(0);
    const breaker = new CircuitBreaker('test', {
      failureThreshold: 1,
      cooldownMs: 1_000,
    });

    await trip(breaker, 1);
    expect(breaker.state).toBe('open');

    jest.setSystemTime(1_500);
    expect(breaker.state).toBe('half-open');

    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe(
      'ok',
    );
    expect(breaker.state).toBe('closed');
    jest.useRealTimers();
  });

  it('re-opens when the probe fails', async () => {
    jest.useFakeTimers().setSystemTime(0);
    const breaker = new CircuitBreaker('test', {
      failureThreshold: 1,
      cooldownMs: 1_000,
    });

    await trip(breaker, 1);
    jest.setSystemTime(1_500);
    await trip(breaker, 1);

    expect(breaker.state).toBe('open');
    jest.useRealTimers();
  });
});
