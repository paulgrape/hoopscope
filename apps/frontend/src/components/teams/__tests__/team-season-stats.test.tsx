import {TeamSeasonStats} from '@/components/teams/team-season-stats'
import type {TeamSeasonStatsResponse} from '@/lib/teams-api'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const replace = vi.fn()
let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({replace}),
  usePathname: () => '/teams/16',
  useSearchParams: () => searchParams
}))

function stats(season: number, currentSeason = 2027): TeamSeasonStatsResponse {
  return {
    season,
    seasonLabel: `${season - 1}–${String(season).slice(-2)}`,
    seasonType: 'regular',
    currentSeason,
    participated: true,
    players: []
  }
}

describe('TeamSeasonStats', () => {
  beforeEach(() => {
    replace.mockReset()
    searchParams = new URLSearchParams()
  })

  it('writes a past season onto the team URL', async () => {
    render(
      <TeamSeasonStats
        regularStats={stats(2027)}
        playoffStats={{...stats(2027), seasonType: 'playoffs', participated: false}}
        teamId='16'
      />
    )

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2026')

    expect(replace).toHaveBeenCalledWith('/teams/16?season=2026', {scroll: false})
  })

  it('drops the season param when returning to the current year', async () => {
    searchParams = new URLSearchParams('season=2026')

    render(
      <TeamSeasonStats
        regularStats={stats(2026)}
        playoffStats={{...stats(2026), seasonType: 'playoffs', participated: false}}
        teamId='16'
      />
    )

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2027')

    expect(replace).toHaveBeenCalledWith('/teams/16', {scroll: false})
  })
})
