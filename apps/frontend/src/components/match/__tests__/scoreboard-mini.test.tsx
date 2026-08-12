import {ScoreboardMini} from '@/components/match/scoreboard-mini'
import type {ScoreboardGame, ScoreboardTeam} from '@/lib/games-api'
import {getNearestScheduleDate, getSchedule} from '@/lib/games-api'
import {act, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const replace = vi.fn()
const searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({replace}),
  usePathname: () => '/',
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
    getTodayDateKey: () => '2026-01-15',
    getOffsetMinutesForDate: () => 0,
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
    period: 4,
    clock: '0:00',
    venue: 'TD Garden',
    ...overrides
  }
}

function setup() {
  return userEvent.setup({advanceTimers: vi.advanceTimersByTime})
}

describe('ScoreboardMini', () => {
  beforeEach(() => {
    replace.mockReset()
    searchParams.delete('date')
    vi.mocked(getSchedule).mockReset()
    vi.mocked(getNearestScheduleDate).mockReset()
    vi.useFakeTimers({shouldAdvanceTime: true})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders seeded games as compact cards without refetching', () => {
    render(
      <ScoreboardMini
        initialDate='2026-01-15'
        initialGames={[makeGame()]}
      />
    )

    expect(screen.getByRole('link', {name: 'View LAL @ BOS'})).toHaveAttribute(
      'href',
      '/match-center/401809001?date=2026-01-15'
    )
    expect(screen.getByText('LAL')).toBeInTheDocument()
    expect(screen.getByText('104')).toBeInTheDocument()
    expect(screen.getByText('110')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
    expect(getSchedule).not.toHaveBeenCalled()
  })

  it('shows the live period and clock while a game is in progress', async () => {
    vi.mocked(getSchedule).mockResolvedValue([
      makeGame({status: 'live', statusDetail: 'In Progress', period: 3, clock: '4:21'})
    ])

    render(<ScoreboardMini initialDate='2026-01-15' />)

    expect(await screen.findByText(/Q3 4:21/)).toHaveTextContent('In Progress - Q3 4:21')
    expect(getSchedule).toHaveBeenCalledWith('2026-01-15', 0)
  })

  it('offers the last game day when a date has no games', async () => {
    vi.mocked(getSchedule).mockResolvedValue([])

    render(<ScoreboardMini initialDate='2026-01-15' />)

    expect(await screen.findByText('No NBA games on this date.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', {name: 'Last game day'}).length).toBeGreaterThan(0)
  })

  it('steps to the previous day and writes the date to the URL', async () => {
    const user = setup()
    vi.mocked(getSchedule).mockResolvedValue([makeGame({id: '401809002', shortName: 'DET @ ORL'})])

    render(
      <ScoreboardMini
        initialDate='2026-01-15'
        initialGames={[makeGame()]}
      />
    )

    await user.click(screen.getByRole('button', {name: 'Previous day'}))

    await waitFor(() => {
      expect(getSchedule).toHaveBeenCalledWith('2026-01-14', 0)
    })
    expect(replace).toHaveBeenCalledWith('/?date=2026-01-14', {scroll: false})
    expect(await screen.findByText('Wed, January 14')).toBeInTheDocument()
  })

  it('drops the date parameter when jumping back to today', async () => {
    const user = setup()
    searchParams.set('date', '2026-01-12')
    vi.mocked(getSchedule).mockResolvedValue([makeGame()])

    render(<ScoreboardMini initialDate='2026-01-15' />)

    await user.click(screen.getByRole('button', {name: 'Today'}))

    expect(replace).toHaveBeenCalledWith('/', {scroll: false})
    await waitFor(() => {
      expect(getSchedule).toHaveBeenCalledWith('2026-01-15', 0)
    })
  })

  it('jumps to the nearest previous game day', async () => {
    const user = setup()
    vi.mocked(getSchedule).mockResolvedValue([])
    vi.mocked(getNearestScheduleDate).mockResolvedValue('2026-01-13')

    render(<ScoreboardMini initialDate='2026-01-15' />)

    await screen.findByText('No NBA games on this date.')
    await user.click(screen.getAllByRole('button', {name: 'Last game day'})[0])

    expect(getNearestScheduleDate).toHaveBeenCalledWith('2026-01-15', 0, 'before')
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/?date=2026-01-13', {scroll: false})
    })
  })

  it('keeps the last known scores and warns when a refresh fails', async () => {
    vi.mocked(getSchedule).mockRejectedValue(new Error('upstream down'))

    render(
      <ScoreboardMini
        initialDate='2026-01-15'
        initialGames={[makeGame()]}
      />
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('Scores may be out of date: upstream down')
    expect(screen.getByText('110')).toBeInTheDocument()
  })

  it('refreshes scores on the polling interval', async () => {
    vi.mocked(getSchedule).mockResolvedValue([makeGame({homeScore: 118, awayScore: 111})])

    render(
      <ScoreboardMini
        initialDate='2026-01-15'
        initialGames={[makeGame()]}
      />
    )

    expect(screen.getByText('110')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })

    await waitFor(() => {
      expect(screen.getByText('118')).toBeInTheDocument()
    })
    expect(getSchedule).toHaveBeenCalledTimes(1)
  })
})
