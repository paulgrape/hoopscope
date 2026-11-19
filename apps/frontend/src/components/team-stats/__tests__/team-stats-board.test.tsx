import TeamStatsPage from '@/app/(hub)/team-stats/page'
import {TeamStatsBoard} from '@/components/team-stats/team-stats-board'
import {type TeamStatRow, type TeamStatsResponse, getTeamStats} from '@/lib/team-stats-api'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const replace = vi.fn()
let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({replace}),
  usePathname: () => '/team-stats',
  useSearchParams: () => searchParams
}))

vi.mock('next/image', () => ({
  default: ({alt, src}: {alt: string; src: string}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
    />
  )
}))

vi.mock('@/lib/team-stats-api', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/team-stats-api')>()),
  getTeamStats: vi.fn()
}))

function team(overrides: Partial<TeamStatRow> & Pick<TeamStatRow, 'id' | 'name'>): TeamStatRow {
  return {
    abbreviation: overrides.name.slice(0, 3).toUpperCase(),
    logo: null,
    gp: 82,
    off: 110,
    def: 110,
    net: 0,
    pace: 100,
    topg: 12,
    pts: 110,
    oppPts: 110,
    fgm: 40,
    fga: 85,
    fgPct: 47,
    threePm: 12,
    threePa: 34,
    threePct: 35,
    ftm: 16,
    fta: 20,
    ftPct: 80,
    oreb: 10,
    orPct: 25,
    ast: 25,
    astTo: 2,
    scEff: 1.1,
    shEff: 0.55,
    dr: 33,
    reb: 43,
    stl: 7,
    blk: 5,
    pf: 19,
    ptsDiff: 0,
    fgPctDiff: 0,
    threePctDiff: 0,
    ftPctDiff: 0,
    orDiff: 0,
    drDiff: 0,
    rebDiff: 0,
    astDiff: 0,
    toDiff: 0,
    stlDiff: 0,
    blkDiff: 0,
    pfDiff: 0,
    ...overrides
  }
}

const data: TeamStatsResponse = {
  season: 2026,
  seasonLabel: '2025–26',
  seasonType: 'regular',
  currentSeason: 2027,
  teams: [
    team({id: '7', name: 'Denver Nuggets', net: 4.9, topg: 12.2, fgPct: 49.6}),
    team({id: '2', name: 'Boston Celtics', net: 8.1, topg: 11.5, fgPct: 46.2})
  ]
}

function teamOrder() {
  const table = screen.getByRole('table', {name: 'Team season statistics'})
  return within(table)
    .getAllByRole('link')
    .map(link => link.textContent)
}

describe('team stats sheet', () => {
  beforeEach(() => {
    replace.mockReset()
    searchParams = new URLSearchParams('season=2026&seasonType=playoffs')
    vi.mocked(getTeamStats).mockResolvedValue(data)
  })

  it('opens sorted by net rating and toggles any stat column', async () => {
    render(<TeamStatsBoard data={data} />)

    const table = screen.getByRole('table', {name: 'Team season statistics'})
    expect(within(table).getByRole('columnheader', {name: 'NET'})).toHaveAttribute('aria-sort', 'descending')
    expect(teamOrder()).toEqual(['Boston Celtics', 'Denver Nuggets'])
    expect(within(table).getByRole('cell', {name: '49.6%'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Denver Nuggets'})).toHaveAttribute('href', '/teams/7')

    await userEvent.click(screen.getByRole('button', {name: 'NET'}))
    expect(teamOrder()).toEqual(['Denver Nuggets', 'Boston Celtics'])

    await userEvent.click(screen.getByRole('button', {name: 'TOPG'}))
    expect(within(table).getByRole('columnheader', {name: 'TOPG'})).toHaveAttribute('aria-sort', 'descending')
    expect(teamOrder()).toEqual(['Denver Nuggets', 'Boston Celtics'])

    await userEvent.click(screen.getByRole('button', {name: 'TOPG'}))
    expect(teamOrder()).toEqual(['Boston Celtics', 'Denver Nuggets'])

    await userEvent.click(screen.getByRole('button', {name: 'FG%'}))
    expect(teamOrder()).toEqual(['Denver Nuggets', 'Boston Celtics'])

    await userEvent.click(screen.getByRole('button', {name: 'Team'}))
    expect(teamOrder()).toEqual(['Boston Celtics', 'Denver Nuggets'])
  })

  it('shows an empty state when the season has no teams', () => {
    render(<TeamStatsBoard data={{...data, teams: []}} />)
    expect(screen.getByText('No team statistics for this season yet.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('keeps the season in the regular and playoff links', () => {
    render(<TeamStatsBoard data={data} />)
    expect(screen.getByRole('link', {name: 'Playoffs'})).toHaveAttribute(
      'href',
      '/team-stats?season=2026&seasonType=playoffs'
    )
    expect(screen.getByRole('link', {name: 'Regular'})).toHaveAttribute('aria-current', 'page')
  })

  it('server-renders the sheet for the requested season', async () => {
    const page = await TeamStatsPage({
      searchParams: Promise.resolve({season: '2026', seasonType: 'playoffs'})
    })
    const {container} = render(page)
    expect(getTeamStats).toHaveBeenCalledWith({season: 2026, seasonType: 'playoffs'})
    expect(screen.getByRole('heading', {level: 1, name: 'NBA Team Stats'})).toBeInTheDocument()
    expect(screen.getByText('OFF, DEF, NET, and PACE are estimated from ESPN counting stats.')).toBeInTheDocument()
    expect(screen.getByRole('table', {name: 'Team season statistics'})).toBeInTheDocument()
    expect(container.querySelector('script[type="application/ld+json"]')?.textContent).toContain('/teams/2')
  })

  it('defaults malformed page parameters to the current regular season', async () => {
    await TeamStatsPage({searchParams: Promise.resolve({season: '1900', seasonType: 'invalid'})})
    expect(getTeamStats).toHaveBeenCalledWith({season: undefined, seasonType: 'regular'})
  })
})
