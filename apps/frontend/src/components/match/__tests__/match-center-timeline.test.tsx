import {MatchCenterTimeline} from '@/components/match/match-center-timeline'
import {
  type ScoreboardGame,
  type ScoreboardTeam,
  getNearestScheduleDate,
  getOffsetMinutesForDate,
  getSchedule,
  getTodayDateKey
} from '@/lib/games-api'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const replace = vi.fn()
const searchParams = new URLSearchParams()
const {todayDateKey, offsetMinutes} = vi.hoisted(() => ({
  todayDateKey: vi.fn(() => '2026-01-15'),
  offsetMinutes: vi.fn((_dateKey: string) => 0)
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({replace}),
  usePathname: () => '/match-center',
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

vi.mock('@/lib/games-api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/games-api')>()
  return {
    ...actual,
    getTodayDateKey: todayDateKey,
    getOffsetMinutesForDate: offsetMinutes,
    seedOffsetMatchesBrowser: (initialOffsetMinutes: number | undefined, dateKey: string) =>
      typeof initialOffsetMinutes === 'number' && initialOffsetMinutes === offsetMinutes(dateKey),
    getSchedule: vi.fn(),
    getNearestScheduleDate: vi.fn()
  }
})

function makeTeam(id: string, abbreviation: string, displayName: string): ScoreboardTeam {
  return {
    id,
    name: displayName,
    displayName,
    abbreviation,
    logo: null,
    color: null
  }
}

function makeGame(overrides: Partial<ScoreboardGame> = {}): ScoreboardGame {
  return {
    id: '401809001',
    name: 'Lakers at Celtics',
    shortName: 'LAL @ BOS',
    date: '2026-01-15T00:30:00.000Z',
    status: 'final',
    statusDetail: 'Final',
    homeTeam: makeTeam('2', 'BOS', 'Boston Celtics'),
    awayTeam: makeTeam('13', 'LAL', 'Los Angeles Lakers'),
    homeScore: 110,
    awayScore: 104,
    seasonType: null,
    period: 4,
    clock: '0:00',
    venue: 'TD Garden',
    ...overrides
  }
}

describe('MatchCenterTimeline', () => {
  beforeEach(() => {
    replace.mockReset()
    searchParams.delete('date')
    vi.mocked(getTodayDateKey).mockReturnValue('2026-01-15')
    vi.mocked(getOffsetMinutesForDate).mockReturnValue(0)
    vi.mocked(getSchedule).mockReset()
    vi.mocked(getNearestScheduleDate).mockReset()
  })

  it('renders seeded games without refetching', () => {
    render(
      <MatchCenterTimeline
        initialDate='2026-01-15'
        initialOffsetMinutes={0}
        initialGames={[makeGame()]}
      />
    )

    expect(screen.getByRole('link', {name: 'View LAL @ BOS'})).toHaveAttribute(
      'href',
      '/match-center/401809001?date=2026-01-15'
    )
    expect(screen.getByText('TD Garden')).toBeInTheDocument()
    expect(screen.getAllByText('104').length).toBeGreaterThan(0)
    expect(screen.getAllByText('110').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', {name: 'Last game day'})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Today'})).not.toBeInTheDocument()
    expect(getSchedule).not.toHaveBeenCalled()
  })

  it('lists live games, then scheduled games, then finals', () => {
    render(
      <MatchCenterTimeline
        initialDate='2026-01-15'
        initialOffsetMinutes={0}
        initialGames={[
          makeGame({
            id: 'final',
            shortName: 'EARLY @ FINAL',
            status: 'final',
            date: '2026-01-15T00:00:00.000Z'
          }),
          makeGame({
            id: 'live-late',
            shortName: 'LATE @ LIVE',
            status: 'live',
            statusDetail: '6:44 - 4th',
            period: 4,
            clock: '6:44',
            date: '2026-01-15T03:00:00.000Z'
          }),
          makeGame({
            id: 'scheduled',
            shortName: 'MID @ SOON',
            status: 'scheduled',
            statusDetail: 'Scheduled',
            date: '2026-01-15T02:00:00.000Z'
          }),
          makeGame({
            id: 'live-early',
            shortName: 'EARLY @ LIVE',
            status: 'live',
            statusDetail: '12:00 - 1st',
            period: 1,
            clock: '12:00',
            date: '2026-01-15T01:00:00.000Z'
          })
        ]}
      />
    )

    expect(screen.getAllByRole('link', {name: /^View /}).map(link => link.getAttribute('aria-label'))).toEqual([
      'View EARLY @ LIVE',
      'View LATE @ LIVE',
      'View MID @ SOON',
      'View EARLY @ FINAL'
    ])
  })

  it('shows the empty state when a date has no games', async () => {
    searchParams.set('date', '2026-01-16')
    vi.mocked(getSchedule).mockResolvedValue([])

    render(
      <MatchCenterTimeline
        initialDate='2026-01-16'
        initialGames={[]}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No NBA games for this local date.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', {name: 'Last game day'})).toBeEnabled()
  })

  it('shows an alert when schedule loading fails', async () => {
    searchParams.set('date', '2026-01-16')
    vi.mocked(getSchedule).mockRejectedValue(new Error('upstream down'))

    render(
      <MatchCenterTimeline
        initialDate='2026-01-16'
        initialGames={[]}
      />
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load match center')
    expect(screen.getByText('upstream down')).toBeInTheDocument()
  })

  it('jumps to the nearest previous game day', async () => {
    searchParams.set('date', '2026-01-16')
    vi.mocked(getSchedule).mockResolvedValue([])
    vi.mocked(getNearestScheduleDate).mockResolvedValue('2026-01-14')

    render(
      <MatchCenterTimeline
        initialDate='2026-01-16'
        initialGames={[]}
      />
    )

    await screen.findByText('No NBA games for this local date.')
    await userEvent.click(screen.getByRole('button', {name: 'Last game day'}))

    expect(getNearestScheduleDate).toHaveBeenCalledWith('2026-01-16', 0, 'before')
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/match-center?date=2026-01-14', {scroll: false})
    })
  })

  it('refetches when the seeded offset is not the browser offset', async () => {
    vi.mocked(getSchedule).mockResolvedValue([
      makeGame({
        id: '401809016',
        shortName: 'MIA @ TOR',
        venue: 'Kaseya Center',
        awayTeam: makeTeam('14', 'MIA', 'Miami Heat'),
        homeTeam: makeTeam('28', 'TOR', 'Toronto Raptors')
      })
    ])

    render(
      <MatchCenterTimeline
        initialDate='2026-01-15'
        initialToday='2026-01-15'
        initialOffsetMinutes={-180}
        initialGames={[makeGame()]}
      />
    )

    expect(await screen.findByText('Kaseya Center')).toBeInTheDocument()
    expect(screen.queryByText('TD Garden')).not.toBeInTheDocument()
    expect(getSchedule).toHaveBeenCalledTimes(1)
    expect(getSchedule).toHaveBeenCalledWith('2026-01-15', 0)
  })

  it('loads the browser today when the seeded day is the server clock', async () => {
    vi.mocked(getTodayDateKey).mockReturnValue('2026-01-16')
    vi.mocked(getSchedule).mockResolvedValue([
      makeGame({
        id: '401809016',
        shortName: 'MIA @ TOR',
        venue: 'Kaseya Center',
        awayTeam: makeTeam('14', 'MIA', 'Miami Heat'),
        homeTeam: makeTeam('28', 'TOR', 'Toronto Raptors')
      })
    ])

    render(
      <MatchCenterTimeline
        initialDate='2026-01-15'
        initialToday='2026-01-15'
        initialOffsetMinutes={0}
        initialGames={[makeGame()]}
      />
    )

    expect(await screen.findByText('Kaseya Center')).toBeInTheDocument()
    expect(screen.getByText('Fri, January 16')).toBeInTheDocument()
    expect(screen.queryByText('TD Garden')).not.toBeInTheDocument()
    expect(getSchedule).toHaveBeenCalledTimes(1)
    expect(getSchedule).toHaveBeenCalledWith('2026-01-16', 0)
    expect(replace).not.toHaveBeenCalled()
  })

  it('shows one preseason header for games that share a season type', () => {
    render(
      <MatchCenterTimeline
        initialDate='2026-01-15'
        initialOffsetMinutes={0}
        initialGames={[
          makeGame({id: '401809001', seasonType: 'preseason'}),
          makeGame({id: '401809002', shortName: 'MIA @ TOR', seasonType: 'preseason'})
        ]}
      />
    )

    expect(screen.getAllByText('Preseason')).toHaveLength(1)
    expect(screen.getByRole('link', {name: 'View LAL @ BOS'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'View MIA @ TOR'})).toBeInTheDocument()
  })

  it('hides the season header when the season type is missing', () => {
    render(
      <MatchCenterTimeline
        initialDate='2026-01-15'
        initialOffsetMinutes={0}
        initialGames={[makeGame({seasonType: null})]}
      />
    )

    expect(screen.queryByText('Preseason')).not.toBeInTheDocument()
    expect(screen.queryByText('Regular')).not.toBeInTheDocument()
    expect(screen.queryByText('Playoffs')).not.toBeInTheDocument()
    expect(screen.queryByText('Play-in')).not.toBeInTheDocument()
  })
})
