import {ApiError} from '@/lib/api-client'
import {
  TEAM_SEASON_OPTION_COUNT,
  formatSeasonLabel,
  getTeam,
  getTeamSeasonStats,
  listTeamSeasonYears,
  parseSeasonQuery
} from '@/lib/teams-api'
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

describe('season query helpers', () => {
  it('formats ESPN years as start–end labels', () => {
    expect(formatSeasonLabel(2027)).toBe('2026–27')
  })

  it('lists the current season down 25 years', () => {
    expect(listTeamSeasonYears(2027)).toEqual(
      Array.from({length: TEAM_SEASON_OPTION_COUNT}, (_, index) => 2027 - index)
    )
  })

  it('parses integer season query values', () => {
    expect(parseSeasonQuery(undefined)).toBeUndefined()
    expect(parseSeasonQuery('')).toBeUndefined()
    expect(parseSeasonQuery('2026')).toBe(2026)
    expect(parseSeasonQuery('nope')).toBeUndefined()
  })
})

describe('getTeamSeasonStats', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue(new Response(JSON.stringify({season: 2027, players: []}), {status: 200}))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('forwards season and seasonType on the stats request', async () => {
    await getTeamSeasonStats('16', {season: 2026, seasonType: 'regular'})

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://localhost:3000/teams/16/stats?season=2026&seasonType=regular'
    )
    expect(fetchMock.mock.calls[0][1]).toMatchObject({cache: 'no-store'})
  })

  it('omits season when the caller does not pass one', async () => {
    await getTeamSeasonStats('16', {seasonType: 'playoffs'})

    expect(String(fetchMock.mock.calls[0][0])).toBe('http://localhost:3000/teams/16/stats?seasonType=playoffs')
  })
})
