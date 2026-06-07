'use client'

import Image from 'next/image'
import {useEffect, useMemo, useRef, useState} from 'react'
import {io, type Socket} from 'socket.io-client'

import type {LiveGameState} from '@/lib/games-api'

type HistoricGameSimulatorProps = {
  initialGame: LiveGameState
  socketBaseUrl: string
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'
type PlaybackPace = 1 | 1.5 | 2 | 3

const PLAYBACK_PACES: PlaybackPace[] = [1, 1.5, 2, 3]

export function HistoricGameSimulator({initialGame, socketBaseUrl}: HistoricGameSimulatorProps) {
  const [game, setGame] = useState(initialGame)
  const [pace, setPace] = useState<PlaybackPace>(1)
  const [displayClock, setDisplayClock] = useState(initialGame.clock)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const socketRef = useRef<Socket | null>(null)
  const paceRef = useRef<PlaybackPace>(1)
  const displayClockSecondsRef = useRef(clockToSeconds(initialGame.clock))

  useEffect(() => {
    const socket = io(`${socketBaseUrl}/live`)
    socketRef.current = socket

    socket.on('connect', () => {
      setConnectionStatus('connected')
      socket.emit('game:subscribe', {gameId: initialGame.id, pace: paceRef.current})
    })

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected')
    })

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected')
    })

    socket.on('game:update', (nextGame: LiveGameState) => {
      if (nextGame.id === initialGame.id) {
        const clockSeconds = clockToSeconds(nextGame.clock)

        displayClockSecondsRef.current = clockSeconds
        setDisplayClock(clockSeconds === null ? nextGame.clock : formatGameClock(clockSeconds))
        setGame(nextGame)
      }
    })

    return () => {
      socket.emit('game:unsubscribe', {gameId: initialGame.id})
      socket.disconnect()
      socketRef.current = null
    }
  }, [initialGame.id, socketBaseUrl])

  useEffect(() => {
    if (game.status === 'final') return

    let lastTickAt = Date.now()
    const interval = window.setInterval(() => {
      const currentClockSeconds = displayClockSecondsRef.current
      const now = Date.now()
      const elapsedGameSeconds = ((now - lastTickAt) / 1000) * paceRef.current

      lastTickAt = now
      if (currentClockSeconds === null) return

      const nextClockSeconds = Math.max(0, currentClockSeconds - elapsedGameSeconds)
      displayClockSecondsRef.current = nextClockSeconds
      setDisplayClock(formatGameClock(nextClockSeconds))
    }, 250)

    return () => window.clearInterval(interval)
  }, [game.status])

  const handlePaceChange = (nextPace: PlaybackPace) => {
    paceRef.current = nextPace
    setPace(nextPace)
    socketRef.current?.emit('game:setPace', {gameId: initialGame.id, pace: nextPace})
  }

  const progress = useMemo(() => {
    if (game.totalPlays === 0) return 0
    return Math.min(100, Math.round((game.playIndex / game.totalPlays) * 100))
  }, [game.playIndex, game.totalPlays])

  const plays = useMemo(() => [...game.plays].reverse(), [game.plays])

  return (
    <section className='grid gap-6 lg:grid-cols-[1fr_24rem]'>
      <div className='bg-card border-border rounded-xl border p-6'>
        <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm'>
          <span>{new Date(game.date).toLocaleString()}</span>
          <span className='rounded-full border px-2 py-0.5 capitalize'>{connectionStatus}</span>
        </div>

        <div className='mt-5 flex flex-wrap items-center gap-2'>
          <span className='text-muted-foreground text-sm'>Replay pace</span>
          {PLAYBACK_PACES.map(playbackPace => (
            <button
              key={playbackPace}
              type='button'
              disabled={game.status === 'final'}
              onClick={() => handlePaceChange(playbackPace)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                pace === playbackPace
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
              }`}
            >
              x{playbackPace}
            </button>
          ))}
        </div>

        <div className='mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4'>
          <TeamScore
            name={game.awayTeam.name}
            abbreviation={game.awayTeam.abbreviation}
            logo={game.awayTeam.logo}
            score={game.awayScore}
          />
          <div className='text-center'>
            <p className='text-muted-foreground text-xs uppercase tracking-wider'>Quarter {game.quarter}</p>
            <p className='mt-1 text-4xl font-semibold'>{displayClock}</p>
            <p className='text-muted-foreground mt-2 text-sm capitalize'>{game.status}</p>
          </div>
          <TeamScore
            name={game.homeTeam.name}
            abbreviation={game.homeTeam.abbreviation}
            logo={game.homeTeam.logo}
            score={game.homeScore}
            align='right'
          />
        </div>

        <div className='mt-8'>
          <div className='bg-muted h-3 overflow-hidden rounded-full'>
            <div
              className='bg-primary h-full rounded-full transition-all'
              style={{width: `${progress}%`}}
            />
          </div>
          <div className='text-muted-foreground mt-2 flex justify-between text-sm'>
            <span>
              Play {game.playIndex.toLocaleString()} of {game.totalPlays.toLocaleString()}
            </span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      <aside className='bg-card border-border rounded-xl border p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-muted-foreground text-sm uppercase tracking-wider'>Play-by-play</p>
            <p className='text-muted-foreground mt-1 text-sm'>Newest plays appear first.</p>
          </div>
          <span className='text-muted-foreground rounded-full border px-2 py-0.5 text-xs'>
            {game.plays.length.toLocaleString()}
          </span>
        </div>

        <ol className='mt-5 flex max-h-136 flex-col gap-3 overflow-y-auto pr-2'>
          {plays.map(play => (
            <li
              key={play.id}
              className='border-border bg-background/60 rounded-lg border p-3'
            >
              <div className='text-muted-foreground flex items-center justify-between gap-3 text-xs'>
                <span>
                  Q{play.period} {play.clock}
                </span>
                <span>
                  {game.awayTeam.abbreviation} {play.awayScore} - {game.homeTeam.abbreviation}{' '}
                  {play.homeScore}
                </span>
              </div>
              <p className='text-card-foreground mt-2 text-sm leading-relaxed'>{play.text}</p>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  )
}

function clockToSeconds(clock: string) {
  if (clock.includes(':')) {
    const [minutes, seconds] = clock.split(':').map(Number)
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null
    return minutes * 60 + seconds
  }

  const seconds = Number(clock)
  return Number.isFinite(seconds) ? seconds : null
}

function formatGameClock(totalSeconds: number) {
  const roundedSeconds = Math.ceil(totalSeconds)
  const minutes = Math.floor(roundedSeconds / 60)
  const seconds = roundedSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function TeamScore({
  name,
  abbreviation,
  logo,
  score,
  align = 'left',
}: {
  name: string
  abbreviation: string
  logo: string
  score: number
  align?: 'left' | 'right'
}) {
  return (
    <div className={`flex items-center gap-4 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {logo ? (
        <Image
          src={logo}
          alt={`${name} logo`}
          className='h-16 w-16 object-contain'
          width={64}
          height={64}
        />
      ) : (
        <div className='bg-muted h-16 w-16 rounded-full' />
      )}
      <div>
        <p className='text-muted-foreground text-sm'>{abbreviation}</p>
        <h2 className='text-card-foreground text-lg font-semibold'>{name}</h2>
        <p className='mt-2 text-5xl font-semibold'>{score}</p>
      </div>
    </div>
  )
}
