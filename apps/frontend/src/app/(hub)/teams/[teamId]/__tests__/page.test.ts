import {getTeam, getTeamSeasonStats} from '@/lib/teams-api'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import TeamDetailsPage from '../page'

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

const team = {
  id: '16',
  name: 'Timberwolves',
  abbreviation: 'MIN',
  displayName: 'Minnesota Timberwolves',
  logo: null,
  color: null,
  alternateColor: null,
  location: 'Minnesota',
  record: {
    season: 2026,
    seasonLabel: '2025–26',
    summary: '49-33',
    home: '26-15',
    road: '23-18',
    divisionRecord: '9-7',
    conferenceRecord: '31-21',
    pointsPerGame: '118.0',
    opponentPointsPerGame: '114.6',
    streak: 'W2',
    playoffSeed: '6'
  },
  conference: 'Western Conference',
  division: 'Northwest',
  venue: 'Target Center',
  venueLocation: 'Minneapolis, MN',
  coach: 'Chris Finch'
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
