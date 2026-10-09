'use client'

import {LiveBadge, formatLiveClock} from '@/components/match/live-status'
import {GameTimelineCardSkeleton} from '@/components/match/match-center-timeline-skeleton'
import {SeasonTypeKicker, groupGamesBySeasonType} from '@/components/match/season-type'
import {useScheduleSeed} from '@/components/match/use-schedule-seed'
import {Button} from '@/components/ui/button'
import {Calendar} from '@/components/ui/calendar'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {
  type ScoreboardGame,
  type ScoreboardTeam,
  addDaysToDateKey,
  formatCompactDateLabel,
  formatDateKey,
  getNearestScheduleDate,
  getOffsetMinutesForDate,
  getSchedule,
  parseLocalDateKey
} from '@/lib/games-api'
import {ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {useEffect, useState} from 'react'

const REFRESH_INTERVAL_MS = 60_000
const DISPLAY_LOCALE = 'en-US'

type MatchCenterTimelineProps = {
  initialDate?: string
  initialToday?: string
  initialGames?: ScoreboardGame[]
  initialOffsetMinutes?: number
  initialTimeZone?: string
}

export function MatchCenterTimeline({
  initialDate,
  initialToday,
  initialGames = [],
  initialOffsetMinutes,
  initialTimeZone
}: MatchCenterTimelineProps) {
  const {
    today,
    selectedDate,
    setSelectedDate,
    games,
    setGames,
    isLoading,
    setIsLoading,
    timeZone,
    clockReady,
    reuseSeed,
    markScheduleLoaded
  } = useScheduleSeed({initialDate, initialToday, initialGames, initialOffsetMinutes, initialTimeZone})

  const [error, setError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isFindingLastGame, setIsFindingLastGame] = useState(false)

  useEffect(() => {
    if (!clockReady) return

    let isActive = true

    async function loadGames(showLoading: boolean) {
      if (showLoading && reuseSeed) return

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
        if (isActive) {
          setIsLoading(false)
          markScheduleLoaded(selectedDate)
        }
      }
    }

    void loadGames(true)
    const refresh = window.setInterval(() => void loadGames(false), REFRESH_INTERVAL_MS)

    return () => {
      isActive = false
      window.clearInterval(refresh)
    }
  }, [clockReady, markScheduleLoaded, reuseSeed, selectedDate, setGames, setIsLoading])

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
            disabled={isFindingLastGame || games.length > 0}
            onClick={() => void jumpToLastGameDay()}
          >
            {isFindingLastGame ? 'Finding…' : 'Last game day'}
          </Button>
        </div>
      </div>

      <p className='text-muted-foreground text-sm'>
        {timeZone ? `Times are shown in ${timeZone}.` : 'Times are shown in your local time.'}
      </p>

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
          groupGamesBySeasonType(games).map((group, index) => (
            <div
              key={`${group.seasonType ?? 'none'}-${index}`}
              className='flex flex-col gap-3 sm:gap-4'
            >
              <SeasonTypeKicker
                seasonType={group.seasonType}
                className='md:pl-12'
              />
              {group.games.map(game => (
                <GameTimelineCard
                  key={game.id}
                  game={game}
                  dateKey={selectedDate}
                  timeZone={timeZone}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function GameTimelineCard({game, dateKey, timeZone}: {game: ScoreboardGame; dateKey: string; timeZone?: string}) {
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
            <p className='text-muted-foreground text-sm'>{formatGameTime(startsAt, timeZone)}</p>
            <h3 className='mt-1 truncate text-base font-semibold sm:text-lg'>{game.shortName ?? game.name}</h3>
            {game.venue ? <p className='text-muted-foreground mt-1 text-sm'>{game.venue}</p> : null}
          </div>
          <StatusBadge
            game={game}
            timeZone={timeZone}
          />
        </div>

        <div className='relative z-10 mt-4 grid gap-2 sm:mt-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4'>
          <TeamPanel
            team={game.awayTeam}
            score={showScore ? game.awayScore : null}
          />
          {showScore ? (
            <div
              className='text-muted-foreground pointer-events-none py-1 text-center text-xs font-semibold tracking-wider uppercase md:text-sm'
              aria-hidden='true'
            >
              –
            </div>
          ) : (
            <div className='text-muted-foreground pointer-events-none py-1 text-center text-xs font-semibold tracking-wider uppercase md:text-sm'>
              vs
            </div>
          )}
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

function StatusBadge({game, timeZone}: {game: ScoreboardGame; timeZone?: string}) {
  if (game.status === 'live') {
    return (
      <span className='inline-flex w-fit items-center gap-2'>
        <LiveBadge />
        <span className='text-sm font-medium text-red-700 tabular-nums dark:text-red-300'>{formatLiveClock(game)}</span>
      </span>
    )
  }

  const label =
    game.status === 'scheduled' ? `Starts ${formatGameTime(new Date(game.date), timeZone)}` : game.statusDetail

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

function formatGameTime(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    ...(timeZone ? {timeZone} : {})
  }).format(date)
}
