import type {ScoreboardGame} from '@/lib/games-api'

const STATUS_RANK: Record<ScoreboardGame['status'], number> = {
  live: 0,
  scheduled: 1,
  final: 2
}

/** Live games first, then scheduled, then final. Each group stays in tip-time order. */
export function sortScoreboardGames(games: ScoreboardGame[]) {
  return [...games].sort((first, second) => {
    const rank = STATUS_RANK[first.status] - STATUS_RANK[second.status]
    if (rank !== 0) return rank
    return new Date(first.date).getTime() - new Date(second.date).getTime()
  })
}
