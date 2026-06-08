'use client'

import Image from 'next/image'
import {useMemo, useState} from 'react'

import {Button} from '@/components/ui/button'
import {type SeasonType, type TeamSeasonStatPlayer, type TeamSeasonStatsResponse} from '@/lib/teams-api'
import {cn} from '@/lib/utils'

type SortColumn = keyof Pick<
  TeamSeasonStatPlayer,
  'fullName' | 'gp' | 'min' | 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'tov' | 'fgPct'
>

type SortDirection = 'asc' | 'desc'

const COLUMNS: Array<{key: SortColumn; label: string; numeric: boolean; className?: string}> = [
  {key: 'fullName', label: 'Player', numeric: false},
  {key: 'gp', label: 'GP', numeric: true},
  {key: 'min', label: 'MIN', numeric: true},
  {key: 'pts', label: 'PTS', numeric: true},
  {key: 'reb', label: 'REB', numeric: true},
  {key: 'ast', label: 'AST', numeric: true},
  {key: 'stl', label: 'STL', numeric: true, className: 'hidden lg:table-cell'},
  {key: 'blk', label: 'BLK', numeric: true, className: 'hidden lg:table-cell'},
  {key: 'tov', label: 'TO', numeric: true, className: 'hidden xl:table-cell'},
  {key: 'fgPct', label: 'FG%', numeric: true, className: 'hidden xl:table-cell'}
]

type TeamSeasonStatsProps = {
  regularStats: TeamSeasonStatsResponse
  playoffStats: TeamSeasonStatsResponse
}

export function TeamSeasonStats({regularStats, playoffStats}: TeamSeasonStatsProps) {
  const [seasonType, setSeasonType] = useState<SeasonType>('regular')
  const [sortColumn, setSortColumn] = useState<SortColumn>('pts')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const stats = seasonType === 'regular' ? regularStats : playoffStats

  const sortedPlayers = useMemo(() => {
    const players = [...stats.players]
    const column = COLUMNS.find(item => item.key === sortColumn)
    if (!column) return players

    players.sort((a, b) => {
      if (!column.numeric) {
        const comparison = a.fullName.localeCompare(b.fullName)
        return sortDirection === 'asc' ? comparison : -comparison
      }

      const left = a[sortColumn] as number
      const right = b[sortColumn] as number
      const comparison = left - right
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return players
  }, [stats.players, sortColumn, sortDirection])

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortColumn(column)
    setSortDirection(column === 'fullName' ? 'asc' : 'desc')
  }

  const showEmptyPlayoffs = seasonType === 'playoffs' && !playoffStats.participated
  const showStats = !showEmptyPlayoffs

  return (
    <section className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
        <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>2025-26 Season Stats</h2>

        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
          <div className='bg-background border-border flex w-full rounded-lg border p-0.5 sm:w-auto'>
            <Button
              type='button'
              size='sm'
              variant={seasonType === 'regular' ? 'default' : 'ghost'}
              className='flex-1 rounded-md sm:flex-none'
              onClick={() => setSeasonType('regular')}
            >
              Regular
            </Button>
            <Button
              type='button'
              size='sm'
              variant={seasonType === 'playoffs' ? 'default' : 'ghost'}
              className='flex-1 rounded-md sm:flex-none'
              onClick={() => setSeasonType('playoffs')}
            >
              Playoffs
            </Button>
          </div>
        </div>
      </div>

      {showEmptyPlayoffs ? (
        <p className='text-muted-foreground mt-4 rounded-lg border border-dashed px-4 py-6 text-sm'>
          This team did not qualify for the playoffs in {playoffStats.seasonLabel}.
        </p>
      ) : null}

      {showStats ? (
        <>
          <div className='mt-4 flex items-center gap-2 md:hidden'>
            <label
              htmlFor='stats-sort'
              className='text-muted-foreground shrink-0 text-sm'
            >
              Sort by
            </label>
            <select
              id='stats-sort'
              value={sortColumn}
              onChange={event => handleSort(event.target.value as SortColumn)}
              className='bg-background border-border text-foreground min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm'
            >
              {COLUMNS.map(column => (
                <option
                  key={column.key}
                  value={column.key}
                >
                  {column.label}
                  {sortColumn === column.key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                </option>
              ))}
            </select>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='shrink-0 px-2.5'
              aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
              onClick={() => setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          <div className='mt-3 grid gap-3 md:hidden'>
            {sortedPlayers.map(player => (
              <PlayerStatCard
                key={player.id}
                player={player}
              />
            ))}
          </div>

          <div className='mt-4 hidden overflow-x-auto md:block'>
            <table className='w-full min-w-xl text-left text-sm'>
              <thead className='text-muted-foreground border-b'>
                <tr>
                  {COLUMNS.map(column => (
                    <th
                      key={column.key}
                      className={cn(
                        'px-2 py-2 font-medium sm:px-3',
                        column.key === 'fullName' ? 'min-w-40 text-left' : 'text-right',
                        column.className
                      )}
                    >
                      <button
                        type='button'
                        onClick={() => handleSort(column.key)}
                        className={cn(
                          'hover:text-foreground inline-flex items-center gap-1 transition-colors',
                          column.key !== 'fullName' && 'w-full justify-end'
                        )}
                      >
                        {column.label}
                        {sortColumn === column.key ? (
                          <span aria-hidden='true'>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        ) : null}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map(player => (
                  <tr
                    key={player.id}
                    className='border-border/70 text-card-foreground border-b'
                  >
                    {COLUMNS.map(column => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-2 py-2.5 sm:px-3',
                          column.key === 'fullName' ? 'text-left' : 'text-right tabular-nums',
                          column.className
                        )}
                      >
                        {column.key === 'fullName' ? (
                          <PlayerCell player={player} />
                        ) : column.key === 'fgPct' ? (
                          formatPct(player.fgPct)
                        ) : (
                          formatStat(player[column.key] as number)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  )
}

function PlayerCell({player}: {player: TeamSeasonStatPlayer}) {
  return (
    <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
      {player.headshot ? (
        <Image
          src={player.headshot}
          alt={player.fullName}
          width={40}
          height={40}
          className='h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10'
        />
      ) : (
        <div className='bg-muted h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10' />
      )}
      <div className='min-w-0'>
        <p className='truncate font-medium'>{player.fullName}</p>
        <p className='text-muted-foreground truncate text-xs'>
          {player.position ?? '-'}
          {player.jersey ? ` · #${player.jersey}` : ''}
        </p>
      </div>
    </div>
  )
}

function PlayerStatCard({player}: {player: TeamSeasonStatPlayer}) {
  return (
    <article className='bg-background/40 border-border rounded-lg border p-3'>
      <PlayerCell player={player} />

      <dl className='mt-3 grid grid-cols-3 gap-2'>
        <StatHighlight
          label='PTS'
          value={formatStat(player.pts)}
        />
        <StatHighlight
          label='REB'
          value={formatStat(player.reb)}
        />
        <StatHighlight
          label='AST'
          value={formatStat(player.ast)}
        />
      </dl>

      <dl className='text-muted-foreground mt-3 grid grid-cols-4 gap-x-2 gap-y-2 text-xs sm:grid-cols-7'>
        <StatItem
          label='GP'
          value={formatStat(player.gp)}
        />
        <StatItem
          label='MIN'
          value={formatStat(player.min)}
        />
        <StatItem
          label='STL'
          value={formatStat(player.stl)}
        />
        <StatItem
          label='BLK'
          value={formatStat(player.blk)}
        />
        <StatItem
          label='TO'
          value={formatStat(player.tov)}
        />
        <StatItem
          label='FG%'
          value={formatPct(player.fgPct)}
        />
      </dl>
    </article>
  )
}

function StatHighlight({label, value}: {label: string; value: string}) {
  return (
    <div className='bg-muted/40 rounded-md px-2 py-1.5 text-center'>
      <dt className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>{label}</dt>
      <dd className='text-card-foreground mt-0.5 text-base font-semibold tabular-nums'>{value}</dd>
    </div>
  )
}

function StatItem({label, value}: {label: string; value: string}) {
  return (
    <div className='text-center'>
      <dt className='text-[10px] font-medium tracking-wide uppercase'>{label}</dt>
      <dd className='text-card-foreground mt-0.5 font-medium tabular-nums'>{value}</dd>
    </div>
  )
}

function formatStat(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`
}
