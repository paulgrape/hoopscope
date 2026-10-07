'use client'

import {
  type ScoreboardGame,
  browserTodayOverride,
  getTodayDateKey,
  isValidDateKey,
  seedOffsetMatchesBrowser
} from '@/lib/games-api'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useCallback, useState, useSyncExternalStore, useTransition} from 'react'

type ScheduleSeedInput = {
  initialDate?: string
  initialToday?: string
  initialGames?: ScoreboardGame[]
  initialOffsetMinutes?: number
  initialTimeZone?: string
}

const subscribeBrowserClock = () => () => {}

function readBrowserClock() {
  return `${getTodayDateKey()}|${Intl.DateTimeFormat().resolvedOptions().timeZone}`
}

function readServerBrowserClock() {
  return null
}

export function useScheduleSeed({
  initialDate,
  initialToday,
  initialGames = [],
  initialOffsetMinutes,
  initialTimeZone
}: ScheduleSeedInput) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // null during SSR and hydration so the first paint matches the server seed.
  // The client snapshot then supplies the visitor's calendar day before paint.
  const browserClock = useSyncExternalStore(subscribeBrowserClock, readBrowserClock, readServerBrowserClock)
  const clockReady = browserClock !== null
  const browserToday = clockReady ? browserClock.slice(0, 10) : null
  const browserTimeZone = clockReady ? browserClock.slice(11) : null

  const urlDate = searchParams.get('date')
  const seededToday = isValidDateKey(initialToday)
    ? initialToday
    : isValidDateKey(initialDate)
      ? initialDate
      : getTodayDateKey()
  const startingDate =
    (isValidDateKey(urlDate) && urlDate) || (isValidDateKey(initialDate) && initialDate) || seededToday
  const seededDate = isValidDateKey(initialDate) ? initialDate : seededToday
  const hasInitialGames = initialGames.length > 0 && startingDate === seededDate

  const [selectedDate, setSelectedDateState] = useState(startingDate)
  const [hasPickedDate, setHasPickedDate] = useState(false)
  const [games, setGames] = useState<ScoreboardGame[]>(hasInitialGames ? initialGames : [])
  const [isLoading, setIsLoading] = useState(!hasInitialGames)
  const [fetchedDate, setFetchedDate] = useState<string | null>(null)

  const today = browserToday ?? seededToday
  const timeZone = browserTimeZone ?? initialTimeZone
  const activeOverride =
    clockReady && !hasPickedDate && browserToday
      ? browserTodayOverride(urlDate, initialDate, selectedDate, browserToday)
      : null
  const activeDate = activeOverride ?? selectedDate
  const reuseSeed =
    clockReady &&
    hasInitialGames &&
    activeOverride === null &&
    activeDate === seededDate &&
    seedOffsetMatchesBrowser(initialOffsetMinutes, activeDate)
  const pendingSeed = clockReady && !reuseSeed && fetchedDate !== activeDate

  // Follow back/forward navigation: sync the selected date from the URL
  // during render instead of a cascading effect.
  const [prevUrlDate, setPrevUrlDate] = useState(urlDate)
  if (urlDate !== prevUrlDate) {
    setPrevUrlDate(urlDate)
    if (isValidDateKey(urlDate) && urlDate !== selectedDate) {
      setHasPickedDate(true)
      setSelectedDateState(urlDate)
    }
  }

  const markScheduleLoaded = useCallback(
    (date: string) => {
      setFetchedDate(date)
    },
    [setFetchedDate]
  )

  function setSelectedDate(nextDate: string) {
    const currentToday = getTodayDateKey()
    setHasPickedDate(true)
    setSelectedDateState(nextDate)
    const params = new URLSearchParams(searchParams.toString())
    if (nextDate === currentToday) {
      params.delete('date')
    } else {
      params.set('date', nextDate)
    }
    const query = params.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname
    const currentQuery = searchParams.toString()
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname
    if (nextUrl === currentUrl) return
    startTransition(() => {
      router.replace(nextUrl, {scroll: false})
    })
  }

  return {
    today,
    selectedDate: activeDate,
    setSelectedDate,
    games: pendingSeed ? [] : games,
    setGames,
    isLoading: pendingSeed || isLoading,
    setIsLoading,
    timeZone,
    clockReady,
    reuseSeed,
    markScheduleLoaded
  }
}
