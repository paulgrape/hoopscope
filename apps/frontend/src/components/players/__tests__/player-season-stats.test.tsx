import {PlayerSeasonStats} from '@/components/players/player-season-stats'
import type {PlayerSeasonStatsResponse} from '@/lib/players-api'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

function stats(overrides: Partial<PlayerSeasonStatsResponse> = {}): PlayerSeasonStatsResponse {
  return {
    season: 2027,
    seasonLabel: '2026–27',
    seasonType: 'regular',
    seasonComplete: false,
    participated: false,
    averages: null,
    ...overrides
  }
}

describe('PlayerSeasonStats', () => {
  it('hides Playoffs while the current season is open and no playoff stats exist', () => {
    render(
      <PlayerSeasonStats
        regularStats={stats()}
        playoffStats={stats({seasonType: 'playoffs'})}
      />
    )

    expect(screen.queryByRole('button', {name: 'Playoffs'})).not.toBeInTheDocument()
  })

  it('offers Playoffs for a finished season with no playoff stats', async () => {
    render(
      <PlayerSeasonStats
        regularStats={stats({season: 2026, seasonLabel: '2025–26', seasonComplete: true})}
        playoffStats={stats({
          season: 2026,
          seasonLabel: '2025–26',
          seasonType: 'playoffs',
          seasonComplete: true
        })}
      />
    )

    await userEvent.click(screen.getByRole('button', {name: 'Playoffs'}))

    expect(screen.getByText('No playoff stats recorded for 2025–26.')).toBeInTheDocument()
  })
})
