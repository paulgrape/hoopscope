import { isRetryableUpstreamError } from './upstream-errors';

export type RetryOptions = {
  /** Total attempts including the first one. */
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with jitter for transient upstream failures. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 8_000;
  const isRetryable = options.isRetryable ?? isRetryableUpstreamError;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts || !isRetryable(error)) throw error;

      const capped = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const delayMs = Math.round(capped + Math.random() * capped * 0.25);
      options.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }
}
