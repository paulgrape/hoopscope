'use client'

import type {LivePlayEvent, ReplayTimelineEntry} from '@/lib/games-api'
import {cn} from '@/lib/utils'
import {type KeyboardEvent, type PointerEvent, useRef, useState} from 'react'

import {
  clockLabelAtElapsed,
  elapsedForPlayIndex,
  periodSegments,
  playIndexAtElapsed,
  teamAccent,
  totalGameSeconds
} from './replay-utils'

const PAGE_STEP_SECONDS = 60

type ReplayTimelineProps = {
  timeline: ReplayTimelineEntry[]
  playIndex: number
  seenPlays: (LivePlayEvent | undefined)[]
  maxSeenIndex: number
  homeTeamId: string
  awayTeamId: string
  homeColor: string
  awayColor: string
  onSeek: (playIndex: number) => void
}

export function ReplayTimeline({
  timeline,
  playIndex,
  seenPlays,
  maxSeenIndex,
  homeTeamId,
  awayTeamId,
  homeColor,
  awayColor,
  onSeek
}: ReplayTimelineProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [hoverSeconds, setHoverSeconds] = useState<number | null>(null)

  const lastIndex = Math.max(0, timeline.length - 1)
  const currentIndex = Math.min(Math.max(0, playIndex - 1), lastIndex)

  if (pendingIndex !== null && pendingIndex === currentIndex) setPendingIndex(null)

  const activeIndex = dragIndex ?? pendingIndex ?? currentIndex
  const totalSeconds = totalGameSeconds(timeline)
  const segments = periodSegments(timeline)
  const lastPeriod = segments.length
  const activeSeconds = elapsedForPlayIndex(timeline, activeIndex)
  const progress = totalSeconds > 0 ? (activeSeconds / totalSeconds) * 100 : 0

  const secondsFromPointer = (clientX: number) => {
    const track = trackRef.current
    if (!track) return 0

    const rect = track.getBoundingClientRect()
    if (rect.width === 0) return 0

    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    return ratio * totalSeconds
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    trackRef.current?.focus()
    setDragIndex(playIndexAtElapsed(timeline, secondsFromPointer(event.clientX)))
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const seconds = secondsFromPointer(event.clientX)
    setHoverSeconds(seconds)
    if (dragIndex !== null) setDragIndex(playIndexAtElapsed(timeline, seconds))
  }

  const commitSeek = (index: number) => {
    const target = Math.min(Math.max(0, index), lastIndex)
    if (target === (pendingIndex ?? currentIndex)) return

    setPendingIndex(target)
    onSeek(target)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const target = dragIndex ?? playIndexAtElapsed(timeline, secondsFromPointer(event.clientX))
    setDragIndex(null)
    commitSeek(target)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const seekTo = (index: number) => {
      event.preventDefault()
      commitSeek(index)
    }

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        return seekTo(activeIndex - 1)
      case 'ArrowRight':
      case 'ArrowUp':
        return seekTo(activeIndex + 1)
      case 'PageDown':
        return seekTo(playIndexAtElapsed(timeline, activeSeconds - PAGE_STEP_SECONDS))
      case 'PageUp':
        return seekTo(playIndexAtElapsed(timeline, activeSeconds + PAGE_STEP_SECONDS))
      case 'Home':
        return seekTo(0)
      case 'End':
        return seekTo(lastIndex)
      default:
        return undefined
    }
  }

  const hoverPercent = hoverSeconds !== null && totalSeconds > 0 ? (hoverSeconds / totalSeconds) * 100 : null

  return (
    <div className='bg-card border-border rounded-xl border p-3 sm:p-4'>
      <div
        ref={trackRef}
        role='slider'
        tabIndex={0}
        aria-label='Replay position'
        aria-valuemin={0}
        aria-valuemax={lastIndex}
        aria-valuenow={activeIndex}
        aria-valuetext={clockLabelAtElapsed(activeSeconds, lastPeriod)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoverSeconds(null)}
        onKeyDown={handleKeyDown}
        className='focus-visible:ring-ring/50 relative h-11 cursor-pointer touch-none rounded-md select-none focus-visible:ring-3 focus-visible:outline-none sm:h-9'
      >
        <div className='bg-muted absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full' />
        <div
          className='bg-primary absolute top-1/2 left-0 h-2.5 -translate-y-1/2 rounded-full'
          style={{width: `${progress}%`}}
        />

        {segments.slice(1).map(segment => (
          <div
            key={segment.period}
            aria-hidden='true'
            className='bg-background/80 absolute top-1/2 h-4 w-px -translate-y-1/2'
            style={{left: `${(segment.startSeconds / totalSeconds) * 100}%`}}
          />
        ))}

        {timeline.slice(0, maxSeenIndex + 1).map(entry => {
          const play = seenPlays[entry.index]
          if (!play?.scoringPlay) return null

          const color =
            play.teamId === homeTeamId
              ? teamAccent(homeColor)
              : play.teamId === awayTeamId
                ? teamAccent(awayColor)
                : undefined

          return (
            <div
              key={entry.index}
              aria-hidden='true'
              className={cn(
                'absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
                !color && 'bg-foreground/50'
              )}
              style={{
                left: `${(entry.elapsedSeconds / totalSeconds) * 100}%`,
                backgroundColor: color
              }}
            />
          )
        })}

        <div
          aria-hidden='true'
          className='bg-primary ring-background absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2'
          style={{left: `${progress}%`}}
        />

        {hoverPercent !== null ? (
          <div
            aria-hidden='true'
            className='bg-popover text-popover-foreground border-border pointer-events-none absolute -top-1 -translate-x-1/2 -translate-y-full rounded-md border px-1.5 py-0.5 text-xs tabular-nums'
            style={{left: `${hoverPercent}%`}}
          >
            {clockLabelAtElapsed(hoverSeconds ?? 0, lastPeriod)}
          </div>
        ) : null}
      </div>

      <div
        aria-hidden='true'
        className='text-muted-foreground mt-1 flex text-[0.65rem] sm:text-xs'
      >
        {segments.map(segment => (
          <span
            key={segment.period}
            className='border-border truncate border-l pl-1 first:border-l-0 first:pl-0'
            style={{width: `${((segment.endSeconds - segment.startSeconds) / totalSeconds) * 100}%`}}
          >
            {segment.label}
          </span>
        ))}
      </div>

      <div className='text-muted-foreground mt-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm'>
        <span>{clockLabelAtElapsed(activeSeconds, lastPeriod)}</span>
        <span className='tabular-nums'>
          Play {(activeIndex + 1).toLocaleString()} of {timeline.length.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
