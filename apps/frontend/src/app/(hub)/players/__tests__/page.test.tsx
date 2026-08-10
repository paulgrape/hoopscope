import type {PlayerListItem} from '@/lib/players-api'
import {searchPlayers} from '@/lib/players-api'
import {getTeams} from '@/lib/teams-api'
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import PlayersPage from '../page'

vi.mock('@/lib/players-api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/players-api')>()
  return {
    ...actual,
    searchPlayers: vi.fn()
  }
})

vi.mock('@/lib/teams-api', () => ({
  getTeams: vi.fn()
}))

vi.mock('@/components/players/player-search-controls', () => ({
  PlayerSearchControls: () => null
}))

vi.mock('@/components/seo/json-ld', () => ({
  JsonLd: () => null
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

function makePlayer(overrides: Partial<PlayerListItem> = {}): PlayerListItem {
  return {
    id: '3112335',
    fullName: 'Nikola Jokić',
    jersey: '15',
    position: 'C',
    headshot: 'https://headshot/3112335.png',
    team: {id: '9', abbreviation: 'DEN', displayName: 'Denver Nuggets'},
    ...overrides
  }
}

describe('PlayersPage', () => {
  beforeEach(() => {
    vi.mocked(searchPlayers).mockReset()
    vi.mocked(getTeams).mockReset()
    vi.mocked(getTeams).mockResolvedValue([])
  })

  it('renders matching players and keeps the team in the profile link', async () => {
    vi.mocked(searchPlayers).mockResolvedValue({total: 1, players: [makePlayer()]})

    render(await PlayersPage({searchParams: Promise.resolve({q: ' jokic ', teamId: '9'})}))

    expect(searchPlayers).toHaveBeenCalledWith({q: 'jokic', teamId: '9', limit: 60})
    expect(screen.getByRole('link', {name: /Nikola Jokić/})).toHaveAttribute('href', '/players/3112335?teamId=9')
    expect(screen.getByText('DEN · C · #15')).toBeInTheDocument()
    expect(screen.getByText('1 player')).toBeInTheDocument()
  })

  it('tells visitors to refine the search when results are capped', async () => {
    vi.mocked(searchPlayers).mockResolvedValue({total: 180, players: [makePlayer()]})

    render(await PlayersPage({searchParams: Promise.resolve({})}))

    expect(searchPlayers).toHaveBeenCalledWith({q: undefined, teamId: undefined, limit: 60})
    expect(screen.getByText(/Showing 1 of 180 players/)).toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    vi.mocked(searchPlayers).mockResolvedValue({total: 0, players: []})

    render(await PlayersPage({searchParams: Promise.resolve({q: 'zzz'})}))

    expect(screen.getByText('Nobody found')).toBeInTheDocument()
    expect(screen.getByText('No players match these filters.')).toBeInTheDocument()
  })
})
