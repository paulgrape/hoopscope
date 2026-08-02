import {ApiError} from '@/lib/api-client'
import {getPlayer} from '@/lib/players-api'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('getPlayer', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('resolves null for an unknown player so the page can render a 404', async () => {
    fetchMock.mockResolvedValue(new Response('{}', {status: 404}))

    await expect(getPlayer('nope')).resolves.toBeNull()
  })

  it('rethrows backend failures', async () => {
    fetchMock.mockResolvedValue(new Response('{}', {status: 502}))

    await expect(getPlayer('1966')).rejects.toBeInstanceOf(ApiError)
  })

  it('returns the profile on success', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({id: '1966', fullName: 'LeBron James'}), {status: 200}))

    await expect(getPlayer('1966')).resolves.toMatchObject({fullName: 'LeBron James'})
  })
})
