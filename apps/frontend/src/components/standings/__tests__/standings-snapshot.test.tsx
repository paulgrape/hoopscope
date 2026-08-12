import {StandingsSnapshot} from '@/components/standings/standings-snapshot'
import type {StandingTeam} from '@/lib/standings-api'
import {render, screen} from '@testing-library/react'
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

function makeTeam(seed: number, overrides: Partial<StandingTeam> = {}): StandingTeam {
  return {
    id: `team-${seed}`,
    displayName: `Team ${seed}`,
    shortName: `Short ${seed}`,
    abbreviation: `T${seed}`,
    logo: `https://logo/${seed}.png`,
    color: null,
    seed,
    wins: 50 - seed,
    losses: 10 + seed,
    winPct: '.700',
    gamesBehind: seed === 1 ? '-' : String(seed),
    streak: 'W1',
    home: '25-5',
    road: '20-10',
    vsDiv: '8-2',
    vsConf: '30-10',
    lastTen: '7-3',
    clincher: null,
    playoffStatus: seed <= 6 ? 'playoff' : seed <= 10 ? 'play-in' : 'out',
    ...overrides
  }
}

const conference = {
  id: 'west',
  name: 'Western Conference',
  abbreviation: 'WEST',
  teams: Array.from({length: 12}, (_, index) => makeTeam(index + 1))
}

describe('StandingsSnapshot', () => {
  it('shows only the top teams of each conference with records', () => {
    render(<StandingsSnapshot conferences={[conference]} />)

    expect(screen.getByRole('heading', {name: 'Western Conference'})).toBeInTheDocument()
    expect(screen.getByText('Top 6')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Short 1'})).toHaveAttribute('href', '/teams/team-1')
    expect(screen.getByText('49-11')).toBeInTheDocument()
    expect(screen.queryByRole('link', {name: 'Short 7'})).not.toBeInTheDocument()
  })

  it('respects a custom team count', () => {
    render(
      <StandingsSnapshot
        conferences={[conference]}
        teamCount={10}
      />
    )

    expect(screen.getByText('Top 10')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Short 10'})).toBeInTheDocument()
    expect(screen.queryByRole('link', {name: 'Short 11'})).not.toBeInTheDocument()
  })

  it('explains when standings are missing', () => {
    render(<StandingsSnapshot conferences={[]} />)

    expect(screen.getByText('Standings are unavailable right now.')).toBeInTheDocument()
  })
})
