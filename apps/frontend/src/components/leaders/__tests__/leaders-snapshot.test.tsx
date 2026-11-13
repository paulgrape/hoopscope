import {LeadersSnapshot} from '@/components/leaders/leaders-snapshot'
import type {Leader, LeaderCategory} from '@/lib/leaders-api'
import {render, screen, within} from '@testing-library/react'
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

function makeLeader(rank: number, overrides: Partial<Leader> = {}): Leader {
  return {
    rank,
    playerId: `player-${rank}`,
    name: `Player ${rank}`,
    headshot: null,
    position: 'G',
    teamId: `team-${rank}`,
    teamAbbreviation: `T${rank}`,
    teamName: `Team ${rank}`,
    gamesPlayed: 10,
    value: 30 - rank,
    ...overrides
  }
}

function makeCategory(overrides: Partial<LeaderCategory> = {}): LeaderCategory {
  return {
    stat: 'pts',
    label: 'Points',
    abbreviation: 'PTS',
    format: 'average',
    qualification: {stat: 'gp', minimum: 7, teamGames: 10},
    leaders: [
      makeLeader(1, {
        name: 'Luka Doncic',
        playerId: '3945274',
        teamId: '13',
        teamAbbreviation: 'LAL',
        value: 33.5,
        headshot: 'https://a.espncdn.com/luka.png'
      })
    ],
    ...overrides
  }
}

describe('LeadersSnapshot', () => {
  it('shows points, assists, and rebounds in that order and links players and teams', () => {
    render(
      <LeadersSnapshot
        categories={[
          makeCategory(),
          makeCategory({
            stat: 'reb',
            label: 'Rebounds',
            abbreviation: 'REB',
            leaders: [makeLeader(1, {name: 'Domantas Sabonis', playerId: 'reb-1', value: 12.4})]
          }),
          makeCategory({
            stat: 'stl',
            label: 'Steals',
            abbreviation: 'STL',
            leaders: [makeLeader(1, {name: 'Steals Leader', playerId: 'stl-1'})]
          }),
          makeCategory({
            stat: 'ast',
            label: 'Assists',
            abbreviation: 'AST',
            leaders: [
              makeLeader(1, {name: 'Trae Young', playerId: 'ast-1', teamId: '1', teamAbbreviation: 'ATL', value: 11.2})
            ]
          })
        ]}
      />
    )

    expect(screen.getAllByRole('heading', {level: 3}).map(heading => heading.textContent)).toEqual([
      'Points',
      'Assists',
      'Rebounds'
    ])
    expect(screen.queryByRole('heading', {name: 'Steals'})).not.toBeInTheDocument()

    const points = screen.getByRole('region', {name: 'Points'})
    const name = within(points).getByRole('link', {name: 'Luka Doncic'})
    const team = within(points).getByRole('link', {name: 'LAL'})
    expect(name).toHaveAttribute('href', '/players/3945274')
    expect(team).toHaveAttribute('href', '/teams/13')
    expect(name.parentElement).toBe(team.parentElement)
    expect(name.querySelector('img')).toHaveAttribute('src', 'https://a.espncdn.com/luka.png')
    expect(within(points).getByText('33.5')).toBeInTheDocument()

    const assists = screen.getByRole('region', {name: 'Assists'})
    expect(within(assists).getByRole('link', {name: 'Trae Young'})).toHaveAttribute('href', '/players/ast-1')
    expect(within(assists).getByRole('link', {name: 'ATL'})).toHaveAttribute('href', '/teams/1')
  })

  it('keeps only the top five players in each category', () => {
    render(
      <LeadersSnapshot
        categories={[
          makeCategory({
            leaders: Array.from({length: 6}, (_, index) => makeLeader(index + 1))
          })
        ]}
      />
    )

    expect(screen.getByRole('link', {name: 'Player 5'})).toBeInTheDocument()
    expect(screen.queryByRole('link', {name: 'Player 6'})).not.toBeInTheDocument()
    expect(screen.getByText('Top 5')).toBeInTheDocument()
  })

  it('explains when a category has no qualifying players', () => {
    render(<LeadersSnapshot categories={[makeCategory({leaders: []})]} />)

    expect(screen.getByRole('heading', {name: 'Points'})).toBeInTheDocument()
    expect(screen.getByText('No qualifying players yet for this season and season type.')).toBeInTheDocument()
  })

  it('explains when leaders are unavailable', () => {
    render(<LeadersSnapshot categories={[]} />)

    expect(screen.getByText('League leaders are unavailable right now.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', {level: 3})).not.toBeInTheDocument()
  })
})
