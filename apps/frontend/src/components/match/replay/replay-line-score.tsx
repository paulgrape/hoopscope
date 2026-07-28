import type {GameTeam, LiveGameState} from '@/lib/games-api'

import {type PeriodScoreRow, periodScoreRowsFromTotals, periodScoresFromPlays} from './replay-utils'

type ReplayLineScoreProps = {
  game: LiveGameState
}

export function ReplayLineScore({game}: ReplayLineScoreProps) {
  const rows =
    game.status === 'final' && game.periodScores
      ? periodScoreRowsFromTotals(game.periodScores.home, game.periodScores.away)
      : periodScoresFromPlays(game.plays)

  if (rows.length === 0) {
    return <p className='text-muted-foreground text-sm'>Quarter scoring appears once the replay starts.</p>
  }

  return (
    <div className='border-border isolate overflow-x-auto rounded-xl border'>
      <table className='w-full min-w-80 text-sm'>
        <caption className='sr-only'>Scoring by quarter up to the current replay position</caption>
        <thead className='bg-muted text-muted-foreground'>
          <tr>
            <th
              scope='col'
              className='bg-muted px-3 py-2 text-left font-medium sm:sticky sm:left-0 sm:z-1'
            >
              Team
            </th>
            {rows.map(row => (
              <th
                key={row.period}
                scope='col'
                className='px-2 py-2 text-center font-medium'
              >
                {row.label}
              </th>
            ))}
            <th
              scope='col'
              className='px-3 py-2 text-center font-medium'
            >
              T
            </th>
          </tr>
        </thead>
        <tbody>
          <LineScoreRow
            team={game.awayTeam}
            rows={rows}
            side='away'
            total={game.awayScore}
          />
          <LineScoreRow
            team={game.homeTeam}
            rows={rows}
            side='home'
            total={game.homeScore}
          />
        </tbody>
      </table>
    </div>
  )
}

function LineScoreRow({
  team,
  rows,
  side,
  total
}: {
  team: GameTeam
  rows: PeriodScoreRow[]
  side: 'home' | 'away'
  total: number
}) {
  return (
    <tr className='border-border border-t'>
      <th
        scope='row'
        className='bg-card px-3 py-2 text-left font-medium sm:sticky sm:left-0 sm:z-1'
      >
        {team.abbreviation}
      </th>
      {rows.map(row => (
        <td
          key={row.period}
          className='px-2 py-2 text-center tabular-nums'
        >
          {side === 'home' ? row.home : row.away}
        </td>
      ))}
      <td className='px-3 py-2 text-center font-semibold tabular-nums'>{total}</td>
    </tr>
  )
}
