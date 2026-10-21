import {TeamScheduleStrip} from '@/components/teams/team-schedule-strip'
import type {TeamScheduleGame, TeamScheduleResponse} from '@/lib/teams-api'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

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
  const scrollIntoViewMock = vi.fn()
  const scrollByMock = vi.fn()

  beforeEach(() => {
    scrollIntoViewMock.mockClear()
    scrollByMock.mockClear()
    Element.prototype.scrollIntoView = scrollIntoViewMock
    Element.prototype.scrollBy = scrollByMock
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
    expect(scrollIntoViewMock).toHaveBeenCalledWith({block: 'nearest', inline: 'center'})

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
