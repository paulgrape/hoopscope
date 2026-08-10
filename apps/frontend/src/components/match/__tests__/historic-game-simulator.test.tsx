import {HistoricGameSimulator} from '@/components/match/historic-game-simulator'
import type {LiveGameState, LivePlayEvent} from '@/lib/games-api'
import {act, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

type Handler = (...args: unknown[]) => void

const handlers = new Map<string, Handler>()
const socket = {
  connected: false,
  on: vi.fn((event: string, handler: Handler) => {
    handlers.set(event, handler)
    return socket
  }),
  emit: vi.fn(),
  disconnect: vi.fn()
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => socket)
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

import {io} from 'socket.io-client'

function makePlay(index: number, text: string): LivePlayEvent {
  return {
    id: `play-${index}`,
    sequenceNumber: index + 1,
    period: 1,
    clock: '11:00',
    elapsedSeconds: index,
    text,
    scoringPlay: false,
    scoreValue: 0,
    homeScore: 0,
    awayScore: 0
  }
}

function makeGame(overrides: Partial<LiveGameState> = {}): LiveGameState {
  const plays = [makePlay(0, 'Jump ball'), makePlay(1, 'Missed jumper')]

  return {
    id: 'historic-1',
    name: 'Lakers at Celtics',
    date: '2010-06-17T00:00:00.000Z',
    venue: 'TD Garden',
    homeTeam: {
      id: '2',
      name: 'Boston Celtics',
      abbreviation: 'BOS',
      logo: '',
      color: '#007A33'
    },
    awayTeam: {
      id: '13',
      name: 'Los Angeles Lakers',
      abbreviation: 'LAL',
      logo: '',
      color: '#552583'
    },
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    clock: '12:00',
    lastPlay: 'Tip-off',
    status: 'live',
    paused: false,
    playIndex: 1,
    totalPlays: plays.length,
    plays: [plays[0]],
    timeline: plays.map((play, index) => ({
      index,
      period: play.period,
      elapsedSeconds: play.elapsedSeconds
    })),
    ...overrides
  }
}

function connectSocket() {
  socket.connected = true
  act(() => {
    handlers.get('connect')?.()
  })
}

describe('HistoricGameSimulator', () => {
  beforeEach(() => {
    handlers.clear()
    socket.connected = false
    socket.on.mockClear()
    socket.emit.mockClear()
    socket.disconnect.mockClear()
    vi.mocked(io).mockClear()
  })

  it('connects to the live namespace and subscribes on connect', async () => {
    render(
      <HistoricGameSimulator
        initialGame={makeGame()}
        socketBaseUrl='http://backend.test'
      />
    )

    expect(io).toHaveBeenCalledWith('http://backend.test/live')
    expect(screen.getByText('connecting')).toBeInTheDocument()

    connectSocket()

    await waitFor(() => {
      expect(screen.getByText('connected')).toBeInTheDocument()
    })
    expect(socket.emit).toHaveBeenCalledWith('game:subscribe', {gameId: 'historic-1', pace: 1})
  })

  it('emits pause when the transport pauses a connected replay', async () => {
    render(
      <HistoricGameSimulator
        initialGame={makeGame()}
        socketBaseUrl='http://backend.test'
      />
    )

    connectSocket()
    await screen.findByText('connected')

    await userEvent.click(screen.getByRole('button', {name: 'Pause replay'}))

    expect(socket.emit).toHaveBeenCalledWith('game:pause', {gameId: 'historic-1'})
    expect(screen.getByText('Paused')).toBeInTheDocument()
  })

  it('applies game updates from the socket', async () => {
    render(
      <HistoricGameSimulator
        initialGame={makeGame()}
        socketBaseUrl='http://backend.test'
      />
    )

    connectSocket()
    await screen.findByText('connected')

    act(() => {
      handlers.get('game:update')?.(
        makeGame({
          homeScore: 2,
          awayScore: 0,
          playIndex: 2,
          lastPlay: 'Layup good',
          plays: [makePlay(0, 'Jump ball'), makePlay(1, 'Layup good')]
        })
      )
    })

    expect(screen.getAllByText('Layup good').length).toBeGreaterThan(0)
    expect(screen.getByText(/Boston Celtics 2/)).toBeInTheDocument()
  })

  it('unsubscribes and disconnects on unmount', () => {
    const {unmount} = render(
      <HistoricGameSimulator
        initialGame={makeGame()}
        socketBaseUrl='http://backend.test'
      />
    )

    unmount()

    expect(socket.emit).toHaveBeenCalledWith('game:unsubscribe', {gameId: 'historic-1'})
    expect(socket.disconnect).toHaveBeenCalledTimes(1)
  })
})
