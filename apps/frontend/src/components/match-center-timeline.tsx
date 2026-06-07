'use client'

import Image from 'next/image'
import {useEffect, useMemo, useState} from 'react'

import {getSchedule, type ScoreboardGame, type ScoreboardTeam} from '@/lib/games-api'

const DATE_WINDOW_RADIUS = 4
const REFRESH_INTERVAL_MS = 60_000

export function MatchCenterTimeline() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey)
  const [games, setGames] = useState<ScoreboardGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dateOptions = useMemo(
    () =>
      Array.from({length: DATE_WINDOW_RADIUS * 2 + 1}, (_, index) =>
        addDays(selectedDate, index - DATE_WINDOW_RADIUS),
      ),
    [selectedDate],
  )

  useEffect(() => {
    let isActive = true

    async function loadGames(showLoading: boolean) {
      if (showLoading) setIsLoading(true)
      setError(null)

      try {
        const nextGames = await getSchedule(selectedDate, getOffsetMinutes(selectedDate))
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

  const selectedDateLabel = formatFullDate(selectedDate)
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <section className='flex flex-col gap-6'>
      <div className='bg-card border-border rounded-xl border p-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <p className='text-muted-foreground text-sm uppercase tracking-wider'>Selected date</p>
            <h2 className='mt-1 text-2xl font-semibold'>{selectedDateLabel}</h2>
            <p className='text-muted-foreground mt-1 text-sm'>Times are shown in {timeZone}.</p>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <DateButton label='Previous' onClick={() => setSelectedDate(addDays(selectedDate, -1))} />
            <DateButton label='Today' onClick={() => setSelectedDate(getTodayDateKey())} />
            <DateButton label='Next' onClick={() => setSelectedDate(addDays(selectedDate, 1))} />
          </div>
        </div>

        <div className='mt-5 flex gap-2 overflow-x-auto pb-1'>
          {dateOptions.map(date => {
            const isSelected = date === selectedDate

            return (
              <button
                key={date}
                type='button'
                onClick={() => setSelectedDate(date)}
                className={`min-w-24 rounded-xl border px-3 py-2 text-left transition ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <span className='block text-xs uppercase tracking-wider'>{formatWeekday(date)}</span>
                <span className='mt-1 block font-semibold'>{formatShortDate(date)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className='relative flex flex-col gap-4'>
        <div className='bg-border absolute top-2 bottom-2 left-4 hidden w-px md:block' />

        {isLoading ? (
          <div className='bg-card border-border rounded-xl border p-6 text-center'>
            <p className='text-muted-foreground'>Loading games...</p>
          </div>
        ) : error ? (
          <div className='border-destructive/40 bg-card rounded-xl border p-6 text-center'>
            <p className='text-destructive font-medium'>Unable to load match center</p>
            <p className='text-muted-foreground mt-1 text-sm'>{error}</p>
          </div>
        ) : games.length === 0 ? (
          <div className='bg-card border-border rounded-xl border p-6 text-center'>
            <p className='font-medium'>No NBA games for this local date.</p>
            <p className='text-muted-foreground mt-1 text-sm'>Try a nearby date from the timeline above.</p>
          </div>
        ) : (
          games.map(game => <GameTimelineCard key={game.id} game={game} />)
        )}
      </div>
    </section>
  )
}

function DateButton({label, onClick}: {label: string; onClick: () => void}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='border-border hover:bg-muted rounded-lg border px-3 py-2 text-sm font-medium transition'
    >
      {label}
    </button>
  )
}

function GameTimelineCard({game}: {game: ScoreboardGame}) {
  const startsAt = new Date(game.date)
  const showScore = game.status !== 'scheduled'

  return (
    <article className='relative md:pl-12'>
      <div className='bg-background border-primary absolute top-7 left-2 hidden h-5 w-5 rounded-full border-4 md:block' />
      <div className='bg-card border-border rounded-xl border p-5'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-muted-foreground text-sm'>{formatGameTime(startsAt)}</p>
            <h3 className='mt-1 text-lg font-semibold'>{game.shortName ?? game.name}</h3>
            {game.venue ? <p className='text-muted-foreground mt-1 text-sm'>{game.venue}</p> : null}
          </div>
          <StatusBadge game={game} />
        </div>

        <div className='mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center'>
          <TeamPanel team={game.awayTeam} score={showScore ? game.awayScore : null} />
          <div className='text-muted-foreground text-center text-sm font-semibold uppercase tracking-wider'>
            {showScore ? 'at' : 'vs'}
          </div>
          <TeamPanel team={game.homeTeam} score={showScore ? game.homeScore : null} align='right' />
        </div>
      </div>
    </article>
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
  align = 'left',
}: {
  team: ScoreboardTeam | null
  score: number | null
  align?: 'left' | 'right'
}) {
  return (
    <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {team?.logo ? (
        <Image
          src={team.logo}
          alt={`${team.displayName} logo`}
          className='h-12 w-12 object-contain'
          width={48}
          height={48}
        />
      ) : (
        <div className='bg-muted h-12 w-12 rounded-full' />
      )}
      <div>
        <p className='text-card-foreground font-semibold'>{team?.abbreviation ?? 'TBD'}</p>
        <p className='text-muted-foreground text-sm'>{team?.displayName ?? 'To be determined'}</p>
        {score !== null ? <p className='mt-2 text-3xl font-semibold'>{score}</p> : null}
      </div>
    </div>
  )
}

function statusClassName(status: ScoreboardGame['status']) {
  if (status === 'live') return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
  if (status === 'final') return 'border-border bg-muted text-muted-foreground'
  return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
}

function getTodayDateKey() {
  return formatDateKey(new Date())
}

function addDays(dateKey: string, days: number) {
  const date = parseLocalDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return formatDateKey(date)
}

function getOffsetMinutes(dateKey: string) {
  return parseLocalDateKey(dateKey).getTimezoneOffset()
}

function parseLocalDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatWeekday(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {weekday: 'short'}).format(parseLocalDateKey(dateKey))
}

function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {month: 'short', day: 'numeric'}).format(parseLocalDateKey(dateKey))
}

function formatFullDate(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parseLocalDateKey(dateKey))
}

function formatGameTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}
