import {ApiError} from '@/lib/api-client'
import {getPlayer, getPlayerCareerStats, getPlayerRecentGames} from '@/lib/players-api'
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

    const [, init] = fetchMock.mock.calls[0]
    expect(init.next).toEqual({revalidate: 1800})
  })
})

describe('getPlayerCareerStats', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('revalidates on the same interval as the current season card', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({seasons: []}), {status: 200}))

    await getPlayerCareerStats('1966')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.next).toEqual({revalidate: 1800})
  })
})

describe('getPlayerRecentGames', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('requests the latest games and revalidates with the season stats', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({games: []}), {status: 200}))

    await getPlayerRecentGames('1966')

    const [url, init] = fetchMock.mock.calls[0] as [string, {next: {revalidate: number}}]
    expect(url).toContain('/players/1966/games?limit=10')
    expect(init.next).toEqual({revalidate: 1800})
  })
})
