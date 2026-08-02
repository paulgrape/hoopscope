import {ApiError} from '@/lib/api-client'
import {getTeam} from '@/lib/teams-api'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('getTeam', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('resolves null for an unknown team so the page can render a 404', async () => {
    fetchMock.mockResolvedValue(new Response('{}', {status: 404}))

    await expect(getTeam('nope')).resolves.toBeNull()
  })

  it('rethrows backend failures', async () => {
    fetchMock.mockResolvedValue(new Response('{}', {status: 500}))

    await expect(getTeam('13')).rejects.toBeInstanceOf(ApiError)
  })

  it('returns the team on success', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({id: '13', displayName: 'Los Angeles Lakers'}), {status: 200})
    )

    await expect(getTeam('13')).resolves.toMatchObject({displayName: 'Los Angeles Lakers'})
  })
})
