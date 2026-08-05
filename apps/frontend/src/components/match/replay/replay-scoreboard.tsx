import type {GameTeam, LiveGameState} from '@/lib/games-api'
import {cn} from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

import {ReplayClock} from './replay-clock'
import {teamAccent} from './replay-utils'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

type ReplayScoreboardProps = {
  game: LiveGameState
  pace: number
  connectionStatus: ConnectionStatus
}

export function ReplayScoreboard({game, pace, connectionStatus}: ReplayScoreboardProps) {
  const isFinal = game.status === 'final'
  const clock = (
    <ReplayClock
      clock={game.clock}
      playIndex={game.playIndex}
      quarter={game.quarter}
      paused={game.paused}
      isFinal={isFinal}
      pace={pace}
    />
  )

  return (
    <div className='bg-card border-border rounded-xl border p-3 sm:p-5'>
      <div className='flex items-center justify-between gap-3'>
        <StatePill
          isFinal={isFinal}
          paused={game.paused}
        />
        <ConnectionIndicator status={connectionStatus} />
      </div>

      <div className='mt-4 flex flex-col gap-3 sm:hidden'>
        <TeamRow
          team={game.awayTeam}
          score={game.awayScore}
          truncateName={false}
        />
        <TeamRow
          team={game.homeTeam}
          score={game.homeScore}
          truncateName={false}
        />
        {clock}
      </div>

      <div className='mt-4 hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:grid'>
        <TeamRow
          team={game.awayTeam}
          score={game.awayScore}
        />
        {clock}
        <TeamRow
          team={game.homeTeam}
          score={game.homeScore}
          align='right'
        />
      </div>

      <p className='text-muted-foreground border-border mt-4 truncate border-t pt-3 text-sm'>{game.lastPlay}</p>
    </div>
  )
}

function StatePill({isFinal, paused}: {isFinal: boolean; paused: boolean}) {
  const label = isFinal ? 'Final' : paused ? 'Paused' : 'Live replay'

  return (
    <span
      className={cn(
        'w-fit rounded-full border px-3 py-1 text-xs font-medium tracking-wider uppercase',
        isFinal && 'border-border bg-muted text-muted-foreground',
        !isFinal && paused && 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        !isFinal && !paused && 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
      )}
      aria-live='polite'
    >
      {label}
    </span>
  )
}

function ConnectionIndicator({status}: {status: ConnectionStatus}) {
  return (
    <span
      className='text-muted-foreground flex shrink-0 items-center gap-2 text-xs'
      aria-live='polite'
    >
      <span
        aria-hidden='true'
        className={cn(
          'size-2 rounded-full',
          status === 'connected' && 'bg-emerald-500',
          status === 'connecting' && 'bg-amber-500',
          status === 'disconnected' && 'bg-destructive'
        )}
      />
      <span className='sr-only'>Connection status: </span>
      <span className='capitalize'>{status}</span>
    </span>
  )
}

function TeamRow({
  team,
  score,
  align = 'left',
  truncateName = true
}: {
  team: GameTeam
  score: number
  align?: 'left' | 'right'
  truncateName?: boolean
}) {
  const accent = teamAccent(team.color)

  return (
    <div className={cn('flex min-w-0 items-center gap-3', align === 'right' && 'flex-row-reverse')}>
      {team.logo ? (
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          width={64}
          height={64}
          className='size-10 shrink-0 object-contain sm:size-14'
        />
      ) : (
        <div className='bg-muted size-10 shrink-0 rounded-full sm:size-14' />
      )}

      <div className={cn('min-w-0 flex-1', align === 'right' && 'text-right')}>
        <Link
          href={`/teams/${team.id}`}
          className='inline-block max-w-full border-b-2 text-sm font-semibold hover:underline sm:text-base'
          style={{borderBottomColor: accent ?? 'transparent'}}
        >
          {team.abbreviation}
        </Link>
        <p className={cn('text-muted-foreground text-xs sm:text-sm', truncateName && 'truncate')}>{team.name}</p>
      </div>

      <p className='shrink-0 text-3xl leading-none font-semibold tabular-nums sm:text-5xl'>{score}</p>
    </div>
  )
}
