import {MatchSummary} from '@/components/match/match-summary'
import type {GameSummary, ScoreboardTeam} from '@/lib/games-api'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next/image', () => ({
  default: ({alt, src}: {alt: string; src: string}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
    />
  )
}))

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

function makeSummary(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    id: 'game-1',
    name: 'Lakers at Celtics',
    shortName: 'LAL @ BOS',
    date: '2026-01-15T00:00:00.000Z',
    status: 'final',
    statusDetail: 'Final',
    period: 4,
    clock: '0:00',
    venue: 'TD Garden',
    homeTeam: makeTeam('2', 'BOS', 'Boston Celtics'),
    awayTeam: makeTeam('13', 'LAL', 'Los Angeles Lakers'),
    homeScore: 110,
    awayScore: 104,
    periodScores: {
      home: [28, 27, 30, 25],
      away: [26, 24, 28, 26]
    },
    homeTotals: [{name: 'points', label: 'Points', displayValue: '110'}],
    awayTotals: [{name: 'points', label: 'Points', displayValue: '104'}],
    homePlayers: [
      {
        athleteId: '100',
        name: 'Jayson Tatum',
        shortName: 'J. Tatum',
        jersey: '0',
        position: 'F',
        starter: true,
        minutes: '36',
        points: 28,
        rebounds: 8,
        assists: 5,
        steals: 1,
        blocks: 0,
        turnovers: 2,
        fouls: 2,
        fieldGoals: '10-20',
        threePointers: '4-9',
        freeThrows: '4-4'
      }
    ],
    awayPlayers: [
      {
        athleteId: '200',
        name: 'LeBron James',
        shortName: 'L. James',
        jersey: '23',
        position: 'F',
        starter: true,
        minutes: '34',
        points: 24,
        rebounds: 7,
        assists: 9,
        steals: 1,
        blocks: 1,
        turnovers: 3,
        fouls: 1,
        fieldGoals: '9-18',
        threePointers: '2-6',
        freeThrows: '4-5'
      }
    ],
    leaders: [
      {
        category: 'points',
        displayName: 'Points',
        athleteId: '100',
        athleteName: 'Jayson Tatum',
        shortName: 'J. Tatum',
        headshot: null,
        teamId: '2',
        teamAbbreviation: 'BOS',
        value: '28',
        summary: null
      }
    ],
    ...overrides
  }
}

describe('MatchSummary', () => {
  it('renders scoreboard teams, scores, venue, and status', () => {
    render(<MatchSummary initialSummary={makeSummary()} />)

    expect(screen.getByText('TD Garden')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
    expect(screen.getAllByText('LAL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('BOS').length).toBeGreaterThan(0)
    expect(screen.getAllByText('104').length).toBeGreaterThan(0)
    expect(screen.getAllByText('110').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', {name: /Los Angeles Lakers/i})).toHaveAttribute('href', '/teams/13')
    expect(screen.getByRole('link', {name: /Boston Celtics/i})).toHaveAttribute('href', '/teams/2')
  })

  it('hides scores for scheduled games', () => {
    render(
      <MatchSummary
        initialSummary={makeSummary({
          status: 'scheduled',
          statusDetail: 'Scheduled',
          homeScore: null,
          awayScore: null,
          periodScores: {home: [], away: []},
          homePlayers: [],
          awayPlayers: [],
          homeTotals: [],
          awayTotals: [],
          leaders: []
        })}
      />
    )

    expect(screen.getByText('vs')).toBeInTheDocument()
    expect(screen.queryByText('110')).not.toBeInTheDocument()
    expect(screen.queryByText('104')).not.toBeInTheDocument()
  })

  it('renders box score tabs and player links', async () => {
    render(<MatchSummary initialSummary={makeSummary()} />)

    expect(screen.getByRole('heading', {name: 'Box score'})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: 'LAL'})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: 'BOS'})).toBeInTheDocument()

    expect(screen.getByRole('link', {name: /L\. James/})).toHaveAttribute('href', '/players/200')

    await userEvent.click(screen.getByRole('tab', {name: 'BOS'}))

    const boxScore = screen.getByRole('tabpanel')
    expect(within(boxScore).getByRole('link', {name: /J\. Tatum/})).toHaveAttribute('href', '/players/100')
  })

  it('renders team totals and leaders', () => {
    render(<MatchSummary initialSummary={makeSummary()} />)

    expect(screen.getByRole('heading', {name: 'Team totals'})).toBeInTheDocument()
    expect(screen.getAllByText('Points').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', {name: 'Leaders'})).toBeInTheDocument()
    expect(screen.getAllByText('J. Tatum').length).toBeGreaterThan(0)
    expect(screen.getAllByText('28').length).toBeGreaterThan(0)
  })
})
