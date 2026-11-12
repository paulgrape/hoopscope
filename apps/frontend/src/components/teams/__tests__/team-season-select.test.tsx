import {TeamSeasonSelect} from '@/components/teams/team-season-select'
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

describe('TeamSeasonSelect', () => {
  beforeEach(() => {
    replace.mockReset()
    searchParams = new URLSearchParams()
  })

  it('keeps a directly requested season outside the recent-season list selected', () => {
    render(
      <TeamSeasonSelect
        season={1996}
        currentSeason={2027}
      />
    )

    expect(screen.getByLabelText('Season')).toHaveValue('1996')
    expect(screen.getByRole('option', {name: '1995–96'})).toBeInTheDocument()
  })

  it('writes a past season onto the team URL', async () => {
    render(
      <TeamSeasonSelect
        season={2027}
        currentSeason={2027}
      />
    )

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2026')

    expect(replace).toHaveBeenCalledWith('/teams/16?season=2026', {scroll: false})
  })

  it('drops the season param when returning to the current year', async () => {
    searchParams = new URLSearchParams('season=2026')

    render(
      <TeamSeasonSelect
        season={2026}
        currentSeason={2027}
      />
    )

    await userEvent.selectOptions(screen.getByLabelText('Season'), '2027')

    expect(replace).toHaveBeenCalledWith('/teams/16', {scroll: false})
  })
})
