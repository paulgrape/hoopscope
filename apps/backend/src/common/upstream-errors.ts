import { NotFoundException } from '@nestjs/common';
import axios from 'axios';

export function isUpstreamNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export function isRetryableUpstreamError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  if (status === undefined) return true;
  return status === 429 || status >= 500;
}

export function rethrowAsNotFound(message: string) {
  return (error: unknown): never => {
    if (isUpstreamNotFound(error)) {
      throw new NotFoundException(message);
    }
    throw error;
  };
}
