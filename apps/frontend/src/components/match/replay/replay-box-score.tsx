'use client'

import type {GameTeam, LiveGameState, ReplayPlayerStat} from '@/lib/games-api'
import {cn} from '@/lib/utils'
import {useMemo} from 'react'

import {type DerivedPlayerLine, deriveBoxScore} from './replay-box-score-derive'

type ReplayBoxScoreProps = {
  game: LiveGameState
}

type BoxScoreRow = DerivedPlayerLine & {
  minutes: string | null
}

export function ReplayBoxScore({game}: ReplayBoxScoreProps) {
  const derived = useMemo(
    () => deriveBoxScore(game.plays, game.homeTeam.id, game.awayTeam.id),
    [game.plays, game.homeTeam.id, game.awayTeam.id]
  )

  const isFinal = Boolean(game.finalPlayers)
  const away = withMinutes(derived.away, game.finalPlayers?.away)
  const home = withMinutes(derived.home, game.finalPlayers?.home)

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-muted-foreground text-xs'>
        Built from the play-by-play; may trail the official line where a play is missing from the archive.
        {isFinal ? ' Minutes from the final box score.' : ''}
      </p>

      <div className='grid min-w-0 gap-4 lg:grid-cols-2'>
        <BoxScoreTable
          team={game.awayTeam}
          rows={away}
          showMinutes={isFinal}
        />
        <BoxScoreTable
          team={game.homeTeam}
          rows={home}
          showMinutes={isFinal}
        />
      </div>
    </div>
  )
}

function withMinutes(lines: DerivedPlayerLine[], officialPlayers: ReplayPlayerStat[] | undefined): BoxScoreRow[] {
  const minutesByName = new Map((officialPlayers ?? []).map(player => [nameKey(player.name), player.minutes]))

  return lines.map(line => ({...line, minutes: minutesByName.get(nameKey(line.name)) ?? null}))
}

// The feed writes "J.R. Smith" where the official box score says "JR Smith".
function nameKey(name: string) {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}

function BoxScoreTable({team, rows, showMinutes}: {team: GameTeam; rows: BoxScoreRow[]; showMinutes: boolean}) {
  if (rows.length === 0) {
    return <p className='text-muted-foreground text-sm'>No plays recorded for {team.name} yet.</p>
  }

  return (
    <div className='border-border isolate overflow-x-auto rounded-xl border'>
      <table className='w-full min-w-0 text-sm sm:min-w-136'>
        <caption className='bg-muted/40 px-3 py-2 text-left font-semibold'>{team.name}</caption>
        <thead className='text-muted-foreground'>
          <tr className='border-border border-t'>
            <th
              scope='col'
              className='bg-card px-3 py-2 text-left font-medium sm:sticky sm:left-0 sm:z-1'
            >
              Player
            </th>
            {showMinutes ? <StatHeader label='MIN' /> : null}
            <StatHeader
              label='FG'
              className='hidden sm:table-cell'
            />
            <StatHeader
              label='3PT'
              className='hidden sm:table-cell'
            />
            <StatHeader
              label='FT'
              className='hidden sm:table-cell'
            />
            <StatHeader label='REB' />
            <StatHeader label='AST' />
            <StatHeader
              label='STL'
              className='hidden sm:table-cell'
            />
            <StatHeader
              label='BLK'
              className='hidden sm:table-cell'
            />
            <StatHeader
              label='TO'
              className='hidden sm:table-cell'
            />
            <StatHeader
              label='PF'
              className='hidden sm:table-cell'
            />
            <th
              scope='col'
              className='text-foreground px-3 py-2 text-right font-semibold'
            >
              PTS
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.name}
              className='border-border border-t'
            >
              <th
                scope='row'
                className='bg-card max-w-36 truncate px-3 py-2 text-left font-medium sm:sticky sm:left-0 sm:z-1 sm:max-w-40'
              >
                {row.name}
              </th>
              {showMinutes ? <StatCell value={row.minutes ?? '—'} /> : null}
              <StatCell
                value={`${row.fieldGoalsMade}-${row.fieldGoalsAttempted}`}
                className='hidden sm:table-cell'
              />
              <StatCell
                value={`${row.threesMade}-${row.threesAttempted}`}
                className='hidden sm:table-cell'
              />
              <StatCell
                value={`${row.freeThrowsMade}-${row.freeThrowsAttempted}`}
                className='hidden sm:table-cell'
              />
              <StatCell value={row.rebounds} />
              <StatCell value={row.assists} />
              <StatCell
                value={row.steals}
                className='hidden sm:table-cell'
              />
              <StatCell
                value={row.blocks}
                className='hidden sm:table-cell'
              />
              <StatCell
                value={row.turnovers}
                className='hidden sm:table-cell'
              />
              <StatCell
                value={row.fouls}
                className='hidden sm:table-cell'
              />
              <td className='px-3 py-2 text-right font-semibold tabular-nums'>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatHeader({label, className}: {label: string; className?: string}) {
  return (
    <th
      scope='col'
      className={cn('px-2 py-2 text-right font-medium', className)}
    >
      {label}
    </th>
  )
}

function StatCell({value, className}: {value: string | number; className?: string}) {
  return <td className={cn('px-2 py-2 text-right tabular-nums', className)}>{value}</td>
}
