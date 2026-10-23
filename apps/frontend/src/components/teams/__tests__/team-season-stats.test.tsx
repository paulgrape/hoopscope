import {TeamSeasonStats} from '@/components/teams/team-season-stats'
import type {TeamSeasonStatsResponse} from '@/lib/teams-api'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

function stats(season: number, overrides: Partial<TeamSeasonStatsResponse> = {}): TeamSeasonStatsResponse {
  return {
    season,
    seasonLabel: `${season - 1}–${String(season).slice(-2)}`,
    seasonType: 'regular',
    currentSeason: 2027,
    seasonComplete: season < 2027,
    participated: true,
    players: [],
    ...overrides
  }
}

describe('TeamSeasonStats', () => {
  it('hides Playoffs while the current season is open and no playoff stats exist', () => {
    render(
      <TeamSeasonStats
        regularStats={stats(2027, {seasonComplete: false})}
        playoffStats={stats(2027, {seasonType: 'playoffs', seasonComplete: false, participated: false})}
        teamId='16'
      />
    )

    expect(screen.queryByRole('button', {name: 'Playoffs'})).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Season')).not.toBeInTheDocument()
  })

  it('offers Playoffs for a finished season the team missed', async () => {
    render(
      <TeamSeasonStats
        regularStats={stats(2026)}
        playoffStats={stats(2026, {seasonType: 'playoffs', participated: false})}
        teamId='16'
      />
    )

    await userEvent.click(screen.getByRole('button', {name: 'Playoffs'}))

    expect(screen.getByText('This team did not qualify for the playoffs in 2025–26.')).toBeInTheDocument()
  })
})
