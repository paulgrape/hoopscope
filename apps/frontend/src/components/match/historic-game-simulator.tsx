'use client'

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import type {LiveGameState, LivePlayEvent} from '@/lib/games-api'
import {useCallback, useEffect, useRef, useState} from 'react'
import {type Socket, io} from 'socket.io-client'

import {ReplayBoxScore} from './replay/replay-box-score'
import {ReplayFeed} from './replay/replay-feed'
import {ReplayInsightsPanel} from './replay/replay-insights'
import {ReplayLineScore} from './replay/replay-line-score'
import {type ConnectionStatus, ReplayScoreboard} from './replay/replay-scoreboard'
import {ReplayTimeline} from './replay/replay-timeline'
import {type PlaybackPace, ReplayTransport} from './replay/replay-transport'
import {clockToSeconds, findScoringPlayIndex, formatGameClock, periodLabel} from './replay/replay-utils'

const CLOCK_TICK_MS = 250

type HistoricGameSimulatorProps = {
  initialGame: LiveGameState
  socketBaseUrl: string
}

export function HistoricGameSimulator({initialGame, socketBaseUrl}: HistoricGameSimulatorProps) {
  const [game, setGame] = useState(initialGame)
  const [pace, setPace] = useState<PlaybackPace>(1)
  const [displayClock, setDisplayClock] = useState(initialGame.clock)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [seenPlays, setSeenPlays] = useState<(LivePlayEvent | undefined)[]>(() =>
    mergeSeenPlays([], initialGame.plays, initialGame.totalPlays)
  )
  const [maxSeenIndex, setMaxSeenIndex] = useState(initialGame.playIndex - 1)
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
      if (nextGame.id !== initialGame.id) return

      const clockSeconds = clockToSeconds(nextGame.clock)

      displayClockSecondsRef.current = clockSeconds
      setDisplayClock(clockSeconds === null ? nextGame.clock : formatGameClock(clockSeconds))
      setGame(nextGame)
      setSeenPlays(previous => mergeSeenPlays(previous, nextGame.plays, nextGame.totalPlays))
      setMaxSeenIndex(previous => Math.max(previous, nextGame.playIndex - 1))
    })

    return () => {
      socket.emit('game:unsubscribe', {gameId: initialGame.id})
      socket.disconnect()
      socketRef.current = null
    }
  }, [initialGame.id, socketBaseUrl])

  useEffect(() => {
    if (game.status === 'final' || game.paused) return

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
    }, CLOCK_TICK_MS)

    return () => window.clearInterval(interval)
  }, [game.status, game.paused])

  const emitReplayCommand = useCallback(
    (event: string, payload: Record<string, number> = {}) => {
      socketRef.current?.emit(event, {gameId: initialGame.id, ...payload})
    },
    [initialGame.id]
  )

  const currentIndex = game.playIndex - 1

  const handleSeek = useCallback(
    (playIndex: number) => {
      const target = Math.min(Math.max(0, playIndex), game.totalPlays - 1)
      emitReplayCommand('game:seek', {playIndex: target})
    },
    [emitReplayCommand, game.totalPlays]
  )

  const handleTogglePlay = useCallback(() => {
    const nextPaused = !game.paused

    setGame(current => ({...current, paused: nextPaused}))
    emitReplayCommand(nextPaused ? 'game:pause' : 'game:resume')
  }, [emitReplayCommand, game.paused])

  const handlePaceChange = useCallback(
    (nextPace: PlaybackPace) => {
      paceRef.current = nextPace
      setPace(nextPace)
      emitReplayCommand('game:setPace', {pace: nextPace})
    },
    [emitReplayCommand]
  )

  return (
    <div className='flex min-w-0 flex-col gap-4 sm:gap-5'>
      <p
        className='sr-only'
        aria-live='polite'
      >
        {`${game.awayTeam.name} ${game.awayScore}, ${game.homeTeam.name} ${game.homeScore}. ${periodLabel(game.quarter)}. ${game.status}.`}
      </p>

      <section className='grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]'>
        <div className='flex min-w-0 flex-col gap-4'>
          <div className='bg-background sticky top-14 z-10 -mt-3 py-3'>
            <ReplayScoreboard
              game={game}
              displayClock={displayClock}
              connectionStatus={connectionStatus}
            />
          </div>

          <ReplayTransport
            paused={game.paused}
            isFinal={game.status === 'final'}
            pace={pace}
            canStepBack={currentIndex > 0}
            canStepForward={currentIndex < game.totalPlays - 1}
            previousScoringIndex={findScoringPlayIndex(seenPlays, currentIndex, 'previous')}
            nextScoringIndex={findScoringPlayIndex(seenPlays, currentIndex, 'next')}
            onTogglePlay={handleTogglePlay}
            onRestart={() => handleSeek(0)}
            onStep={offset => handleSeek(currentIndex + offset)}
            onSeek={handleSeek}
            onPaceChange={handlePaceChange}
          />

          <ReplayTimeline
            timeline={game.timeline}
            playIndex={game.playIndex}
            seenPlays={seenPlays}
            maxSeenIndex={maxSeenIndex}
            homeTeamId={game.homeTeam.id}
            awayTeamId={game.awayTeam.id}
            homeColor={game.homeTeam.color}
            awayColor={game.awayTeam.color}
            onSeek={handleSeek}
          />

          <Tabs
            defaultValue='line-score'
            className='min-w-0 gap-3'
          >
            <TabsList className='w-full sm:w-fit'>
              <TabsTrigger
                value='line-score'
                className='flex-1 sm:flex-none'
              >
                Line score
              </TabsTrigger>
              <TabsTrigger
                value='insights'
                className='flex-1 sm:flex-none'
              >
                Insights
              </TabsTrigger>
              <TabsTrigger
                value='box-score'
                className='flex-1 sm:flex-none'
              >
                Box score
              </TabsTrigger>
            </TabsList>
            <TabsContent value='line-score'>
              <ReplayLineScore game={game} />
            </TabsContent>
            <TabsContent value='insights'>
              <ReplayInsightsPanel game={game} />
            </TabsContent>
            <TabsContent value='box-score'>
              <ReplayBoxScore game={game} />
            </TabsContent>
          </Tabs>
        </div>

        <div className='flex min-w-0 flex-col lg:sticky lg:top-[4.25rem]'>
          <ReplayFeed
            plays={game.plays}
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            onSelectPlay={handleSeek}
          />
        </div>
      </section>
    </div>
  )
}

function mergeSeenPlays(
  previous: (LivePlayEvent | undefined)[],
  plays: LivePlayEvent[],
  totalPlays: number
): (LivePlayEvent | undefined)[] {
  const next = previous.length === totalPlays ? [...previous] : new Array<LivePlayEvent | undefined>(totalPlays)

  plays.forEach((play, index) => {
    next[index] = play
  })

  return next
}
