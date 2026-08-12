import {ScoreboardMini} from '@/components/match/scoreboard-mini'
import {getOffsetMinutesForDate, getServerSchedule, getTodayDateKey} from '@/lib/games-api'

/** Server-seeded compact scoreboard for the current local date. */
export async function TodaysScores() {
  const today = getTodayDateKey()
  const initialGames = await getServerSchedule(today, getOffsetMinutesForDate(today)).catch(() => [])

  return (
    <ScoreboardMini
      initialDate={today}
      initialGames={initialGames}
    />
  )
}
