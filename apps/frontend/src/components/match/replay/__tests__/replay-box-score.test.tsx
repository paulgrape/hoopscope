import {ReplayBoxScore} from '@/components/match/replay/replay-box-score'
import type {LiveGameState, LivePlayEvent} from '@/lib/games-api'
import {render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

const HOME_TEAM = {id: '2', name: 'Boston Celtics', abbreviation: 'BOS', logo: '', color: '008348'}
const AWAY_TEAM = {id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL', logo: '', color: '552583'}

function makePlay(overrides: Partial<LivePlayEvent> & {id: string; text: string}): LivePlayEvent {
  return {
    sequenceNumber: 1,
    period: 1,
    clock: '12:00',
    elapsedSeconds: 0,
    scoringPlay: false,
    scoreValue: 0,
    homeScore: 0,
    awayScore: 0,
    ...overrides
  }
}

function makeGame(overrides: Partial<LiveGameState> = {}): LiveGameState {
  return {
    id: 'game-1',
    name: 'Lakers at Celtics',
    date: '2026-01-15T00:00:00.000Z',
    homeTeam: HOME_TEAM,
    awayTeam: AWAY_TEAM,
    homeScore: 3,
    awayScore: 2,
    quarter: 1,
    clock: '10:00',
    lastPlay: '',
    status: 'live',
    paused: false,
    playIndex: 2,
    totalPlays: 3,
    timeline: [],
    plays: [
      makePlay({
        id: '1',
        teamId: AWAY_TEAM.id,
        text: 'LeBron James makes 25-foot three point jumper (Anthony Davis assists)',
        scoringPlay: true,
        scoreValue: 3
      }),
      makePlay({id: '2', teamId: HOME_TEAM.id, text: 'Jayson Tatum makes driving layup'}),
      makePlay({id: '3', teamId: HOME_TEAM.id, text: 'Jayson Tatum defensive rebound'})
    ],
    ...overrides
  }
}

describe('ReplayBoxScore', () => {
  it('renders a table per team from the play-by-play', () => {
    render(<ReplayBoxScore game={makeGame()} />)

    const [awayTable, homeTable] = screen.getAllByRole('table')

    expect(within(awayTable).getByText('Los Angeles Lakers')).toBeInTheDocument()
    expect(within(awayTable).getByRole('rowheader', {name: 'LeBron James'})).toBeInTheDocument()
    expect(within(awayTable).getByRole('rowheader', {name: 'Anthony Davis'})).toBeInTheDocument()
    expect(within(homeTable).getByRole('rowheader', {name: 'Jayson Tatum'})).toBeInTheDocument()
  })

  it('omits minutes until the final box score is available', () => {
    render(<ReplayBoxScore game={makeGame()} />)

    expect(screen.queryByRole('columnheader', {name: /MIN/})).not.toBeInTheDocument()
  })

  it('shows minutes from the final box score, matching punctuated names', () => {
    render(
      <ReplayBoxScore
        game={makeGame({
          status: 'final',
          finalPlayers: {
            home: [{name: 'Jayson Tatum', points: 2, rebounds: 1, assists: 0, minutes: '38'}],
            away: [{name: 'Lebron James', points: 3, rebounds: 0, assists: 0, minutes: '35'}]
          }
        })}
      />
    )

    expect(screen.getAllByRole('columnheader', {name: /MIN/})).toHaveLength(2)
    expect(screen.getByText('35')).toBeInTheDocument()
    expect(screen.getByText('38')).toBeInTheDocument()
  })

  it('reports teams without recorded plays', () => {
    render(<ReplayBoxScore game={makeGame({plays: []})} />)

    expect(screen.getByText('No plays recorded for Los Angeles Lakers yet.')).toBeInTheDocument()
    expect(screen.getByText('No plays recorded for Boston Celtics yet.')).toBeInTheDocument()
  })
})
