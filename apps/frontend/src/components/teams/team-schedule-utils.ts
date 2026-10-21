import type {GameSeasonType} from '@/lib/games-api'
import type {TeamGameResult, TeamScheduleGame} from '@/lib/teams-api'

const COMPETITIVE_SEASON_TYPES = new Set<GameSeasonType>(['regular', 'play-in', 'playoffs'])

export const FORM_GAME_COUNT = 5

/**
 * Prefer regular, play-in, and playoff games. When none exist yet (e.g. early
 * preseason), fall back to the full list so the strip is not empty.
 */
export function selectVisibleScheduleGames(games: TeamScheduleGame[]): TeamScheduleGame[] {
  const competitive = games.filter(game => game.seasonType != null && COMPETITIVE_SEASON_TYPES.has(game.seasonType))
  return competitive.length > 0 ? competitive : games
}

/**
 * Anchor index in the visible schedule:
 * 1. Live game if one is in progress
 * 2. First scheduled game
 * 3. Last game of a finished season
 */
export function findScheduleAnchorIndex(games: TeamScheduleGame[]): number {
  if (games.length === 0) return -1

  const liveIndex = games.findIndex(game => game.status === 'live')
  if (liveIndex !== -1) return liveIndex

  const scheduledIndex = games.findIndex(game => game.status === 'scheduled')
  if (scheduledIndex !== -1) return scheduledIndex

  return games.length - 1
}

/**
 * Up to five final games with a W/L result immediately before the anchor game.
 */
export function deriveTeamForm(
  games: TeamScheduleGame[],
  anchorIndex = findScheduleAnchorIndex(games),
  count = FORM_GAME_COUNT
): Array<TeamScheduleGame & {result: TeamGameResult}> {
  if (anchorIndex <= 0 || games.length === 0) return []

  return games
    .slice(0, anchorIndex)
    .filter(
      (game): game is TeamScheduleGame & {result: TeamGameResult} =>
        game.status === 'final' && (game.result === 'W' || game.result === 'L')
    )
    .slice(-count)
}
