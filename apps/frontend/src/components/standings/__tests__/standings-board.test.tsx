import {StandingsBoard} from '@/components/standings/standings-board'
import type {ConferenceStandings, StandingTeam} from '@/lib/standings-api'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

function makeTeam(id: string, shortName: string): StandingTeam {
  return {
    id,
    displayName: `${shortName} Full`,
    shortName,
    abbreviation: shortName.slice(0, 3).toUpperCase(),
    logo: null,
    color: null,
    seed: 1,
    wins: 10,
    losses: 5,
    winPct: '.667',
    gamesBehind: '-',
    streak: 'W1',
    home: '6-2',
    road: '4-3',
    vsDiv: '3-1',
    vsConf: '7-3',
    lastTen: '6-4',
    clincher: null,
    playoffStatus: 'playoff'
  }
}

const conferences: ConferenceStandings[] = [
  {
    id: 'east',
    name: 'Eastern Conference',
    abbreviation: 'East',
    teams: [makeTeam('2', 'Celtics')],
    divisions: [
      {
        id: 'atlantic',
        name: 'Atlantic',
        teams: [makeTeam('2', 'Celtics')]
      }
    ]
  }
]

describe('StandingsBoard', () => {
  it('opens on the conference tables', () => {
    render(<StandingsBoard conferences={conferences} />)

    expect(screen.getByRole('tab', {name: 'Conference'})).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('table', {name: 'Eastern Conference'})).toBeInTheDocument()
    expect(screen.queryByRole('table', {name: 'Atlantic'})).not.toBeInTheDocument()
  })

  it('shows division tables after choosing Division', async () => {
    render(<StandingsBoard conferences={conferences} />)

    await userEvent.click(screen.getByRole('tab', {name: 'Division'}))

    expect(screen.getByRole('tab', {name: 'Division'})).toHaveAttribute('aria-selected', 'true')
    const atlantic = screen.getByRole('table', {name: 'Atlantic'})
    expect(within(atlantic).getByRole('row', {name: /Celtics/})).not.toHaveClass('border-l-emerald-500')
    expect(screen.queryByRole('table', {name: 'Eastern Conference'})).not.toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Eastern Conference'})).toBeInTheDocument()
    expect(screen.queryByText(/Playoff \(seeds 1–6\)/)).not.toBeInTheDocument()
  })
})
