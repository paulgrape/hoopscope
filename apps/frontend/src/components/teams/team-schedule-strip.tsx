'use client'

import {LiveBadge, formatLiveClock} from '@/components/match/live-status'
import {
  deriveTeamForm,
  findScheduleAnchorIndex,
  selectVisibleScheduleGames
} from '@/components/teams/team-schedule-utils'
import {Button} from '@/components/ui/button'
import type {ScoreboardTeam} from '@/lib/games-api'
import type {TeamGameResult, TeamScheduleGame, TeamScheduleResponse} from '@/lib/teams-api'
import {cn} from '@/lib/utils'
import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

const DISPLAY_LOCALE = 'en-US'
const FALLBACK_PAGE_SCROLL_PX = 864
const FALLBACK_PAGE_CARDS = 3
const SCROLL_EDGE_TOLERANCE_PX = 4

type TeamScheduleStripProps = {
  schedule: TeamScheduleResponse | null
}

export function TeamScheduleStrip({schedule}: TeamScheduleStripProps) {
  const visibleGames = useMemo(
    () => (schedule ? selectVisibleScheduleGames(schedule.games) : []),
    [schedule]
  )
  const anchorIndex = useMemo(() => findScheduleAnchorIndex(visibleGames), [visibleGames])
  const formGames = useMemo(
    () => deriveTeamForm(visibleGames, anchorIndex),
    [visibleGames, anchorIndex]
  )
  const formGameIds = useMemo(() => new Set(formGames.map(game => game.id)), [formGames])

  const anchorKey = `${schedule?.season ?? 'none'}:${anchorIndex}`
  const [fallback, setFallback] = useState(() => ({
    key: anchorKey,
    index: anchorIndex >= 0 ? anchorIndex : 0
  }))
  if (fallback.key !== anchorKey) {
    setFallback({key: anchorKey, index: anchorIndex >= 0 ? anchorIndex : 0})
  }
  const fallbackIndex = fallback.key === anchorKey ? fallback.index : anchorIndex >= 0 ? anchorIndex : 0

  const [scrollBounds, setScrollBounds] = useState<{canPrev: boolean; canNext: boolean} | null>(null)
  const scrollerRef = useRef<HTMLUListElement | null>(null)
  const cardRefs = useRef<Array<HTMLLIElement | null>>([])

  const syncScrollBounds = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    if (maxScrollLeft <= 0) {
      setScrollBounds(null)
      return
    }

    setScrollBounds({
      canPrev: scroller.scrollLeft > SCROLL_EDGE_TOLERANCE_PX,
      canNext: scroller.scrollLeft < maxScrollLeft - SCROLL_EDGE_TOLERANCE_PX
    })
  }, [])

  useEffect(() => {
    if (anchorIndex < 0) return
    const anchorCard = cardRefs.current[anchorIndex]
    if (typeof anchorCard?.scrollIntoView === 'function') {
      anchorCard.scrollIntoView({block: 'nearest', inline: 'center'})
    }
    syncScrollBounds()
  }, [anchorIndex, schedule?.season, syncScrollBounds])

  useEffect(() => {
    window.addEventListener('resize', syncScrollBounds)
    return () => window.removeEventListener('resize', syncScrollBounds)
  }, [syncScrollBounds])

  function scrollPage(delta: -1 | 1) {
    const scroller = scrollerRef.current
    if (!scroller || visibleGames.length === 0) return

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
    if (scroller.clientWidth > 0 && maxScrollLeft > 0) {
      const step = scroller.clientWidth
      const nextScrollLeft = Math.min(
        maxScrollLeft,
        Math.max(0, scroller.scrollLeft + delta * step)
      )
      if (typeof scroller.scrollBy === 'function') {
        scroller.scrollBy({left: delta * step, behavior: 'smooth'})
      } else {
        scroller.scrollLeft = nextScrollLeft
      }
      setScrollBounds({
        canPrev: nextScrollLeft > SCROLL_EDGE_TOLERANCE_PX,
        canNext: nextScrollLeft < maxScrollLeft - SCROLL_EDGE_TOLERANCE_PX
      })
      return
    }

    const nextIndex = Math.min(
      visibleGames.length - 1,
      Math.max(0, fallbackIndex + delta * FALLBACK_PAGE_CARDS)
    )
    setFallback({key: anchorKey, index: nextIndex})
    if (typeof scroller.scrollBy === 'function') {
      scroller.scrollBy({left: delta * FALLBACK_PAGE_SCROLL_PX, behavior: 'smooth'})
    }
  }

  const canScrollPrev = scrollBounds ? scrollBounds.canPrev : fallbackIndex > 0
  const canScrollNext = scrollBounds
    ? scrollBounds.canNext
    : fallbackIndex < visibleGames.length - 1

  return (
    <section
      aria-label='Team schedule'
      className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'
    >
      <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Schedule</h2>
          {schedule?.seasonLabel ? (
            <p className='text-muted-foreground text-xs'>{schedule.seasonLabel} season</p>
          ) : null}
        </div>

        {formGames.length > 0 || visibleGames.length > 0 ? (
          <div className='flex items-center justify-between gap-2 sm:justify-end sm:gap-3'>
            {formGames.length > 0 ? (
              <div
                aria-label='Recent form'
                className='border-border bg-background/50 flex items-center gap-2 rounded-lg border px-2.5 py-1.5'
              >
                <span className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                  Form
                </span>
                <ol className='flex items-center gap-1'>
                  {formGames.map(game => (
                    <li key={game.id}>
                      <ResultPill
                        result={game.result}
                        label={`${game.result} — ${game.shortName ?? game.name}`}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {visibleGames.length > 0 ? (
              <div className='ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0'>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  aria-label='Previous games'
                  disabled={!canScrollPrev}
                  onClick={() => scrollPage(-1)}
                >
                  <ChevronLeftIcon className='size-4' />
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  aria-label='Next games'
                  disabled={!canScrollNext}
                  onClick={() => scrollPage(1)}
                >
                  <ChevronRightIcon className='size-4' />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {schedule === null ? (
        <p
          role='alert'
          className='text-muted-foreground mt-4 text-sm'
        >
          Could not load the team schedule right now.
        </p>
      ) : visibleGames.length === 0 ? (
        <p className='text-muted-foreground mt-4 text-sm'>No games scheduled for this season.</p>
      ) : (
        <ul
          ref={scrollerRef}
          onScroll={syncScrollBounds}
          className='scrollbar-thin relative mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth'
        >
          {visibleGames.map((game, index) => {
            const isAnchor = index === anchorIndex
            const isFormGame = formGameIds.has(game.id)

            return (
              <li
                key={game.id}
                ref={node => {
                  cardRefs.current[index] = node
                }}
                data-anchor={isAnchor ? 'true' : undefined}
                data-form={isFormGame ? 'true' : undefined}
                className='w-64 shrink-0 snap-center sm:w-72'
              >
                <ScheduleGameCard
                  game={game}
                  isAnchor={isAnchor}
                  isFormGame={isFormGame}
                />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function ScheduleGameCard({
  game,
  isAnchor,
  isFormGame
}: {
  game: TeamScheduleGame
  isAnchor: boolean
  isFormGame: boolean
}) {
  const showScore = game.status !== 'scheduled'
  const awayLeads = showScore && (game.awayScore ?? 0) > (game.homeScore ?? 0)
  const homeLeads = showScore && (game.homeScore ?? 0) > (game.awayScore ?? 0)
  const isNextAnchor = isAnchor && game.status === 'scheduled'

  return (
    <Link
      href={`/match-center/${game.id}`}
      aria-label={`View ${game.shortName ?? game.name}`}
      className={cn(
        'bg-background/40 border-border hover:border-foreground/25 flex h-full flex-col justify-between gap-2.5 rounded-xl border p-3 transition',
        isAnchor && 'border-primary/50 bg-primary/5 ring-primary/20 ring-1',
        !isAnchor && isFormGame && 'border-foreground/20 bg-background/70'
      )}
    >
      <div className='flex items-center justify-between gap-2 text-xs'>
        <span className='text-muted-foreground font-medium'>
          {formatCardDate(game.date)}
          <span className='text-muted-foreground/70 ml-1.5 uppercase'>
            {game.isHome ? 'vs' : '@'}
          </span>
        </span>

        <div className='flex items-center gap-1.5'>
          {isNextAnchor ? (
            <span className='bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase'>
              Next
            </span>
          ) : null}
          {game.status === 'live' ? <LiveBadge compact /> : null}
          {game.status === 'final' && game.result ? (
            <ResultPill
              result={game.result}
              compact
            />
          ) : null}
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <CardTeamRow
          team={game.awayTeam}
          score={showScore ? game.awayScore : null}
          leading={awayLeads}
        />
        <CardTeamRow
          team={game.homeTeam}
          score={showScore ? game.homeScore : null}
          leading={homeLeads}
        />
      </div>

      <div className='border-border/60 flex items-center justify-between gap-2 border-t pt-2 text-[11px]'>
        <span
          className={cn(
            'truncate',
            game.status === 'live'
              ? 'font-medium text-red-600 dark:text-red-400'
              : 'text-muted-foreground'
          )}
        >
          {cardStatusText(game)}
        </span>
      </div>
    </Link>
  )
}

function CardTeamRow({
  team,
  score,
  leading
}: {
  team: ScoreboardTeam | null
  score: number | null
  leading: boolean
}) {
  return (
    <div className='flex min-w-0 items-center justify-between gap-2'>
      <div className='flex min-w-0 items-center gap-2'>
        {team?.logo ? (
          <Image
            src={team.logo}
            alt=''
            width={20}
            height={20}
            className='size-5 shrink-0 object-contain'
          />
        ) : (
          <div className='bg-muted size-5 shrink-0 rounded-full' />
        )}
        <span className={cn('shrink-0 text-sm', leading ? 'font-semibold' : 'font-medium')}>
          {team?.abbreviation ?? 'TBD'}
        </span>
        <span className='text-muted-foreground truncate text-xs'>
          {team?.name ?? team?.displayName ?? 'TBD'}
        </span>
      </div>

      {score !== null ? (
        <span
          className={cn(
            'shrink-0 text-sm tabular-nums',
            leading ? 'text-card-foreground font-semibold' : 'text-muted-foreground font-medium'
          )}
        >
          {score}
        </span>
      ) : null}
    </div>
  )
}

function ResultPill({
  result,
  label,
  compact = false
}: {
  result: TeamGameResult
  label?: string
  compact?: boolean
}) {
  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded font-semibold tabular-nums',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'size-5 text-[11px]',
        result === 'W'
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
      )}
    >
      {result}
    </span>
  )
}

function formatCardDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function cardStatusText(game: TeamScheduleGame): string {
  if (game.status === 'live') {
    return formatLiveClock(game)
  }

  if (game.status === 'scheduled') {
    const date = new Date(game.date)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
        hour: 'numeric',
        minute: '2-digit'
      }).format(date)
    }
  }

  return game.statusDetail
}
