import type {GameSeasonType, ScoreboardGame} from '@/lib/games-api'
import {cn} from '@/lib/utils'

const LABELS: Record<GameSeasonType, string> = {
  preseason: 'Preseason',
  regular: 'Regular',
  playoffs: 'Playoffs',
  'play-in': 'Play-in'
}

export type SeasonTypeGroup = {
  seasonType: GameSeasonType | null
  games: ScoreboardGame[]
}

/** Consecutive runs of the same season type, preserving the list's time order. */
export function groupGamesBySeasonType(games: ScoreboardGame[]): SeasonTypeGroup[] {
  const groups: SeasonTypeGroup[] = []

  for (const game of games) {
    const current = groups.at(-1)
    if (current && current.seasonType === game.seasonType) {
      current.games.push(game)
      continue
    }

    groups.push({seasonType: game.seasonType, games: [game]})
  }

  return groups
}

type SeasonTypeKickerProps = {
  seasonType: GameSeasonType | null
  className?: string
}

export function SeasonTypeKicker({seasonType, className}: SeasonTypeKickerProps) {
  if (!seasonType) return null

  return (
    <p className={cn('text-muted-foreground text-xs font-medium tracking-wider uppercase', className)}>
      {LABELS[seasonType]}
    </p>
  )
}
