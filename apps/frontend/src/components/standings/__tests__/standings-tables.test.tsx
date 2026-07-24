import {StandingsTables} from '@/components/standings/standings-tables'
import type {ConferenceStandings, StandingTeam} from '@/lib/standings-api'
import {render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

function makeTeam(seed: number, shortName: string): StandingTeam {
  return {
    id: String(seed),
    displayName: `${shortName} Full`,
    shortName,
    abbreviation: shortName.slice(0, 3).toUpperCase(),
    logo: null,
    color: null,
    seed,
    wins: 50 - seed,
    losses: 20 + seed,
    winPct: '.650',
    gamesBehind: `${seed}.0`,
    streak: 'W2',
    home: '20-10',
    road: '18-12',
    vsDiv: '10-4',
    vsConf: '30-12',
    lastTen: '7-3',
    clincher: null,
    playoffStatus: seed <= 6 ? 'playoff' : seed <= 10 ? 'play-in' : 'out'
  }
}

const conferences: ConferenceStandings[] = [
  {
    id: 'east',
    name: 'Eastern Conference',
    abbreviation: 'East',
    teams: [makeTeam(1, 'Celtics'), makeTeam(8, 'Heat')]
  },
  {
    id: 'west',
    name: 'Western Conference',
    abbreviation: 'West',
    teams: [makeTeam(2, 'Thunder')]
  }
]

describe('StandingsTables', () => {
  it('renders one labelled table per conference', () => {
    render(<StandingsTables conferences={conferences} />)

    expect(screen.getByRole('table', {name: 'Eastern Conference'})).toBeInTheDocument()
    expect(screen.getByRole('table', {name: 'Western Conference'})).toBeInTheDocument()
  })

  it('renders team rows with record and a link to the team page', () => {
    render(<StandingsTables conferences={conferences} />)

    const east = screen.getByRole('table', {name: 'Eastern Conference'})
    const celticsRow = within(east).getByRole('row', {name: /Celtics/})

    expect(within(celticsRow).getByText('49')).toBeInTheDocument()
    expect(within(celticsRow).getByText('21')).toBeInTheDocument()
    expect(within(celticsRow).getByRole('link')).toHaveAttribute('href', '/teams/1')
  })

  it('shows the playoff legend', () => {
    render(<StandingsTables conferences={conferences} />)

    expect(screen.getByText(/Playoff \(seeds 1–6\)/)).toBeInTheDocument()
    expect(screen.getByText(/Play-In \(seeds 7–10\)/)).toBeInTheDocument()
    expect(screen.getByText(/Out of postseason/)).toBeInTheDocument()
  })
})
