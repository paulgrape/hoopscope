import {ApiError, apiFetch, apiFetchOrNull, proxyFetch, proxyFetchOrNull} from '@/lib/api-client'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json'}
  })
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
    expect(init).toEqual({cache: 'no-store'})
  })

  it('apiFetch passes ISR revalidate options instead of no-store', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))

    await apiFetch('/standings', {revalidate: 900})

    const [, init] = fetchMock.mock.calls[0]
    expect(init).toEqual({next: {revalidate: 900}})
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

    fetchMock.mockResolvedValueOnce(jsonResponse({}, 503))
    await expect(apiFetchOrNull('/games/nope')).rejects.toBeInstanceOf(ApiError)
  })

  it('proxyFetch calls same-origin paths with no-store', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ok: true}))

    await expect(proxyFetch('/api/games/schedule')).resolves.toEqual({ok: true})

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('/api/games/schedule')
    expect(init).toEqual({cache: 'no-store'})
  })

  it('proxyFetchOrNull resolves null on 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404))
    await expect(proxyFetchOrNull('/api/games/1')).resolves.toBeNull()
  })
})
