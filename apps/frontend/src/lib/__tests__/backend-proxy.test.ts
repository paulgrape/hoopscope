import {proxyBackendGet} from '@/lib/backend-proxy'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('proxyBackendGet', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    fetchMock.mockReset()
  })

  it('mirrors the backend status and content type', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ok: true}), {
        status: 200,
        headers: {'content-type': 'application/json'}
      })
    )

    const response = await proxyBackendGet('/games/schedule')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    await expect(response.json()).resolves.toEqual({ok: true})
  })

  it('passes a 404 through untouched', async () => {
    fetchMock.mockResolvedValue(new Response('{}', {status: 404}))

    const response = await proxyBackendGet('/games/nope')

    expect(response.status).toBe(404)
  })

  it('answers 504 when the backend never responds', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('The operation was aborted due to timeout'), {name: 'TimeoutError'})
    )

    const response = await proxyBackendGet('/games/schedule', undefined)

    expect(response.status).toBe(504)
    await expect(response.json()).resolves.toMatchObject({statusCode: 504})
  })
})
