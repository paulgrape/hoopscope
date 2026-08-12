'use client'

import {ScoreboardMiniCardSkeleton} from '@/components/match/scoreboard-mini-skeleton'
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
  getTodayDateKey,
  isValidDateKey,
  parseLocalDateKey
} from '@/lib/games-api'
import {cn} from '@/lib/utils'
import {ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useEffect, useRef, useState, useTransition} from 'react'

const REFRESH_INTERVAL_MS = 60_000
const DISPLAY_LOCALE = 'en-US'
const PLACEHOLDER_CARDS = 4

type ScoreboardMiniProps = {
  initialDate?: string
  initialGames?: ScoreboardGame[]
}

export function ScoreboardMini({initialDate, initialGames = []}: ScoreboardMiniProps) {
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

      try {
        const nextGames = await getSchedule(selectedDate, getOffsetMinutesForDate(selectedDate))
        if (isActive) {
          setGames(nextGames)
          setError(null)
        }
      } catch (caughtError) {
        if (isActive) {
          setError(caughtError instanceof Error ? caughtError.message : 'Failed to load games')
          // Background refreshes keep the last good scores on screen.
          if (showLoading) setGames([])
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
  const selectedCalendarDate = parseLocalDateKey(selectedDate)

  return (
    <div className='flex min-w-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            aria-label='Previous day'
            onClick={() => setSelectedDate(addDaysToDateKey(selectedDate, -1))}
          >
            <ChevronLeftIcon />
          </Button>

          <Popover
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
          >
            <PopoverTrigger className='border-border bg-background hover:bg-muted inline-flex h-7 min-w-36 items-center justify-between gap-2 rounded-lg border px-2.5 text-[0.8rem] font-medium'>
              <span>{selectedDateLabel}</span>
              <ChevronDownIcon className='size-3.5 opacity-70' />
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
            size='icon-sm'
            aria-label='Next day'
            onClick={() => setSelectedDate(addDaysToDateKey(selectedDate, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        <div className='flex items-center gap-1.5'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={selectedDate === today}
            onClick={() => setSelectedDate(today)}
          >
            Today
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isFindingLastGame}
            onClick={() => void jumpToLastGameDay()}
          >
            {isFindingLastGame ? 'Finding…' : 'Last game day'}
          </Button>
        </div>
      </div>

      <p
        className='sr-only'
        aria-live='polite'
      >
        {isLoading
          ? `Loading games for ${selectedDateLabel}.`
          : games.length === 0
            ? `No NBA games for ${selectedDateLabel}.`
            : `${games.length} ${games.length === 1 ? 'game' : 'games'} for ${selectedDateLabel}.`}
      </p>

      {isLoading && games.length === 0 ? (
        <div className='grid min-w-0 gap-3 sm:grid-cols-2'>
          {Array.from({length: PLACEHOLDER_CARDS}).map((_, index) => (
            <ScoreboardMiniCardSkeleton key={index} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className='bg-card border-border flex flex-col items-center gap-3 rounded-xl border p-6 text-center'>
          <div>
            <p className='font-medium'>{error ? 'Unable to load scores' : 'No NBA games on this date.'}</p>
            <p className='text-muted-foreground mt-1 text-sm'>{error ?? 'Jump to the most recent date with games.'}</p>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isFindingLastGame}
            onClick={() => void jumpToLastGameDay()}
          >
            {isFindingLastGame ? 'Finding…' : 'Last game day'}
          </Button>
        </div>
      ) : (
        <>
          <ul className='grid min-w-0 gap-3 sm:grid-cols-2'>
            {games.map(game => (
              <li
                key={game.id}
                className='min-w-0'
              >
                <ScoreboardMiniCard
                  game={game}
                  dateKey={selectedDate}
                />
              </li>
            ))}
          </ul>
          {error ? (
            <p
              role='alert'
              className='text-muted-foreground text-xs'
            >
              Scores may be out of date: {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

function ScoreboardMiniCard({game, dateKey}: {game: ScoreboardGame; dateKey: string}) {
  const showScore = game.status !== 'scheduled'
  const awayLeads = showScore && (game.awayScore ?? 0) > (game.homeScore ?? 0)
  const homeLeads = showScore && (game.homeScore ?? 0) > (game.awayScore ?? 0)

  return (
    <Link
      href={`/match-center/${game.id}?date=${dateKey}`}
      aria-label={`View ${game.shortName ?? game.name}`}
      className='bg-card border-border hover:border-foreground/20 flex h-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition'
    >
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <TeamLine
          team={game.awayTeam}
          score={showScore ? game.awayScore : null}
          leading={awayLeads}
        />
        <TeamLine
          team={game.homeTeam}
          score={showScore ? game.homeScore : null}
          leading={homeLeads}
        />
      </div>
      <p
        className={cn(
          'w-16 shrink-0 text-right text-xs',
          game.status === 'live' ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted-foreground'
        )}
      >
        {game.status === 'live' ? <span className='sr-only'>{game.statusDetail} - </span> : null}
        {statusLabel(game)}
      </p>
    </Link>
  )
}

function TeamLine({team, score, leading}: {team: ScoreboardTeam | null; score: number | null; leading: boolean}) {
  return (
    <div className='flex min-w-0 items-center gap-2'>
      {team?.logo ? (
        <Image
          src={team.logo}
          alt=''
          width={24}
          height={24}
          className='size-6 shrink-0 object-contain'
        />
      ) : (
        <div className='bg-muted size-6 shrink-0 rounded-full' />
      )}
      <span className={cn('shrink-0 text-sm', leading ? 'font-semibold' : 'font-medium')}>
        {team?.abbreviation ?? 'TBD'}
      </span>
      <span className='text-muted-foreground hidden min-w-0 flex-1 truncate text-sm sm:block'>
        {team?.displayName ?? 'To be determined'}
      </span>
      {score !== null ? (
        <span className={cn('ml-auto shrink-0 text-lg tabular-nums', leading ? 'font-semibold' : 'font-medium')}>
          {score}
        </span>
      ) : null}
    </div>
  )
}

function statusLabel(game: ScoreboardGame) {
  if (game.status === 'live') {
    return game.period ? `Q${game.period}${game.clock ? ` ${game.clock}` : ''}` : game.statusDetail
  }

  if (game.status === 'scheduled') {
    return formatGameTime(new Date(game.date))
  }

  return game.statusDetail
}

function formatGameTime(date: Date) {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}
