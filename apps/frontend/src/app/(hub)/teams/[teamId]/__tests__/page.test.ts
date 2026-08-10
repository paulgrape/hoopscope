import {beforeEach, describe, expect, it, vi} from 'vitest'

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next/navigation', () => ({
  notFound: () => notFound()
}))

vi.mock('@/lib/teams-api', () => ({
  getTeam: vi.fn(),
  getTeamSeasonStats: vi.fn()
}))

vi.mock('@/components/teams/team-season-stats', () => ({
  TeamSeasonStats: () => null
}))

vi.mock('@/components/seo/json-ld', () => ({
  JsonLd: () => null
}))

import TeamDetailsPage from '../page'
import {getTeam} from '@/lib/teams-api'

describe('TeamDetailsPage', () => {
  beforeEach(() => {
    notFound.mockClear()
    vi.mocked(getTeam).mockReset()
  })

  it('calls notFound when the team is missing', async () => {
    vi.mocked(getTeam).mockResolvedValue(null)

    await expect(TeamDetailsPage({params: Promise.resolve({teamId: 'missing'})})).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledTimes(1)
    expect(getTeam).toHaveBeenCalledWith('missing')
  })
})
