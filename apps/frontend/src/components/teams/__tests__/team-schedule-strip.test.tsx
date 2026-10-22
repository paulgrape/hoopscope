import {TeamScheduleStrip} from '@/components/teams/team-schedule-strip'
import type {TeamScheduleGame, TeamScheduleResponse} from '@/lib/teams-api'
import {render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

function makeGame(
  id: string,
  overrides: Partial<TeamScheduleGame> = {}
): TeamScheduleGame {
  return {
    id,
    name: `Warriors at Lakers (${id})`,
    shortName: `GSW @ LAL (${id})`,
    date: '2026-01-15T02:00:00Z',
    seasonType: 'regular',
    status: 'final',
    statusDetail: 'Final',
    homeTeam: {
      id: '13',
      name: 'Lakers',
      displayName: 'Los Angeles Lakers',
      abbreviation: 'LAL',
      logo: null,
      color: null
    },
    awayTeam: {
      id: '9',
      name: 'Warriors',
      displayName: 'Golden State Warriors',
      abbreviation: 'GSW',
      logo: null,
      color: null
    },
    homeScore: 112,
    awayScore: 105,
    period: 4,
    clock: '0.0',
    venue: 'crypto.com Arena',
    isHome: true,
    result: 'W',
    ...overrides
  }
}

const sampleSchedule: TeamScheduleResponse = {
  season: 2026,
  seasonLabel: '2025–26',
  currentSeason: 2026,
  games: [
    makeGame('1', {result: 'L', homeScore: 99, awayScore: 108}),
    makeGame('2', {result: 'W', homeScore: 115, awayScore: 110}),
    makeGame('3', {result: 'W', homeScore: 120, awayScore: 114}),
    makeGame('4', {result: 'L', homeScore: 101, awayScore: 107}),
    makeGame('5', {result: 'W', homeScore: 118, awayScore: 102}),
    makeGame('6', {result: 'W', homeScore: 112, awayScore: 105}),
    makeGame('7', {
      status: 'scheduled',
      statusDetail: 'Scheduled',
      homeScore: null,
      awayScore: null,
      result: null
    }),
    makeGame('8', {
      status: 'scheduled',
      statusDetail: 'Scheduled',
      homeScore: null,
      awayScore: null,
      result: null
    })
  ]
}

describe('TeamScheduleStrip', () => {
  const scrollToMock = vi.fn()
  const scrollByMock = vi.fn()

  beforeEach(() => {
    scrollToMock.mockClear()
    scrollByMock.mockClear()
    Element.prototype.scrollTo = scrollToMock
    Element.prototype.scrollBy = scrollByMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders scores, the five form pills without card Form labels, the Next label, and page scroll buttons', async () => {
    const user = userEvent.setup()
    render(<TeamScheduleStrip schedule={sampleSchedule} />)

    const formRegion = screen.getByLabelText('Recent form')
    const formItems = within(formRegion).getAllByRole('listitem')
    expect(formItems).toHaveLength(5)
    expect(formItems.map(item => item.textContent)).toEqual(['W', 'W', 'L', 'W', 'W'])

    // Only the header form pill bar should render the word "Form", not individual cards
    expect(screen.getAllByText('Form')).toHaveLength(1)

    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('118')).toBeInTheDocument()
    expect(screen.getByText('102')).toBeInTheDocument()

    const anchorCard = screen.getByRole('link', {name: 'View GSW @ LAL (7)'})
    expect(anchorCard).toHaveAttribute('href', '/match-center/7')
    expect(scrollToMock).toHaveBeenCalledWith({left: 0})

    const prevButton = screen.getByRole('button', {name: 'Previous games'})
    const nextButton = screen.getByRole('button', {name: 'Next games'})
    expect(prevButton).toBeEnabled()
    expect(nextButton).toBeEnabled()

    await user.click(prevButton)
    expect(scrollByMock).toHaveBeenLastCalledWith({
      left: -864,
      behavior: 'smooth'
    })
  })

  it('scrolls to the next card edge and does not pass the last card', async () => {
    const user = userEvent.setup()
    const cardWidth = 256
    const gap = 12
    const stride = cardWidth + gap
    const descriptors = {
      offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth'),
      offsetLeft: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft'),
      clientWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
    }

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return this.tagName === 'LI' ? cardWidth : 0
      }
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get() {
        if (this.parentElement?.tagName !== 'UL') return 0
        return Array.prototype.indexOf.call(this.parentElement.children, this) * stride
      }
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return this.tagName === 'UL' ? 300 : 0
      }
    })

    try {
      render(<TeamScheduleStrip schedule={sampleSchedule} />)
      const list = screen.getAllByRole('list').find(element => element.tagName === 'UL')
      if (!list) throw new Error('schedule list missing')
      scrollToMock.mockClear()

      await user.click(screen.getByRole('button', {name: 'Next games'}))
      expect(scrollToMock).toHaveBeenLastCalledWith({left: stride, behavior: 'smooth'})

      scrollToMock.mockClear()
      Object.defineProperty(list, 'scrollLeft', {configurable: true, value: 7 * stride})
      list.dispatchEvent(new Event('scroll'))

      const nextButton = await screen.findByRole('button', {name: 'Next games'})
      await waitFor(() => expect(nextButton).toBeDisabled())
      await user.click(nextButton)
      expect(scrollToMock).not.toHaveBeenCalled()
    } finally {
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (descriptor) {
          Object.defineProperty(HTMLElement.prototype, key, descriptor)
        }
      }
    }
  })

  it('renders an alert when the schedule request failed', () => {
    render(<TeamScheduleStrip schedule={null} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the team schedule right now.')
  })

  it('renders an empty state when no games are scheduled', () => {
    render(
      <TeamScheduleStrip
        schedule={{season: 2026, seasonLabel: '2025–26', currentSeason: 2026, games: []}}
      />
    )

    expect(screen.getByText('No games scheduled for this season.')).toBeInTheDocument()
  })
})
