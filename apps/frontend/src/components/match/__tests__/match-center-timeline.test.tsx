import {MatchCenterTimeline} from '@/components/match/match-center-timeline'
import type {ScoreboardGame, ScoreboardTeam} from '@/lib/games-api'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const replace = vi.fn()
const searchParams = new URLSearchParams()

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
    getTodayDateKey: () => '2026-01-15',
    getOffsetMinutesForDate: () => 0,
    getSchedule: vi.fn(),
    getNearestScheduleDate: vi.fn()
  }
})

import {getNearestScheduleDate, getSchedule} from '@/lib/games-api'

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

describe('MatchCenterTimeline', () => {
  beforeEach(() => {
    replace.mockReset()
    searchParams.delete('date')
    vi.mocked(getSchedule).mockReset()
    vi.mocked(getNearestScheduleDate).mockReset()
  })

  it('renders seeded games without refetching', () => {
    render(
      <MatchCenterTimeline
        initialDate='2026-01-15'
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
    expect(getSchedule).not.toHaveBeenCalled()
  })

  it('shows the empty state when a date has no games', async () => {
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
  })

  it('shows an alert when schedule loading fails', async () => {
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
    vi.mocked(getSchedule).mockResolvedValue([])
    vi.mocked(getNearestScheduleDate).mockResolvedValue('2026-01-14')

    render(
      <MatchCenterTimeline
        initialDate='2026-01-16'
        initialGames={[]}
      />
    )

    await screen.findByText('No NBA games for this local date.')
    await userEvent.click(screen.getAllByRole('button', {name: 'Last game day'})[0])

    expect(getNearestScheduleDate).toHaveBeenCalledWith('2026-01-16', 0, 'before')
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/match-center?date=2026-01-14', {scroll: false})
    })
  })
})
