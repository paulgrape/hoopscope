import {
  deriveTeamForm,
  findScheduleAnchorIndex,
  selectVisibleScheduleGames
} from '@/components/teams/team-schedule-utils'
import type {TeamScheduleGame} from '@/lib/teams-api'
import {describe, expect, it} from 'vitest'

function makeGame(
  id: string,
  overrides: Partial<TeamScheduleGame> = {}
): TeamScheduleGame {
  return {
    id,
    name: `Game ${id}`,
    shortName: `G${id}`,
    date: '2026-01-15T02:00:00Z',
    seasonType: 'regular',
    status: 'final',
    statusDetail: 'Final',
    homeTeam: {
      id: '13',
      name: 'Lakers',
      displayName: 'Los Angeles Lakers',
      abbreviation: 'LAL',
      logo: null,
      color: null
    },
    awayTeam: {
      id: '9',
      name: 'Warriors',
      displayName: 'Golden State Warriors',
      abbreviation: 'GSW',
      logo: null,
      color: null
    },
    homeScore: 110,
    awayScore: 102,
    period: 4,
    clock: '0.0',
    venue: 'crypto.com Arena',
    isHome: true,
    result: 'W',
    ...overrides
  }
}

describe('selectVisibleScheduleGames', () => {
  it('prefers regular, play-in, and playoff games over preseason', () => {
    const games = [
      makeGame('pre-1', {seasonType: 'preseason'}),
      makeGame('reg-1', {seasonType: 'regular'}),
      makeGame('pi-1', {seasonType: 'play-in'}),
      makeGame('po-1', {seasonType: 'playoffs'})
    ]

    expect(selectVisibleScheduleGames(games).map(game => game.id)).toEqual([
      'reg-1',
      'pi-1',
      'po-1'
    ])
  })

  it('falls back to the full list when only preseason games exist', () => {
    const games = [
      makeGame('pre-1', {seasonType: 'preseason'}),
      makeGame('pre-2', {seasonType: 'preseason'})
    ]

    expect(selectVisibleScheduleGames(games).map(game => game.id)).toEqual(['pre-1', 'pre-2'])
  })
})

describe('findScheduleAnchorIndex', () => {
  it('returns -1 for an empty schedule', () => {
    expect(findScheduleAnchorIndex([])).toBe(-1)
  })

  it('prefers a live game over scheduled games', () => {
    const games = [
      makeGame('1', {status: 'final'}),
      makeGame('2', {status: 'live', result: null}),
      makeGame('3', {status: 'scheduled', result: null})
    ]

    expect(findScheduleAnchorIndex(games)).toBe(1)
  })

  it('picks the first scheduled game when no game is live', () => {
    const games = [
      makeGame('1', {status: 'final'}),
      makeGame('2', {status: 'final'}),
      makeGame('3', {status: 'scheduled', result: null}),
      makeGame('4', {status: 'scheduled', result: null})
    ]

    expect(findScheduleAnchorIndex(games)).toBe(2)
  })

  it('lands on the last game when the season is finished', () => {
    const games = [
      makeGame('1', {status: 'final'}),
      makeGame('2', {status: 'final'}),
      makeGame('3', {status: 'final'})
    ]

    expect(findScheduleAnchorIndex(games)).toBe(2)
  })
})

describe('deriveTeamForm', () => {
  it('returns the five final games immediately before the anchor', () => {
    const games = [
      makeGame('1', {result: 'L'}),
      makeGame('2', {result: 'W'}),
      makeGame('3', {result: 'L'}),
      makeGame('4', {result: 'W'}),
      makeGame('5', {result: 'W'}),
      makeGame('6', {result: 'L'}),
      makeGame('7', {status: 'scheduled', result: null, homeScore: null, awayScore: null})
    ]

    const form = deriveTeamForm(games)
    expect(form.map(game => game.id)).toEqual(['2', '3', '4', '5', '6'])
    expect(form.map(game => game.result)).toEqual(['W', 'L', 'W', 'W', 'L'])
  })

  it('returns empty form when the anchor is the first game', () => {
    const games = [
      makeGame('1', {status: 'scheduled', result: null, homeScore: null, awayScore: null}),
      makeGame('2', {status: 'scheduled', result: null, homeScore: null, awayScore: null})
    ]

    expect(deriveTeamForm(games)).toEqual([])
  })
})
