'use client'

import {Button} from '@/components/ui/button'
import {Calendar} from '@/components/ui/calendar'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Skeleton} from '@/components/ui/skeleton'
import {
  type ScoreboardGame,
  type ScoreboardTeam,
  addDaysToDateKey,
  formatCompactDateLabel,
  formatDateKey,
  getNearestScheduleDate,
  getOffsetMinutesForDate,
  getSchedule,
  getTodayDateKey,
  isValidDateKey,
  parseLocalDateKey
} from '@/lib/games-api'
import {ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useEffect, useRef, useState, useTransition} from 'react'

const REFRESH_INTERVAL_MS = 60_000
const DISPLAY_LOCALE = 'en-US'

type MatchCenterTimelineProps = {
  initialDate?: string
  initialGames?: ScoreboardGame[]
}

export function MatchCenterTimeline({initialDate, initialGames = []}: MatchCenterTimelineProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const today = getTodayDateKey()
  const urlDate = searchParams.get('date')
  const startingDate = (isValidDateKey(urlDate) && urlDate) || (isValidDateKey(initialDate) && initialDate) || today
  const hasInitialGames = initialGames.length > 0 && startingDate === (initialDate ?? today)

  const [selectedDate, setSelectedDateState] = useState(startingDate)
  const [games, setGames] = useState<ScoreboardGame[]>(hasInitialGames ? initialGames : [])
  const [isLoading, setIsLoading] = useState(!hasInitialGames)
  const [error, setError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isFindingLastGame, setIsFindingLastGame] = useState(false)
  const skipInitialFetchRef = useRef(hasInitialGames)

  // Follow back/forward navigation: sync the selected date from the URL
  // during render instead of a cascading effect.
  const [prevUrlDate, setPrevUrlDate] = useState(urlDate)
  if (urlDate !== prevUrlDate) {
    setPrevUrlDate(urlDate)
    if (isValidDateKey(urlDate) && urlDate !== selectedDate) {
      setSelectedDateState(urlDate)
    }
  }

  function setSelectedDate(nextDate: string) {
    setSelectedDateState(nextDate)
    const params = new URLSearchParams(searchParams.toString())
    if (nextDate === today) {
      params.delete('date')
    } else {
      params.set('date', nextDate)
    }
    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {scroll: false})
    })
  }

  useEffect(() => {
    let isActive = true

    async function loadGames(showLoading: boolean) {
      if (skipInitialFetchRef.current) {
        skipInitialFetchRef.current = false
        return
      }

      if (showLoading) setIsLoading(true)
      setError(null)

      try {
        const nextGames = await getSchedule(selectedDate, getOffsetMinutesForDate(selectedDate))
        if (isActive) setGames(nextGames)
      } catch (caughtError) {
        if (isActive) {
          setError(caughtError instanceof Error ? caughtError.message : 'Failed to load games')
          setGames([])
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadGames(true)
    const refresh = window.setInterval(() => void loadGames(false), REFRESH_INTERVAL_MS)

    return () => {
      isActive = false
      window.clearInterval(refresh)
    }
  }, [selectedDate])

  async function jumpToLastGameDay() {
    setIsFindingLastGame(true)
    setError(null)
    try {
      const nearest = await getNearestScheduleDate(selectedDate, getOffsetMinutesForDate(selectedDate), 'before')
      if (nearest) {
        setSelectedDate(nearest)
      } else {
        setError('Could not find a previous game day.')
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not find a previous game day.')
    } finally {
      setIsFindingLastGame(false)
    }
  }

  const selectedDateLabel = formatCompactDateLabel(selectedDate, DISPLAY_LOCALE)
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const selectedCalendarDate = parseLocalDateKey(selectedDate)

  return (
    <section className='flex min-w-0 flex-col gap-5 sm:gap-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='icon'
            aria-label='Previous day'
            onClick={() => setSelectedDate(addDaysToDateKey(selectedDate, -1))}
          >
            <ChevronLeftIcon />
          </Button>

          <Popover
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
          >
            <PopoverTrigger className='border-border bg-background hover:bg-muted inline-flex h-8 min-w-44 items-center justify-between gap-2 rounded-lg border px-2.5 text-sm font-medium'>
              <span>{selectedDateLabel}</span>
              <ChevronDownIcon className='size-4 opacity-70' />
            </PopoverTrigger>
            <PopoverContent
              align='start'
              className='w-auto p-0'
            >
              <Calendar
                mode='single'
                selected={selectedCalendarDate}
                defaultMonth={selectedCalendarDate}
                onSelect={date => {
                  if (!date) return
                  setSelectedDate(formatDateKey(date))
                  setCalendarOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>

          <Button
            type='button'
            variant='outline'
            size='icon'
            aria-label='Next day'
            onClick={() => setSelectedDate(addDaysToDateKey(selectedDate, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            disabled={selectedDate === today}
            onClick={() => setSelectedDate(today)}
          >
            Today
          </Button>
          <Button
            type='button'
            variant='outline'
            disabled={isFindingLastGame}
            onClick={() => void jumpToLastGameDay()}
          >
            {isFindingLastGame ? 'Finding…' : 'Last game day'}
          </Button>
        </div>
      </div>

      <p className='text-muted-foreground text-sm'>Times are shown in {timeZone}.</p>

      <div className='relative flex min-w-0 flex-col gap-3 sm:gap-4'>
        <div className='bg-border absolute top-2 bottom-2 left-4 hidden w-px md:block' />

        <p
          className='sr-only'
          aria-live='polite'
        >
          {isLoading
            ? `Loading games for ${selectedDateLabel}.`
            : error
              ? ''
              : games.length === 0
                ? `No NBA games for ${selectedDateLabel}.`
                : `${games.length} ${games.length === 1 ? 'game' : 'games'} for ${selectedDateLabel}.`}
        </p>

        {isLoading ? (
          Array.from({length: 4}).map((_, index) => <GameTimelineCardSkeleton key={index} />)
        ) : error ? (
          <div
            role='alert'
            className='border-destructive/40 bg-card rounded-xl border p-6 text-center'
          >
            <p className='text-destructive font-medium'>Unable to load match center</p>
            <p className='text-muted-foreground mt-1 text-sm'>{error}</p>
          </div>
        ) : games.length === 0 ? (
          <div className='bg-card border-border flex flex-col items-center gap-4 rounded-xl border p-6 text-center'>
            <div>
              <p className='font-medium'>No NBA games for this local date.</p>
              <p className='text-muted-foreground mt-1 text-sm'>
                Jump to the most recent date with games, or pick another day.
              </p>
            </div>
            <Button
              type='button'
              variant='outline'
              disabled={isFindingLastGame}
              onClick={() => void jumpToLastGameDay()}
            >
              {isFindingLastGame ? 'Finding…' : 'Last game day'}
            </Button>
          </div>
        ) : (
          games.map(game => (
            <GameTimelineCard
              key={game.id}
              game={game}
              dateKey={selectedDate}
            />
          ))
        )}
      </div>
    </section>
  )
}

function GameTimelineCard({game, dateKey}: {game: ScoreboardGame; dateKey: string}) {
  const startsAt = new Date(game.date)
  const showScore = game.status !== 'scheduled'
  const matchHref = `/match-center/${game.id}?date=${dateKey}`

  return (
    <article className='relative md:pl-12'>
      <div className='bg-background border-primary absolute top-7 left-2 hidden h-5 w-5 rounded-full border-4 md:block' />
      <div className='bg-card border-border hover:border-foreground/20 relative rounded-xl border p-3 transition sm:p-5'>
        <Link
          href={matchHref}
          className='absolute inset-0 z-0 rounded-xl'
          aria-label={`View ${game.shortName ?? game.name}`}
        />

        <div className='pointer-events-none relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div className='min-w-0'>
            <p className='text-muted-foreground text-sm'>{formatGameTime(startsAt)}</p>
            <h3 className='mt-1 truncate text-base font-semibold sm:text-lg'>{game.shortName ?? game.name}</h3>
            {game.venue ? <p className='text-muted-foreground mt-1 text-sm'>{game.venue}</p> : null}
          </div>
          <StatusBadge game={game} />
        </div>

        <div className='relative z-10 mt-4 grid gap-2 sm:mt-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4'>
          <TeamPanel
            team={game.awayTeam}
            score={showScore ? game.awayScore : null}
          />
          <div className='text-muted-foreground pointer-events-none py-1 text-center text-xs font-semibold tracking-wider uppercase md:text-sm'>
            {showScore ? 'at' : 'vs'}
          </div>
          <TeamPanel
            team={game.homeTeam}
            score={showScore ? game.homeScore : null}
            align='right'
          />
        </div>
      </div>
    </article>
  )
}

function GameTimelineCardSkeleton() {
  return (
    <article className='relative md:pl-12'>
      <div className='bg-background border-border absolute top-7 left-2 hidden h-5 w-5 rounded-full border-4 md:block' />
      <div className='bg-card border-border rounded-xl border p-3 sm:p-5'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div className='flex min-w-0 flex-col gap-1.5'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-5 w-32 sm:h-6' />
            <Skeleton className='h-4 w-40' />
          </div>
          <Skeleton className='h-7 w-32 rounded-full' />
        </div>

        <div className='mt-4 grid gap-2 sm:mt-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4'>
          <TeamPanelSkeleton />
          <Skeleton className='mx-auto my-1 h-4 w-6' />
          <TeamPanelSkeleton align='right' />
        </div>
      </div>
    </article>
  )
}

function TeamPanelSkeleton({align = 'left'}: {align?: 'left' | 'right'}) {
  return (
    <div
      className={`bg-background/40 flex min-w-0 items-center gap-3 rounded-lg p-3 md:bg-transparent md:p-0 ${
        align === 'right' ? 'md:flex-row-reverse' : ''
      }`}
    >
      <Skeleton className='h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12' />
      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${align === 'right' ? 'md:items-end' : ''}`}>
        <Skeleton className='h-4 w-10' />
        <Skeleton className='h-4 w-28' />
      </div>
    </div>
  )
}

function StatusBadge({game}: {game: ScoreboardGame}) {
  const label =
    game.status === 'live' && game.period
      ? `${game.statusDetail} - Q${game.period}${game.clock ? ` ${game.clock}` : ''}`
      : game.status === 'scheduled'
        ? `Starts ${formatGameTime(new Date(game.date))}`
        : game.statusDetail

  return (
    <span className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${statusClassName(game.status)}`}>
      {label}
    </span>
  )
}

function TeamPanel({
  team,
  score,
  align = 'left'
}: {
  team: ScoreboardTeam | null
  score: number | null
  align?: 'left' | 'right'
}) {
  const content = (
    <>
      {team?.logo ? (
        <Image
          src={team.logo}
          alt={`${team.displayName} logo`}
          className='h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12'
          width={48}
          height={48}
        />
      ) : (
        <div className='bg-muted h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12' />
      )}
      <div className='min-w-0 flex-1'>
        <p className='text-card-foreground font-semibold'>{team?.abbreviation ?? 'TBD'}</p>
        <p className='text-muted-foreground truncate text-sm'>{team?.displayName ?? 'To be determined'}</p>
        {score !== null ? <p className='mt-2 hidden text-3xl font-semibold md:block'>{score}</p> : null}
      </div>
      {score !== null ? <p className='shrink-0 text-2xl font-semibold md:hidden'>{score}</p> : null}
    </>
  )

  const layoutClass = `bg-background/40 flex min-w-0 items-center gap-3 rounded-lg p-3 md:bg-transparent md:p-0 ${
    align === 'right' ? 'md:flex-row-reverse md:text-right' : ''
  }`

  if (!team?.id) {
    return <div className={layoutClass}>{content}</div>
  }

  return (
    <Link
      href={`/teams/${team.id}`}
      className={`${layoutClass} pointer-events-auto hover:opacity-90`}
    >
      {content}
    </Link>
  )
}

function statusClassName(status: ScoreboardGame['status']) {
  if (status === 'live') return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
  if (status === 'final') return 'border-border bg-muted text-muted-foreground'
  return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
}

function formatGameTime(date: Date) {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}
