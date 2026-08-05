'use client'

import {useEffect, useRef, useState} from 'react'

import {clockToSeconds, formatGameClock, periodLabel} from './replay-utils'

const CLOCK_TICK_MS = 250

type ReplayClockProps = {
  clock: string
  playIndex: number
  quarter: number
  paused: boolean
  isFinal: boolean
  pace: number
}

export function ReplayClock({clock, playIndex, quarter, paused, isFinal, pace}: ReplayClockProps) {
  const displayClock = useReplayClock({clock, playIndex, paused, isFinal, pace})

  return (
    <div className='text-center'>
      <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
        {isFinal ? 'Final' : periodLabel(quarter)}
      </p>
      <p className='mt-0.5 text-2xl leading-none font-semibold tabular-nums sm:text-3xl'>
        {isFinal ? '—' : displayClock}
      </p>
    </div>
  )
}

function useReplayClock({clock, playIndex, paused, isFinal, pace}: Omit<ReplayClockProps, 'quarter'>) {
  const [clockSeconds, setClockSeconds] = useState(() => clockToSeconds(clock))
  const [syncKey, setSyncKey] = useState(`${playIndex}:${clock}`)
  const paceRef = useRef(pace)

  useEffect(() => {
    paceRef.current = pace
  }, [pace])

  const nextSyncKey = `${playIndex}:${clock}`
  if (nextSyncKey !== syncKey) {
    setSyncKey(nextSyncKey)
    setClockSeconds(clockToSeconds(clock))
  }

  useEffect(() => {
    if (isFinal || paused) return

    let lastTickAt = Date.now()
    const interval = window.setInterval(() => {
      const now = Date.now()
      const elapsedGameSeconds = ((now - lastTickAt) / 1000) * paceRef.current

      lastTickAt = now
      setClockSeconds(currentClockSeconds => {
        if (currentClockSeconds === null) return currentClockSeconds
        return Math.max(0, currentClockSeconds - elapsedGameSeconds)
      })
    }, CLOCK_TICK_MS)

    return () => window.clearInterval(interval)
  }, [isFinal, paused])

  return clockSeconds === null ? clock : formatGameClock(clockSeconds)
}
