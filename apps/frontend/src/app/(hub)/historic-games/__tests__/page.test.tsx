import type {LiveGameState} from '@/lib/games-api'
import {getHistoricGames} from '@/lib/games-api'
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import HistoricGamesPage from '../page'

vi.mock('next/server', () => ({
  connection: vi.fn()
}))

vi.mock('@/lib/games-api', () => ({
  getHistoricGames: vi.fn()
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

function makeTeam(overrides: Partial<LiveGameState['homeTeam']> = {}): LiveGameState['homeTeam'] {
  return {
    id: '2',
    name: 'Celtics',
    abbreviation: 'BOS',
    logo: 'https://logo/bos.png',
    color: '007A33',
    ...overrides
  }
}

function makeGame(overrides: Partial<LiveGameState> = {}): LiveGameState {
  return {
    id: 'game-1',
    name: 'Lakers at Celtics',
    date: '2024-06-06T00:00:00Z',
    homeTeam: makeTeam(),
    awayTeam: makeTeam({id: '13', name: 'Lakers', abbreviation: 'LAL', logo: 'https://logo/lal.png', color: '552583'}),
    homeScore: 106,
    awayScore: 99,
    quarter: 4,
    clock: '0:00',
    lastPlay: 'Final',
    status: 'final',
    paused: false,
    playIndex: 400,
    totalPlays: 400,
    plays: [],
    timeline: [],
    ...overrides
  }
}

describe('HistoricGamesPage', () => {
  beforeEach(() => {
    vi.mocked(getHistoricGames).mockReset()
  })

  it('shows an empty state when the archive has no games', async () => {
    vi.mocked(getHistoricGames).mockResolvedValue([])

    render(await HistoricGamesPage())

    expect(screen.getByRole('heading', {level: 1, name: 'Historic NBA Games'})).toBeInTheDocument()
    expect(screen.getByText('No archived games')).toBeInTheDocument()
    expect(screen.getByText('Saved play-by-play replays will show up here.')).toBeInTheDocument()
    expect(screen.queryByRole('link', {name: /Lakers at Celtics/})).not.toBeInTheDocument()
  })

  it('renders a game card when the archive has games', async () => {
    vi.mocked(getHistoricGames).mockResolvedValue([makeGame()])

    render(await HistoricGamesPage())

    expect(screen.queryByText('No archived games')).not.toBeInTheDocument()
    expect(screen.getByRole('link', {name: /Lakers at Celtics/})).toHaveAttribute('href', '/historic-games/game-1')
  })
})
