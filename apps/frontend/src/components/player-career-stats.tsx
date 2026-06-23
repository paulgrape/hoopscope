'use client'

import {useMemo, useState} from 'react'

import {Button} from '@/components/ui/button'
import type {PlayerCareerSeasonStats, SeasonType} from '@/lib/players-api'
import {cn} from '@/lib/utils'

type SortColumn = keyof Pick<
  PlayerCareerSeasonStats,
  'seasonLabel' | 'teamAbbr' | 'gp' | 'min' | 'pts' | 'reb' | 'ast' | 'fgPct' | 'threePointPct' | 'freeThrowPct'
>

type SortDirection = 'asc' | 'desc'

const COLUMNS: Array<{key: SortColumn; label: string; numeric: boolean; className?: string}> = [
  {key: 'seasonLabel', label: 'Season', numeric: false},
  {key: 'teamAbbr', label: 'Team', numeric: false},
  {key: 'gp', label: 'GP', numeric: true},
  {key: 'min', label: 'MIN', numeric: true},
  {key: 'pts', label: 'PTS', numeric: true},
  {key: 'reb', label: 'REB', numeric: true},
  {key: 'ast', label: 'AST', numeric: true},
  {key: 'fgPct', label: 'FG%', numeric: true, className: 'hidden sm:table-cell'},
  {key: 'threePointPct', label: '3P%', numeric: true, className: 'hidden sm:table-cell'},
  {key: 'freeThrowPct', label: 'FT%', numeric: true, className: 'hidden sm:table-cell'},
]

type PlayerCareerStatsProps = {
  seasons: PlayerCareerSeasonStats[]
}

export function PlayerCareerStats({seasons}: PlayerCareerStatsProps) {
  const [seasonType, setSeasonType] = useState<SeasonType>('regular')
  const [sortColumn, setSortColumn] = useState<SortColumn>('seasonLabel')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filteredSeasons = useMemo(
    () => seasons.filter((season) => season.seasonType === seasonType),
    [seasons, seasonType],
  )

  const sortedSeasons = useMemo(() => {
    const rows = [...filteredSeasons]
    const column = COLUMNS.find((item) => item.key === sortColumn)
    if (!column) return rows

    rows.sort((a, b) => {
      if (!column.numeric) {
        const comparison = String(a[sortColumn] ?? '').localeCompare(String(b[sortColumn] ?? ''))
        return sortDirection === 'asc' ? comparison : -comparison
      }

      const left = a[sortColumn] as number
      const right = b[sortColumn] as number
      const comparison = left - right
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return rows
  }, [filteredSeasons, sortColumn, sortDirection])

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortColumn(column)
    setSortDirection('desc')
  }

  if (seasons.length === 0) {
    return (
      <section className='bg-card border-border rounded-xl border p-3 sm:p-5'>
        <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Career Stats</h2>
        <p className='text-muted-foreground mt-4 rounded-lg border border-dashed px-4 py-6 text-sm'>
          No career stats available.
        </p>
      </section>
    )
  }

  const showEmptyPlayoffs =
    seasonType === 'playoffs' && filteredSeasons.length === 0

  return (
    <section className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
        <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Career Stats</h2>

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

      {showEmptyPlayoffs ? (
        <p className='text-muted-foreground mt-4 rounded-lg border border-dashed px-4 py-6 text-sm'>
          No playoff stats recorded.
        </p>
      ) : (
        <>
          <div className='mt-4 grid gap-3 md:hidden'>
            {sortedSeasons.map((season) => (
              <article
                key={`${season.season}-${season.seasonType}-${season.teamId ?? 'tot'}`}
                className='bg-background/40 border-border rounded-lg border p-3'
              >
                <div className='flex items-start justify-between gap-3'>
                  <p className='font-medium'>{season.seasonLabel}</p>
                  <span className='text-muted-foreground text-sm'>{season.teamAbbr ?? '-'}</span>
                </div>
                <dl className='text-muted-foreground mt-3 grid grid-cols-4 gap-2 text-xs'>
                  <MiniStat
                    label='PTS'
                    value={formatStat(season.pts)}
                  />
                  <MiniStat
                    label='REB'
                    value={formatStat(season.reb)}
                  />
                  <MiniStat
                    label='AST'
                    value={formatStat(season.ast)}
                  />
                  <MiniStat
                    label='GP'
                    value={formatStat(season.gp)}
                  />
                </dl>
                <dl className='text-muted-foreground mt-2 grid grid-cols-3 gap-2 text-xs'>
                  <MiniStat
                    label='FG%'
                    value={formatPct(season.fgPct)}
                  />
                  <MiniStat
                    label='3P%'
                    value={formatPct(season.threePointPct)}
                  />
                  <MiniStat
                    label='FT%'
                    value={formatPct(season.freeThrowPct)}
                  />
                </dl>
              </article>
            ))}
          </div>

          <div className='mt-4 hidden overflow-x-auto md:block'>
            <table className='w-full min-w-xl text-left text-sm'>
              <thead className='text-muted-foreground border-b'>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'px-2 py-2 font-medium sm:px-3',
                        column.key === 'seasonLabel' || column.key === 'teamAbbr'
                          ? 'text-left'
                          : 'text-right',
                        column.className,
                      )}
                    >
                      <button
                        type='button'
                        onClick={() => handleSort(column.key)}
                        className={cn(
                          'hover:text-foreground inline-flex items-center gap-1 transition-colors',
                          column.key !== 'seasonLabel' &&
                            column.key !== 'teamAbbr' &&
                            'w-full justify-end',
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
                {sortedSeasons.map((season) => (
                  <tr
                    key={`${season.season}-${season.seasonType}-${season.teamId ?? 'tot'}`}
                    className='border-border/70 text-card-foreground border-b'
                  >
                    <td className='px-2 py-2.5 sm:px-3'>{season.seasonLabel}</td>
                    <td className='px-2 py-2.5 sm:px-3'>{season.teamAbbr ?? '-'}</td>
                    <td className='px-2 py-2.5 text-right tabular-nums sm:px-3'>
                      {formatStat(season.gp)}
                    </td>
                    <td className='px-2 py-2.5 text-right tabular-nums sm:px-3'>
                      {formatStat(season.min)}
                    </td>
                    <td className='px-2 py-2.5 text-right tabular-nums sm:px-3'>
                      {formatStat(season.pts)}
                    </td>
                    <td className='px-2 py-2.5 text-right tabular-nums sm:px-3'>
                      {formatStat(season.reb)}
                    </td>
                    <td className='px-2 py-2.5 text-right tabular-nums sm:px-3'>
                      {formatStat(season.ast)}
                    </td>
                    <td className='hidden px-2 py-2.5 text-right tabular-nums sm:table-cell sm:px-3'>
                      {formatPct(season.fgPct)}
                    </td>
                    <td className='hidden px-2 py-2.5 text-right tabular-nums sm:table-cell sm:px-3'>
                      {formatPct(season.threePointPct)}
                    </td>
                    <td className='hidden px-2 py-2.5 text-right tabular-nums sm:table-cell sm:px-3'>
                      {formatPct(season.freeThrowPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function MiniStat({label, value}: {label: string; value: string}) {
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
