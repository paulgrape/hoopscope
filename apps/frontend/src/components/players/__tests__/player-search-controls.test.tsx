import {PlayerSearchControls} from '@/components/players/player-search-controls'
import type {TeamSummary} from '@/lib/teams-api'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const replace = vi.fn()
let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({replace}),
  usePathname: () => '/players',
  useSearchParams: () => searchParams
}))

const teams: TeamSummary[] = [
  {
    id: '9',
    name: 'Nuggets',
    abbreviation: 'DEN',
    displayName: 'Denver Nuggets',
    logo: null,
    color: null,
    alternateColor: null,
    location: 'Denver'
  }
]

describe('PlayerSearchControls', () => {
  beforeEach(() => {
    replace.mockReset()
    searchParams = new URLSearchParams()
  })

  it('pushes a debounced name query into the URL', async () => {
    render(
      <PlayerSearchControls
        teams={teams}
        query=''
        teamId=''
      />
    )

    await userEvent.type(screen.getByLabelText('Search by name'), 'jokic')

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/players?q=jokic', {scroll: false})
    })
  })

  it('drops the query param when the input is cleared', async () => {
    searchParams = new URLSearchParams('q=jokic')

    render(
      <PlayerSearchControls
        teams={teams}
        query='jokic'
        teamId=''
      />
    )

    await userEvent.clear(screen.getByLabelText('Search by name'))

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/players', {scroll: false})
    })
  })

  it('applies the team filter immediately and keeps the active query', async () => {
    searchParams = new URLSearchParams('q=jokic')

    render(
      <PlayerSearchControls
        teams={teams}
        query='jokic'
        teamId=''
      />
    )

    await userEvent.selectOptions(screen.getByLabelText('Team'), '9')

    expect(replace).toHaveBeenCalledWith('/players?q=jokic&teamId=9', {scroll: false})
  })
})
