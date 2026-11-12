import LeadersPage from '@/app/(hub)/leaders/page'
import {LeadersBoard, LeadersFilters} from '@/components/leaders/leaders-board'
import {type LeadersResponse, getLeaders} from '@/lib/leaders-api'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const replace = vi.fn()
let searchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({replace}),
  usePathname: () => '/leaders',
  useSearchParams: () => searchParams
}))
vi.mock('@/lib/leaders-api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/leaders-api')>()),
  getLeaders: vi.fn()
}))

const data: LeadersResponse = {
  season: 2026,
  seasonLabel: '2025–26',
  seasonType: 'regular',
  currentSeason: 2027,
  categories: [
    {
      stat: 'pts',
      label: 'Points',
      abbreviation: 'PTS',
      format: 'average',
      qualification: {stat: 'gp', minimum: 7, teamGames: 10},
      leaders: [
        {
          rank: 1,
          playerId: '3945274',
          name: 'Luka Doncic',
          headshot: null,
          position: 'G',
          teamId: '13',
          teamAbbreviation: 'LAL',
          teamName: 'Los Angeles Lakers',
          gamesPlayed: 10,
          value: 33.5
        }
      ]
    }
  ]
}

describe('season leaders', () => {
  beforeEach(() => {
    replace.mockReset()
    searchParams = new URLSearchParams('season=2026&seasonType=playoffs&stat=pts')
    vi.mocked(getLeaders).mockResolvedValue(data)
  })

  it('renders ranks, values, games, player and team links, and a full-list link', () => {
    render(<LeadersBoard data={data} />)
    const table = screen.getByRole('table', {name: 'Points leaders'})
    expect(within(table).getByRole('cell', {name: '1'})).toBeInTheDocument()
    expect(within(table).getByRole('cell', {name: '33.5'})).toBeInTheDocument()
    expect(within(table).getByRole('cell', {name: '10'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Luka Doncic'})).toHaveAttribute('href', '/players/3945274')
    expect(screen.getByRole('link', {name: 'LAL'})).toHaveAttribute('href', '/teams/13')
    expect(screen.getByRole('link', {name: 'Points full list'})).toHaveAttribute(
      'href',
      '/leaders?season=2026&seasonType=regular&stat=pts'
    )
    expect(screen.getByText(/Min. 7 games played/)).toBeInTheDocument()
  })

  it('shows shooting percentages on the 0–100 scale', () => {
    render(
      <LeadersBoard
        data={{
          ...data,
          categories: [
            {...data.categories[0], format: 'percent', leaders: [{...data.categories[0].leaders[0], value: 47.6}]}
          ]
        }}
      />
    )
    expect(screen.getByRole('cell', {name: '47.6%'})).toBeInTheDocument()
  })

  it('shows an empty state when nobody qualifies', () => {
    render(<LeadersBoard data={{...data, categories: [{...data.categories[0], leaders: []}]}} />)
    expect(screen.getByText('No qualifying players yet for this season and season type.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('returns to the board without losing season and season type', () => {
    render(
      <LeadersBoard
        data={{...data, seasonType: 'playoffs'}}
        stat='pts'
      />
    )
    expect(screen.getByRole('link', {name: 'All leaders'})).toHaveAttribute(
      'href',
      '/leaders?season=2026&seasonType=playoffs'
    )
    expect(screen.queryByRole('link', {name: 'Points full list'})).not.toBeInTheDocument()
  })

  it('preserves season and stat in season-type links', () => {
    render(
      <LeadersFilters
        data={data}
        stat='pts'
      />
    )
    expect(screen.getByRole('link', {name: 'Playoffs'})).toHaveAttribute(
      'href',
      '/leaders?season=2026&seasonType=playoffs&stat=pts'
    )
    expect(screen.getByRole('link', {name: 'Regular'})).toHaveAttribute('aria-current', 'page')
  })

  it('preserves stat and season type when selecting a season or returning to the current season', async () => {
    render(
      <LeadersFilters
        data={data}
        stat='pts'
      />
    )
    await userEvent.selectOptions(screen.getByLabelText('Season'), '2025')
    expect(replace).toHaveBeenCalledWith('/leaders?season=2025&seasonType=playoffs&stat=pts', {scroll: false})
    await userEvent.selectOptions(screen.getByLabelText('Season'), '2027')
    expect(replace).toHaveBeenCalledWith('/leaders?seasonType=playoffs&stat=pts', {scroll: false})
  })

  it('server-renders the selected full list with metadata and player schema', async () => {
    const page = await LeadersPage({
      searchParams: Promise.resolve({season: '2026', seasonType: 'playoffs', stat: 'pts'})
    })
    const {container} = render(page)
    expect(getLeaders).toHaveBeenCalledWith({season: 2026, seasonType: 'playoffs', stat: 'pts', limit: 50})
    expect(screen.getByRole('heading', {level: 1, name: 'NBA Season Leaders'})).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(container.querySelector('script[type="application/ld+json"]')?.textContent).toContain('/players/3945274')
  })

  it('defaults malformed page parameters to the current regular-season board', async () => {
    await LeadersPage({searchParams: Promise.resolve({season: '1900', seasonType: 'invalid', stat: ['pts', 'reb']})})
    expect(getLeaders).toHaveBeenCalledWith({season: undefined, seasonType: 'regular', stat: undefined, limit: 5})
  })
})
