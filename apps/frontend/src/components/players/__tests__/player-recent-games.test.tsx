import {PlayerRecentGames} from '@/components/players/player-recent-games'
import type {PlayerRecentGame, PlayerRecentGamesResponse} from '@/lib/players-api'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

function game(overrides: Partial<PlayerRecentGame> = {}): PlayerRecentGame {
  return {
    id: '401',
    date: '2026-11-11T23:30:00.000Z',
    opponentId: '13',
    opponentAbbr: 'LAL',
    homeAway: 'away',
    result: 'W',
    score: '110-105',
    min: 32,
    pts: 28,
    reb: 8,
    ast: 7,
    stl: 1,
    blk: 0,
    tov: 3,
    fg: '10-18',
    fgPct: 55.6,
    threePoint: '2-6',
    threePointPct: 33.3,
    freeThrow: '6-6',
    freeThrowPct: 100,
    played: true,
    ...overrides
  }
}

function response(games: PlayerRecentGame[]): PlayerRecentGamesResponse {
  return {season: 2027, seasonLabel: '2026–27', games}
}

describe('PlayerRecentGames', () => {
  it('links each game to the match and the opponent', () => {
    render(<PlayerRecentGames recentGames={response([game()])} />)

    const gameLinks = screen.getAllByRole('link', {name: 'Nov 11 at LAL'})
    expect(gameLinks.length).toBeGreaterThan(0)
    for (const link of gameLinks) {
      expect(link).toHaveAttribute('href', '/match-center/401')
    }

    const opponentLinks = screen.getAllByRole('link', {name: '@ LAL'})
    expect(opponentLinks.length).toBeGreaterThan(0)
    for (const link of opponentLinks) {
      expect(link).toHaveAttribute('href', '/teams/13')
    }
  })

  it('shows an empty state when the log is empty', () => {
    render(<PlayerRecentGames recentGames={{season: null, seasonLabel: null, games: []}} />)

    expect(screen.getByRole('heading', {name: 'Recent games'})).toBeInTheDocument()
    expect(screen.getByText('No recent games available.')).toBeInTheDocument()
  })
})
