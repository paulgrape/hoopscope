import {
  ApiError,
  ApiTimeoutError,
  apiFetch,
  apiFetchOrNull,
  fetchWithRetry,
  proxyFetch,
  proxyFetchOrNull
} from '@/lib/api-client'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json', ...headers}
  })
}

function timeoutError() {
  return Object.assign(new Error('The operation was aborted due to timeout'), {name: 'TimeoutError'})
}

describe('api-client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('apiFetch resolves parsed JSON from the backend', async () => {
    fetchMock.mockResolvedValue(jsonResponse({hello: 'world'}))

    await expect(apiFetch<{hello: string}>('/teams')).resolves.toEqual({hello: 'world'})

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('http://localhost:3000/teams')
    expect(init.cache).toBe('no-store')
  })

  it('apiFetch passes ISR revalidate options instead of no-store', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))

    await apiFetch('/standings', {revalidate: 900})

    const [, init] = fetchMock.mock.calls[0]
    expect(init.next).toEqual({revalidate: 900})
    expect(init.cache).toBeUndefined()
  })

  it('apiFetch aborts every attempt through a timeout signal', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))

    await apiFetch('/teams')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('apiFetch throws a typed ApiError on failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse({message: 'boom'}, 500))

    const promise = apiFetch('/teams')
    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(apiFetch('/teams')).rejects.toMatchObject({status: 500})
  })

  it('apiFetchOrNull resolves null on 404 but rethrows other errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 404))
    await expect(apiFetchOrNull('/games/nope')).resolves.toBeNull()

    fetchMock.mockResolvedValue(jsonResponse({}, 503))
    await expect(apiFetchOrNull('/games/nope', {retries: 0})).rejects.toBeInstanceOf(ApiError)
  })

  it('proxyFetch calls same-origin paths with no-store', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ok: true}))

    await expect(proxyFetch('/api/games/schedule')).resolves.toEqual({ok: true})

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('/api/games/schedule')
    expect(init.cache).toBe('no-store')
  })

  it('proxyFetchOrNull resolves null on 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404))
    await expect(proxyFetchOrNull('/api/games/1')).resolves.toBeNull()
  })
})

describe('fetchWithRetry', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('retries transient statuses and returns the first good response', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 502))
      .mockResolvedValueOnce(jsonResponse({ok: true}))

    const promise = fetchWithRetry('http://backend/teams')
    await vi.runAllTimersAsync()

    await expect(promise.then(response => response.status)).resolves.toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('gives up after the retry budget and returns the last failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503))

    const promise = fetchWithRetry('http://backend/teams')
    await vi.runAllTimersAsync()

    await expect(promise.then(response => response.status)).resolves.toBe(503)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('never retries a client error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404))

    const promise = fetchWithRetry('http://backend/teams')
    await vi.runAllTimersAsync()

    await expect(promise.then(response => response.status)).resolves.toBe(404)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('waits for Retry-After before the next attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 429, {'retry-after': '1'}))
      .mockResolvedValueOnce(jsonResponse({ok: true}))

    const promise = fetchWithRetry('http://backend/teams')

    await vi.advanceTimersByTimeAsync(500)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(600)
    await expect(promise.then(response => response.status)).resolves.toBe(200)
  })

  it('retries a timeout and reports it as an ApiTimeoutError', async () => {
    fetchMock.mockRejectedValue(timeoutError())

    const promise = fetchWithRetry('http://backend/teams', {}, {path: '/teams'})
    const assertion = expect(promise).rejects.toBeInstanceOf(ApiTimeoutError)
    await vi.runAllTimersAsync()

    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retries a dropped connection and rethrows it when the budget runs out', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const promise = fetchWithRetry('http://backend/teams')
    const assertion = expect(promise).rejects.toBeInstanceOf(TypeError)
    await vi.runAllTimersAsync()

    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry a non-network failure', async () => {
    fetchMock.mockRejectedValue(new SyntaxError('bad json'))

    await expect(fetchWithRetry('http://backend/teams')).rejects.toBeInstanceOf(SyntaxError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
