import { AxiosError, AxiosHeaders } from 'axios';
import { withRetry } from './retry';

function axiosError(status?: number): AxiosError {
  const error = new AxiosError('upstream failed');
  if (status !== undefined) {
    error.response = {
      status,
      statusText: '',
      data: null,
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    };
  }
  return error;
}

describe('withRetry', () => {
  it('returns the first successful attempt', async () => {
    const send = jest.fn().mockResolvedValue('ok');

    await expect(withRetry(send)).resolves.toBe('ok');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('retries transient upstream failures', async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(axiosError(503))
      .mockRejectedValueOnce(axiosError())
      .mockResolvedValue('ok');

    await expect(withRetry(send, { baseDelayMs: 0 })).resolves.toBe('ok');
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('stops at the attempt budget', async () => {
    const send = jest.fn().mockRejectedValue(axiosError(500));

    await expect(
      withRetry(send, { attempts: 2, baseDelayMs: 0 }),
    ).rejects.toBeInstanceOf(AxiosError);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('never retries a client error', async () => {
    const send = jest.fn().mockRejectedValue(axiosError(404));

    await expect(withRetry(send, { baseDelayMs: 0 })).rejects.toBeInstanceOf(
      AxiosError,
    );
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('reports each retry', async () => {
    const onRetry = jest.fn();
    const send = jest
      .fn()
      .mockRejectedValueOnce(axiosError(429))
      .mockResolvedValue('ok');

    await withRetry(send, { baseDelayMs: 0, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
