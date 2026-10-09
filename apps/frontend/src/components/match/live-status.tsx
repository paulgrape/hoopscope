import {cn} from '@/lib/utils'

const REGULATION_PERIODS = 4

export type LiveClockGame = {
  status: 'scheduled' | 'live' | 'final'
  statusDetail: string
  period: number | null
  clock: string | null
}

export function formatLiveClock(game: LiveClockGame) {
  if (game.status === 'live' && game.period && isRunningClock(game.clock)) {
    return `${periodLabel(game.period)} ${game.clock?.trim()}`
  }

  return game.statusDetail
}

export function LiveBadge({compact = false}: {compact?: boolean}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 font-medium text-red-600 dark:text-red-300',
        compact ? 'px-1.5 py-0.5 text-[10px] leading-none' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span
        className='relative flex size-2 shrink-0'
        aria-hidden='true'
      >
        <span className='absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75' />
        <span className='relative inline-flex size-2 rounded-full bg-red-500' />
      </span>
      Live
    </span>
  )
}

function periodLabel(period: number) {
  if (period <= REGULATION_PERIODS) return `Q${period}`
  const overtime = period - REGULATION_PERIODS
  return overtime === 1 ? 'OT' : `${overtime}OT`
}

function isRunningClock(clock: string | null) {
  if (!clock) return false
  const trimmed = clock.trim()
  return trimmed.length > 0 && trimmed !== '0:00'
}
