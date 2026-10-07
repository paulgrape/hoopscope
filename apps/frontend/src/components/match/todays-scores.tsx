import {ScoreboardMini} from '@/components/match/scoreboard-mini'
import {getServerSchedule} from '@/lib/games-api'
import {readScheduleSeed} from '@/lib/schedule-request'

/** Server-seeded compact scoreboard for the visitor's calendar date. */
export async function TodaysScores() {
  const seed = await readScheduleSeed()
  const initialGames = await getServerSchedule(seed.date, seed.offsetMinutes).catch(() => [])

  return (
    <ScoreboardMini
      initialDate={seed.date}
      initialToday={seed.today}
      initialGames={initialGames}
      initialOffsetMinutes={seed.offsetMinutes}
      initialTimeZone={seed.timeZone}
    />
  )
}
