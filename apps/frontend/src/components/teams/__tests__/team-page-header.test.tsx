import {TeamFacts, TeamPageHeader} from '@/components/teams/team-page-header'
import type {TeamDetails} from '@/lib/teams-api'
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

function makeTeam(overrides: Partial<TeamDetails> = {}): TeamDetails {
  return {
    id: '16',
    name: 'Timberwolves',
    abbreviation: 'MIN',
    displayName: 'Minnesota Timberwolves',
    logo: 'https://logo/16.png',
    color: '266092',
    alternateColor: '79bc43',
    location: 'Minnesota',
    conference: 'Western Conference',
    division: 'Northwest',
    venue: 'Target Center',
    venueLocation: 'Minneapolis, MN',
    coach: 'Chris Finch',
    record: {
      season: 2026,
      seasonLabel: '2025–26',
      summary: '49-33',
      home: '26-15',
      road: '23-18',
      divisionRecord: '9-7',
      conferenceRecord: '31-21',
      pointsPerGame: '118.0',
      opponentPointsPerGame: '114.6',
      streak: 'W2',
      playoffSeed: '6'
    },
    ...overrides
  }
}

describe('TeamPageHeader', () => {
  it('shows the regular-season record with its season label', () => {
    render(<TeamPageHeader team={makeTeam()} />)

    expect(screen.getByRole('heading', {name: 'Minnesota Timberwolves'})).toBeInTheDocument()
    expect(screen.getByText(/49-33/)).toBeInTheDocument()
    expect(screen.getByText(/2025–26/)).toBeInTheDocument()
    expect(screen.queryByText('1-1')).not.toBeInTheDocument()
  })

  it('shows N/A when the regular-season summary is missing', () => {
    render(
      <TeamPageHeader
        team={makeTeam({
          record: {
            ...makeTeam().record,
            summary: null,
            seasonLabel: '2026–27'
          }
        })}
      />
    )

    expect(screen.getByText(/N\/A/)).toBeInTheDocument()
    expect(screen.getByText(/2026–27/)).toBeInTheDocument()
  })
})

describe('TeamFacts', () => {
  it('lists regular-season facts and hides empty values', () => {
    render(
      <TeamFacts
        team={makeTeam({
          record: {...makeTeam().record, playoffSeed: null},
          coach: null
        })}
      />
    )

    expect(screen.getByRole('heading', {name: 'Team details'})).toBeInTheDocument()
    expect(screen.getByText('Western Conference')).toBeInTheDocument()
    expect(screen.getByText('Northwest')).toBeInTheDocument()
    expect(screen.getByText('Target Center')).toBeInTheDocument()
    expect(screen.getByText('Minneapolis, MN')).toBeInTheDocument()
    expect(screen.getByText('26-15')).toBeInTheDocument()
    expect(screen.getByText('23-18')).toBeInTheDocument()
    expect(screen.getByText('118.0')).toBeInTheDocument()
    expect(screen.getByText('114.6')).toBeInTheDocument()
    expect(screen.queryByText('Playoff seed')).not.toBeInTheDocument()
    expect(screen.queryByText('Head coach')).not.toBeInTheDocument()
    expect(screen.queryByText('1-1')).not.toBeInTheDocument()
  })

  it('renders nothing when every fact is empty', () => {
    const {container} = render(
      <TeamFacts
        team={makeTeam({
          conference: null,
          division: null,
          venue: null,
          venueLocation: null,
          coach: null,
          record: {
            season: 2027,
            seasonLabel: '2026–27',
            summary: null,
            home: null,
            road: null,
            divisionRecord: null,
            conferenceRecord: null,
            pointsPerGame: null,
            opponentPointsPerGame: null,
            streak: null,
            playoffSeed: null
          }
        })}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
