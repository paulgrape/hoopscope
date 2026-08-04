export class CircuitOpenError extends Error {
  constructor(readonly circuit: string) {
    super(`${circuit} is unavailable: circuit open`);
    this.name = 'CircuitOpenError';
  }
}

export type CircuitBreakerOptions = {
  /** Consecutive failures that trip the circuit. */
  failureThreshold?: number;
  /** How long the circuit stays open before a single probe is allowed. */
  cooldownMs?: number;
};

type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Stops hammering an upstream that is already failing: after
 * `failureThreshold` consecutive failures every call fails fast for
 * `cooldownMs`, then one probe decides whether to close again.
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private probing = false;

  private readonly failureThreshold: number;
  private readonly cooldownMs: number;

  constructor(
    private readonly label: string,
    options: CircuitBreakerOptions = {},
  ) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30_000;
  }

  get state(): CircuitState {
    if (this.failures < this.failureThreshold) return 'closed';
    return Date.now() - this.openedAt >= this.cooldownMs ? 'half-open' : 'open';
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.state;

    if (state === 'open') {
      throw new CircuitOpenError(this.label);
    }

    // Only one probe at a time; everything else keeps failing fast.
    if (state === 'half-open') {
      if (this.probing) throw new CircuitOpenError(this.label);
      this.probing = true;
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    } finally {
      this.probing = false;
    }
  }

  private recordFailure(): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.openedAt = Date.now();
    }
  }

  private reset(): void {
    this.failures = 0;
    this.openedAt = 0;
  }
}
