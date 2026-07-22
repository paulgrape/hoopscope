/**
 * Single source of truth for backend URL resolution and typed fetch helpers.
 * Server code prefers `API_URL` (internal network), falling back to the
 * public URL; the browser only ever sees `NEXT_PUBLIC_API_URL`.
 */
export const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

/** Socket.IO must connect from the browser, so it always uses the public URL. */
export const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string
  ) {
    super(`Failed to load ${path}: ${status}`)
    this.name = 'ApiError'
  }
}

export type ApiFetchOptions = {
  /** ISR revalidation window in seconds; omit for `no-store` (live data). */
  revalidate?: number
}

function cacheInit({revalidate}: ApiFetchOptions): RequestInit {
  return revalidate != null ? {next: {revalidate}} : {cache: 'no-store'}
}

async function requestJson<T>(url: string, path: string, options: ApiFetchOptions): Promise<T> {
  const response = await fetch(url, cacheInit(options))

  if (!response.ok) {
    throw new ApiError(response.status, path)
  }

  return response.json() as Promise<T>
}

/** Call the backend directly (server components / server-side code). */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  return requestJson<T>(`${API_BASE_URL}${path}`, path, options)
}

/** Like {@link apiFetch}, but resolves to `null` on 404 instead of throwing. */
export async function apiFetchOrNull<T>(path: string, options: ApiFetchOptions = {}): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/** Call a same-origin `/api/*` proxy route (browser-side refreshes). */
export async function proxyFetch<T>(path: string): Promise<T> {
  return requestJson<T>(path, path, {})
}

/** Like {@link proxyFetch}, but resolves to `null` on 404 instead of throwing. */
export async function proxyFetchOrNull<T>(path: string): Promise<T | null> {
  try {
    return await proxyFetch<T>(path)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
