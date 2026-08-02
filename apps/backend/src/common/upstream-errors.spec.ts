import { NotFoundException } from '@nestjs/common';
import { AxiosError, AxiosHeaders } from 'axios';
import { isUpstreamNotFound, rethrowAsNotFound } from './upstream-errors';

function axiosErrorWithStatus(status: number): AxiosError {
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

describe('upstream error mapping', () => {
  it('recognises upstream 404s only', () => {
    expect(isUpstreamNotFound(axiosErrorWithStatus(404))).toBe(true);
    expect(isUpstreamNotFound(axiosErrorWithStatus(503))).toBe(false);
    expect(isUpstreamNotFound(new Error('boom'))).toBe(false);
  });

  it('converts an upstream 404 into a NotFoundException', () => {
    expect(() =>
      rethrowAsNotFound('Team 999 not found')(axiosErrorWithStatus(404)),
    ).toThrow(new NotFoundException('Team 999 not found'));
  });

  it('rethrows every other failure untouched', () => {
    const error = axiosErrorWithStatus(500);
    expect(() => rethrowAsNotFound('Team 999 not found')(error)).toThrow(error);
  });
});
