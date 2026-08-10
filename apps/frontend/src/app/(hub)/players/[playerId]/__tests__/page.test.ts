import {beforeEach, describe, expect, it, vi} from 'vitest'

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next/navigation', () => ({
  notFound: () => notFound()
}))

vi.mock('@/lib/players-api', () => ({
  getPlayer: vi.fn(),
  getPlayerSeasonStats: vi.fn(),
  getPlayerCareerStats: vi.fn(),
  getPlayerNews: vi.fn(),
  getEspnPlayerNewsHref: vi.fn()
}))

vi.mock('@/lib/teams-api', () => ({
  getTeam: vi.fn()
}))

vi.mock('@/lib/espn-nba-ids', () => ({
  getCachedShotHeatmapForEspnPlayer: vi.fn()
}))

vi.mock('@/components/players/player-page-header', () => ({
  PlayerPageHeader: () => null,
  PlayerBioGrid: () => null
}))

vi.mock('@/components/players/player-profile-tabs', () => ({
  PlayerProfileTabs: () => null
}))

vi.mock('@/components/seo/json-ld', () => ({
  JsonLd: () => null
}))

import PlayerDetailsPage from '../page'
import {getPlayer} from '@/lib/players-api'

describe('PlayerDetailsPage', () => {
  beforeEach(() => {
    notFound.mockClear()
    vi.mocked(getPlayer).mockReset()
  })

  it('calls notFound when the player is missing', async () => {
    vi.mocked(getPlayer).mockResolvedValue(null)

    await expect(
      PlayerDetailsPage({
        params: Promise.resolve({playerId: 'missing'}),
        searchParams: Promise.resolve({})
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledTimes(1)
    expect(getPlayer).toHaveBeenCalledWith('missing')
  })
})
