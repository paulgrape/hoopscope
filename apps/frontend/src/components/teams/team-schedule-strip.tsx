'use client'

import {LiveBadge, formatLiveClock} from '@/components/match/live-status'
import {
  deriveTeamForm,
  findScheduleAnchorIndex,
  selectVisibleScheduleGames
} from '@/components/teams/team-schedule-utils'
import {TeamSeasonSelect} from '@/components/teams/team-season-select'
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

type SchedulePage = {
  index: number
  pageSize: number
}

function listGap(scroller: HTMLElement): number {
  const styles = getComputedStyle(scroller)
  const parsed = Number.parseFloat(styles.columnGap || styles.gap)
  return Number.isFinite(parsed) ? parsed : 0
}

/** How many whole cards fit in the strip. Null when layout has not been measured. */
function cardsPerView(scroller: HTMLElement, card: HTMLElement): number | null {
  if (scroller.clientWidth <= 0 || card.offsetWidth <= 0) return null
  const gap = listGap(scroller)
  const stride = card.offsetWidth + gap
  if (stride <= 0) return null
  return Math.max(1, Math.floor((scroller.clientWidth + gap) / stride))
}

/** First card whose left edge is at or just after the current scroll position. */
function alignedCardIndex(scroller: HTMLElement, cards: HTMLElement[]): number {
  const origin = scroller.scrollLeft - SCROLL_EDGE_TOLERANCE_PX
  const index = cards.findIndex(card => card.offsetLeft >= origin)
  return index === -1 ? cards.length - 1 : index
}

function clampIndex(index: number, length: number): number {
  return Math.min(length - 1, Math.max(0, index))
}

type TeamScheduleStripProps = {
  schedule: TeamScheduleResponse | null
  season?: number
  currentSeason?: number
}

export function TeamScheduleStrip({schedule, season, currentSeason}: TeamScheduleStripProps) {
  const visibleGames = useMemo(() => (schedule ? selectVisibleScheduleGames(schedule.games) : []), [schedule])
  const anchorIndex = useMemo(() => findScheduleAnchorIndex(visibleGames), [visibleGames])
  const formGames = useMemo(() => deriveTeamForm(visibleGames, anchorIndex), [visibleGames, anchorIndex])
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

  const [paging, setPaging] = useState<SchedulePage | null>(null)
  if (fallback.key !== anchorKey && paging !== null) {
    setPaging(null)
  }
  const scrollerRef = useRef<HTMLUListElement | null>(null)
  const cardRefs = useRef<Array<HTMLLIElement | null>>([])

  const syncPaging = useCallback(() => {
    const scroller = scrollerRef.current
    const cards = cardRefs.current.filter((card): card is HTMLLIElement => card != null)
    if (!scroller || cards.length === 0) return

    const pageSize = cardsPerView(scroller, cards[0])
    if (pageSize == null) {
      setPaging(null)
      return
    }

    setPaging({index: alignedCardIndex(scroller, cards), pageSize})
  }, [])

  useEffect(() => {
    if (anchorIndex < 0) return
    const scroller = scrollerRef.current
    const anchorCard = cardRefs.current[anchorIndex]
    if (scroller && anchorCard && typeof scroller.scrollTo === 'function') {
      scroller.scrollTo({left: anchorCard.offsetLeft})
    }
    queueMicrotask(syncPaging)
  }, [anchorIndex, schedule?.season, syncPaging])

  useEffect(() => {
    window.addEventListener('resize', syncPaging)
    return () => window.removeEventListener('resize', syncPaging)
  }, [syncPaging])

  function scrollPage(delta: -1 | 1) {
    const scroller = scrollerRef.current
    const cards = cardRefs.current.filter((card): card is HTMLLIElement => card != null)
    if (!scroller || cards.length === 0) return

    const pageSize = cardsPerView(scroller, cards[0])
    if (pageSize == null) {
      const nextIndex = clampIndex(fallbackIndex + delta * FALLBACK_PAGE_CARDS, cards.length)
      setFallback({key: anchorKey, index: nextIndex})
      if (typeof scroller.scrollBy === 'function') {
        scroller.scrollBy({left: delta * FALLBACK_PAGE_SCROLL_PX, behavior: 'smooth'})
      }
      return
    }

    const start = alignedCardIndex(scroller, cards)
    const nextIndex = clampIndex(start + delta * pageSize, cards.length)
    if (nextIndex === start) return

    const target = cards[nextIndex]
    scroller.scrollTo({left: target.offsetLeft, behavior: 'smooth'})
    setPaging({index: nextIndex, pageSize})
  }

  const page = paging ?? {index: fallbackIndex, pageSize: FALLBACK_PAGE_CARDS}
  const canScrollPrev = clampIndex(page.index - page.pageSize, visibleGames.length) !== page.index
  const canScrollNext = clampIndex(page.index + page.pageSize, visibleGames.length) !== page.index

  return (
    <section
      aria-label='Team schedule'
      className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'
    >
      <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Schedule</h2>
          {season != null && currentSeason != null ? (
            <div className='mt-2'>
              <TeamSeasonSelect
                season={season}
                currentSeason={currentSeason}
              />
            </div>
          ) : null}
        </div>

        {formGames.length > 0 || visibleGames.length > 0 ? (
          <div className='flex items-center justify-between gap-2 sm:justify-end sm:gap-3'>
            {formGames.length > 0 ? (
              <div
                aria-label='Recent form'
                className='border-border bg-background/50 flex items-center gap-2 rounded-lg border px-2.5 py-1.5'
              >
                <span className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>Form</span>
                <ol className='m-0 flex list-none items-center gap-1 p-0'>
                  {formGames.map(game => (
                    <li
                      key={game.id}
                      className='flex items-center'
                    >
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
          onScroll={syncPaging}
          className='relative mt-4 flex snap-x snap-mandatory scrollbar-thin gap-3 overflow-x-auto scroll-smooth pb-2'
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
                className='w-64 shrink-0 snap-start sm:w-72'
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
          <span className='text-muted-foreground/70 ml-1.5 uppercase'>{game.isHome ? 'vs' : '@'}</span>
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
            game.status === 'live' ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted-foreground'
          )}
        >
          {cardStatusText(game)}
        </span>
      </div>
    </Link>
  )
}

function CardTeamRow({team, score, leading}: {team: ScoreboardTeam | null; score: number | null; leading: boolean}) {
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
        <span className='text-muted-foreground truncate text-xs'>{team?.name ?? team?.displayName ?? 'TBD'}</span>
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

function ResultPill({result, label, compact = false}: {result: TeamGameResult; label?: string; compact?: boolean}) {
  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        'flex items-center justify-center rounded leading-none font-semibold tabular-nums',
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
