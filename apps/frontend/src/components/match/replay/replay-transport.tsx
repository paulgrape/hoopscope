'use client'

import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'
import {ChevronFirst, ChevronLast, Pause, Play, RotateCcw, SkipBack, SkipForward} from 'lucide-react'

export type PlaybackPace = 1 | 1.5 | 2 | 3

export const PLAYBACK_PACES: PlaybackPace[] = [1, 1.5, 2, 3]

type ReplayTransportProps = {
  paused: boolean
  isFinal: boolean
  pace: PlaybackPace
  canStepBack: boolean
  canStepForward: boolean
  previousScoringIndex: number | null
  nextScoringIndex: number | null
  onTogglePlay: () => void
  onRestart: () => void
  onStep: (offset: number) => void
  onSeek: (playIndex: number) => void
  onPaceChange: (pace: PlaybackPace) => void
}

export function ReplayTransport({
  paused,
  isFinal,
  pace,
  canStepBack,
  canStepForward,
  previousScoringIndex,
  nextScoringIndex,
  onTogglePlay,
  onRestart,
  onStep,
  onSeek,
  onPaceChange
}: ReplayTransportProps) {
  return (
    <div className='bg-card border-border flex flex-col items-center gap-3 rounded-xl border p-3 sm:flex-row sm:flex-wrap sm:p-4'>
      <div className='flex items-center justify-center gap-1'>
        <Button
          variant='ghost'
          size='icon-sm'
          className='size-9 sm:size-7'
          aria-label='Restart replay'
          onClick={onRestart}
        >
          <RotateCcw aria-hidden='true' />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          className='size-9 sm:size-7'
          aria-label='Previous scoring play'
          disabled={previousScoringIndex === null}
          onClick={() => previousScoringIndex !== null && onSeek(previousScoringIndex)}
        >
          <ChevronFirst aria-hidden='true' />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          className='size-9 sm:size-7'
          aria-label='Previous play'
          disabled={!canStepBack}
          onClick={() => onStep(-1)}
        >
          <SkipBack aria-hidden='true' />
        </Button>
        <Button
          size='icon'
          className='size-11 sm:size-8'
          aria-label={isFinal ? 'Replay from start' : paused ? 'Resume replay' : 'Pause replay'}
          onClick={isFinal ? onRestart : onTogglePlay}
        >
          {isFinal ? (
            <RotateCcw aria-hidden='true' />
          ) : paused ? (
            <Play aria-hidden='true' />
          ) : (
            <Pause aria-hidden='true' />
          )}
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          className='size-9 sm:size-7'
          aria-label='Next play'
          disabled={!canStepForward}
          onClick={() => onStep(1)}
        >
          <SkipForward aria-hidden='true' />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          className='size-9 sm:size-7'
          aria-label='Next scoring play'
          disabled={nextScoringIndex === null}
          onClick={() => nextScoringIndex !== null && onSeek(nextScoringIndex)}
        >
          <ChevronLast aria-hidden='true' />
        </Button>
      </div>

      <div
        className='flex w-full items-center justify-center gap-1 sm:ml-auto sm:w-auto'
        role='group'
        aria-label='Replay pace'
      >
        {PLAYBACK_PACES.map(playbackPace => (
          <button
            key={playbackPace}
            type='button'
            aria-pressed={pace === playbackPace}
            aria-label={`Replay pace x${playbackPace}`}
            onClick={() => onPaceChange(playbackPace)}
            className={cn(
              'focus-visible:ring-ring/50 rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:ring-3 focus-visible:outline-none',
              pace === playbackPace
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted text-muted-foreground'
            )}
          >
            x{playbackPace}
          </button>
        ))}
      </div>
    </div>
  )
}
