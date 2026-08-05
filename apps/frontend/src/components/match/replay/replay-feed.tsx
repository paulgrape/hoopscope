'use client'

import type {GameTeam, LivePlayEvent} from '@/lib/games-api'
import {cn} from '@/lib/utils'
import {ArrowUp} from 'lucide-react'
import Image from 'next/image'
import {memo, useMemo, useRef, useState} from 'react'

import {periodLabel, teamAccent} from './replay-utils'

const SCROLL_HINT_OFFSET = 160

type FeedFilter = 'all' | 'scoring' | 'away' | 'home'

type ReplayFeedProps = {
  plays: LivePlayEvent[]
  homeTeam: GameTeam
  awayTeam: GameTeam
  onSelectPlay: (playIndex: number) => void
}

export function ReplayFeed({plays, homeTeam, awayTeam, onSelectPlay}: ReplayFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const listRef = useRef<HTMLOListElement | null>(null)

  const filters: {value: FeedFilter; label: string}[] = [
    {value: 'all', label: 'All'},
    {value: 'scoring', label: 'Scoring'},
    {value: 'away', label: awayTeam.abbreviation},
    {value: 'home', label: homeTeam.abbreviation}
  ]

  const visiblePlays = useMemo(() => {
    const indexed = plays.map((play, index) => ({play, index}))
    const filtered = indexed.filter(({play}) => {
      if (filter === 'scoring') return play.scoringPlay
      if (filter === 'away') return play.teamId === awayTeam.id
      if (filter === 'home') return play.teamId === homeTeam.id
      return true
    })

    return filtered.reverse()
  }, [plays, filter, awayTeam.id, homeTeam.id])

  const latestPlay = plays[plays.length - 1]

  return (
    <div className='bg-card border-border flex min-h-0 flex-col rounded-xl border p-3 sm:p-4'>
      <div className='flex items-baseline justify-between gap-3'>
        <h2 className='text-sm font-semibold tracking-wider uppercase'>Play-by-play</h2>
        <span className='text-muted-foreground text-xs tabular-nums'>{visiblePlays.length.toLocaleString()} plays</span>
      </div>

      <div
        className='mt-3 flex flex-wrap gap-1.5'
        role='group'
        aria-label='Filter plays'
      >
        {filters.map(option => (
          <button
            key={option.value}
            type='button'
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'focus-visible:ring-ring/50 rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:ring-3 focus-visible:outline-none',
              filter === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted text-muted-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p
        className='sr-only'
        aria-live='polite'
      >
        {latestPlay?.text ?? ''}
      </p>

      <div className='relative mt-3 min-h-0 flex-1'>
        <ol
          ref={listRef}
          onScroll={event => setShowScrollTop(event.currentTarget.scrollTop > SCROLL_HINT_OFFSET)}
          className='flex max-h-[26rem] min-h-0 flex-col gap-2 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-17rem)]'
        >
          {visiblePlays.length === 0 ? (
            <li className='text-muted-foreground py-6 text-center text-sm'>No plays match this filter yet.</li>
          ) : null}

          {visiblePlays.map(({play, index}, position) => {
            const previous = visiblePlays[position - 1]?.play
            const showPeriodHeader = !previous || previous.period !== play.period
            const team = play.teamId === homeTeam.id ? homeTeam : play.teamId === awayTeam.id ? awayTeam : null

            return (
              <li key={play.id}>
                {showPeriodHeader ? (
                  <p className='text-muted-foreground bg-card sticky top-0 z-10 py-1 text-xs font-medium tracking-wider uppercase'>
                    {periodLabel(play.period)}
                  </p>
                ) : null}
                <FeedRow
                  playIndex={index}
                  period={play.period}
                  clock={play.clock}
                  text={play.text}
                  shortText={play.shortText ?? null}
                  scoringPlay={play.scoringPlay}
                  homeScore={play.homeScore}
                  awayScore={play.awayScore}
                  homeAbbreviation={homeTeam.abbreviation}
                  awayAbbreviation={awayTeam.abbreviation}
                  teamLogo={team?.logo ?? null}
                  teamColor={team?.color ?? null}
                  isLatest={play.id === latestPlay?.id}
                  onSelect={onSelectPlay}
                />
              </li>
            )
          })}
        </ol>

        {showScrollTop ? (
          <button
            type='button'
            onClick={() => listRef.current?.scrollTo({top: 0})}
            className='bg-primary text-primary-foreground absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg'
          >
            <ArrowUp
              aria-hidden='true'
              className='size-3.5'
            />
            Latest play
          </button>
        ) : null}
      </div>
    </div>
  )
}

type FeedRowProps = {
  playIndex: number
  period: number
  clock: string
  text: string
  shortText: string | null
  scoringPlay: boolean
  homeScore: number
  awayScore: number
  homeAbbreviation: string
  awayAbbreviation: string
  teamLogo: string | null
  teamColor: string | null
  isLatest: boolean
  onSelect: (playIndex: number) => void
}

const FeedRow = memo(function FeedRow({
  playIndex,
  period,
  clock,
  text,
  shortText,
  scoringPlay,
  homeScore,
  awayScore,
  homeAbbreviation,
  awayAbbreviation,
  teamLogo,
  teamColor,
  isLatest,
  onSelect
}: FeedRowProps) {
  const accent = teamAccent(teamColor)

  return (
    <button
      type='button'
      onClick={() => onSelect(playIndex)}
      aria-label={`Jump to ${periodLabel(period)} ${clock}: ${text}`}
      className={cn(
        'border-border bg-background/60 hover:border-ring focus-visible:ring-ring/50 flex w-full gap-2 rounded-lg border p-2.5 text-left transition focus-visible:ring-3 focus-visible:outline-none',
        isLatest && 'border-primary/60'
      )}
    >
      <span
        aria-hidden='true'
        className='w-1 shrink-0 rounded-full'
        style={{backgroundColor: accent ?? 'var(--border)'}}
      />

      <span className='min-w-0 flex-1'>
        <span className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
          <span className='tabular-nums'>{clock}</span>
          {shortText ? (
            <span
              className={cn(
                'border-border rounded-full border px-1.5 py-0.5',
                scoringPlay && 'border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
              )}
            >
              {shortText}
            </span>
          ) : null}
          <span className='w-full tabular-nums sm:ml-auto sm:w-auto'>
            {awayAbbreviation} {awayScore} - {homeScore} {homeAbbreviation}
          </span>
        </span>

        <span className='mt-1.5 flex items-start gap-2'>
          {teamLogo ? (
            <Image
              src={teamLogo}
              alt=''
              width={20}
              height={20}
              className='mt-0.5 size-4 shrink-0 object-contain'
            />
          ) : null}
          <span className={cn('text-card-foreground text-sm leading-relaxed', scoringPlay && 'font-medium')}>
            {text}
          </span>
        </span>
      </span>
    </button>
  )
})
