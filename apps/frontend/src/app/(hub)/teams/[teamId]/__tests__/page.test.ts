import {beforeEach, describe, expect, it, vi} from 'vitest'

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next/navigation', () => ({
  notFound: () => notFound()
}))

vi.mock('@/lib/teams-api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/teams-api')>()
  return {
    ...actual,
    getTeam: vi.fn(),
    getTeamSeasonStats: vi.fn()
  }
})

vi.mock('@/components/teams/team-season-stats', () => ({
  TeamSeasonStats: () => null
}))

vi.mock('@/components/seo/json-ld', () => ({
  JsonLd: () => null
}))

import TeamDetailsPage from '../page'
import {getTeam, getTeamSeasonStats} from '@/lib/teams-api'

const team = {
  id: '16',
  name: 'Timberwolves',
  abbreviation: 'MIN',
  displayName: 'Minnesota Timberwolves',
  logo: null,
  color: null,
  alternateColor: null,
  location: 'Minnesota',
  record: '0-0'
}

function emptyStats(season: number) {
  return {
    season,
    seasonLabel: `${season - 1}–${String(season).slice(-2)}`,
    seasonType: 'regular' as const,
    currentSeason: 2027,
    participated: true,
    players: []
  }
}

describe('TeamDetailsPage', () => {
  beforeEach(() => {
    notFound.mockClear()
    vi.mocked(getTeam).mockReset()
    vi.mocked(getTeamSeasonStats).mockReset()
    vi.mocked(getTeamSeasonStats).mockResolvedValue(emptyStats(2027))
  })

  it('calls notFound when the team is missing', async () => {
    vi.mocked(getTeam).mockResolvedValue(null)

    await expect(
      TeamDetailsPage({
        params: Promise.resolve({teamId: 'missing'}),
        searchParams: Promise.resolve({})
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledTimes(1)
    expect(getTeam).toHaveBeenCalledWith('missing')
  })

  it('loads default season stats when the URL has no season', async () => {
    vi.mocked(getTeam).mockResolvedValue(team)

    await TeamDetailsPage({
      params: Promise.resolve({teamId: '16'}),
      searchParams: Promise.resolve({})
    })

    expect(getTeamSeasonStats).toHaveBeenCalledWith('16', {season: undefined, seasonType: 'regular'})
    expect(getTeamSeasonStats).toHaveBeenCalledWith('16', {season: undefined, seasonType: 'playoffs'})
  })

  it('forwards the URL season to both stats fetches', async () => {
    vi.mocked(getTeam).mockResolvedValue(team)

    await TeamDetailsPage({
      params: Promise.resolve({teamId: '16'}),
      searchParams: Promise.resolve({season: '2026'})
    })

    expect(getTeamSeasonStats).toHaveBeenCalledWith('16', {season: 2026, seasonType: 'regular'})
    expect(getTeamSeasonStats).toHaveBeenCalledWith('16', {season: 2026, seasonType: 'playoffs'})
  })
})
