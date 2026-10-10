import {sortScoreboardGames} from '@/components/match/scoreboard-order'
import type {ScoreboardGame} from '@/lib/games-api'
import {describe, expect, it} from 'vitest'

function game(id: string, status: ScoreboardGame['status'], date: string): ScoreboardGame {
  return {
    id,
    name: id,
    shortName: id,
    date,
    status,
    statusDetail: status,
    homeTeam: null,
    awayTeam: null,
    homeScore: null,
    awayScore: null,
    seasonType: null,
    period: null,
    clock: null,
    venue: null
  }
}

describe('sortScoreboardGames', () => {
  it('puts live games first, then scheduled, then final, each by tip time', () => {
    const sorted = sortScoreboardGames([
      game('final-early', 'final', '2026-01-15T00:00:00.000Z'),
      game('live-late', 'live', '2026-01-15T03:00:00.000Z'),
      game('scheduled', 'scheduled', '2026-01-15T02:00:00.000Z'),
      game('live-early', 'live', '2026-01-15T01:00:00.000Z'),
      game('final-late', 'final', '2026-01-15T04:00:00.000Z')
    ])

    expect(sorted.map(item => item.id)).toEqual(['live-early', 'live-late', 'scheduled', 'final-early', 'final-late'])
  })
})
