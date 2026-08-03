/**
 * Single source of truth for backend URL resolution and typed fetch helpers.
 * Server code prefers `API_URL` (internal network), falling back to the
 * public URL; the browser only ever sees `NEXT_PUBLIC_API_URL`.
 */
export const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

/** Socket.IO must connect from the browser, so it always uses the public URL. */
export const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export const DEFAULT_TIMEOUT_MS = 8000

export const DEFAULT_RETRIES = 2

const RETRY_BASE_DELAY_MS = 200
const RETRY_MAX_DELAY_MS = 2000

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504])

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message?: string
  ) {
    super(message ?? `Failed to load ${path}: ${status}`)
    this.name = 'ApiError'
  }
}

export class ApiTimeoutError extends ApiError {
  constructor(path: string, timeoutMs: number) {
    super(504, path, `Timed out after ${timeoutMs}ms loading ${path}`)
    this.name = 'ApiTimeoutError'
  }
}

export type ResilienceOptions = {
  timeoutMs?: number
  retries?: number
  path?: string
}

export type ApiFetchOptions = ResilienceOptions & {
  /** ISR revalidation window in seconds; omit for `no-store` (live data). */
  revalidate?: number
}

function cacheInit({revalidate}: ApiFetchOptions): RequestInit {
  return revalidate != null ? {next: {revalidate}} : {cache: 'no-store'}
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null

  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)

  const date = Date.parse(header)
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now())
}

function retryDelayMs(attempt: number, retryAfter: string | null): number {
  const requested = parseRetryAfter(retryAfter)
  if (requested !== null) return Math.min(requested, RETRY_MAX_DELAY_MS)

  return Math.min(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), RETRY_MAX_DELAY_MS)
}

export async function fetchWithRetry(
  url: string | URL,
  init: RequestInit = {},
  options: ResilienceOptions = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const attempts = (options.retries ?? DEFAULT_RETRIES) + 1
  const label = options.path ?? String(url)

  for (let attempt = 1; ; attempt++) {
    const lastAttempt = attempt === attempts

    try {
      const response = await fetch(url, {...init, signal: AbortSignal.timeout(timeoutMs)})

      if (lastAttempt || !RETRYABLE_STATUSES.has(response.status)) {
        return response
      }

      const delay = retryDelayMs(attempt, response.headers.get('retry-after'))
      await response.body?.cancel().catch(() => {})
      await sleep(delay)
    } catch (error) {
      if (!isTimeout(error) && !isNetworkError(error)) throw error
      if (lastAttempt) {
        throw isTimeout(error) ? new ApiTimeoutError(label, timeoutMs) : error
      }

      await sleep(retryDelayMs(attempt, null))
    }
  }
}

async function requestJson<T>(url: string, path: string, options: ApiFetchOptions): Promise<T> {
  const response = await fetchWithRetry(url, cacheInit(options), {...options, path})

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
export async function proxyFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  return requestJson<T>(path, path, options)
}

/** Like {@link proxyFetch}, but resolves to `null` on 404 instead of throwing. */
export async function proxyFetchOrNull<T>(path: string, options: ApiFetchOptions = {}): Promise<T | null> {
  try {
    return await proxyFetch<T>(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
