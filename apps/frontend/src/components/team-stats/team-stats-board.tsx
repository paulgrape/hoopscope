'use client'

import {TeamSeasonSelect} from '@/components/teams/team-season-select'
import {type TeamStatRow, type TeamStatsResponse, teamStatsHref} from '@/lib/team-stats-api'
import {cn} from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import {useMemo, useState} from 'react'

type StatKey = Exclude<keyof TeamStatRow, 'id' | 'name' | 'abbreviation' | 'logo'>
type SortColumn = StatKey | 'name'
type SortDirection = 'asc' | 'desc'
type StatFormat = 'integer' | 'number' | 'percent' | 'rate'

type StatColumn = {
  key: StatKey
  label: string
  title: string
  format: StatFormat
}

const GROUPS: Array<{label: string; columns: StatColumn[]}> = [
  {
    label: 'Ratings',
    columns: [
      {key: 'gp', label: 'GP', title: 'Games played', format: 'integer'},
      {key: 'off', label: 'OFF', title: 'Offensive rating', format: 'number'},
      {key: 'def', label: 'DEF', title: 'Defensive rating', format: 'number'},
      {key: 'net', label: 'NET', title: 'Net rating', format: 'number'},
      {key: 'pace', label: 'PACE', title: 'Pace', format: 'number'},
      {key: 'topg', label: 'TOPG', title: 'Turnovers per game', format: 'number'},
      {key: 'pts', label: 'PTS', title: 'Points per game', format: 'number'},
      {key: 'oppPts', label: 'OPP PTS', title: 'Opponent points per game', format: 'number'}
    ]
  },
  {
    label: 'Offensive',
    columns: [
      {key: 'fgm', label: 'FGM', title: 'Field goals made per game', format: 'number'},
      {key: 'fga', label: 'FGA', title: 'Field goals attempted per game', format: 'number'},
      {key: 'fgPct', label: 'FG%', title: 'Field goal percentage', format: 'percent'},
      {key: 'threePm', label: '3PM', title: '3-pointers made per game', format: 'number'},
      {key: 'threePa', label: '3PA', title: '3-pointers attempted per game', format: 'number'},
      {key: 'threePct', label: '3P%', title: '3-point percentage', format: 'percent'},
      {key: 'ftm', label: 'FTM', title: 'Free throws made per game', format: 'number'},
      {key: 'fta', label: 'FTA', title: 'Free throws attempted per game', format: 'number'},
      {key: 'ftPct', label: 'FT%', title: 'Free throw percentage', format: 'percent'},
      {key: 'oreb', label: 'OR', title: 'Offensive rebounds per game', format: 'number'},
      {key: 'orPct', label: 'OR%', title: 'Offensive rebound percentage', format: 'percent'},
      {key: 'ast', label: 'AST', title: 'Assists per game', format: 'number'},
      {key: 'astTo', label: 'AST/TO', title: 'Assist to turnover ratio', format: 'number'},
      {key: 'scEff', label: 'SC-EFF', title: 'Scoring efficiency', format: 'rate'},
      {key: 'shEff', label: 'SH-EFF', title: 'Shooting efficiency', format: 'rate'}
    ]
  },
  {
    label: 'Defensive',
    columns: [
      {key: 'dr', label: 'DR', title: 'Defensive rebounds per game', format: 'number'},
      {key: 'reb', label: 'REB', title: 'Rebounds per game', format: 'number'},
      {key: 'stl', label: 'STL', title: 'Steals per game', format: 'number'},
      {key: 'blk', label: 'BLK', title: 'Blocks per game', format: 'number'},
      {key: 'pf', label: 'PF', title: 'Fouls per game', format: 'number'}
    ]
  },
  {
    label: 'Differential',
    columns: [
      {key: 'ptsDiff', label: 'PTS+/-', title: 'Points per game differential', format: 'number'},
      {key: 'fgPctDiff', label: 'FG%+/-', title: 'Field goal percentage differential', format: 'percent'},
      {key: 'threePctDiff', label: '3P%+/-', title: '3-point percentage differential', format: 'percent'},
      {key: 'ftPctDiff', label: 'FT%+/-', title: 'Free throw percentage differential', format: 'percent'},
      {key: 'orDiff', label: 'OR+/-', title: 'Offensive rebounds per game differential', format: 'number'},
      {key: 'drDiff', label: 'DR+/-', title: 'Defensive rebounds per game differential', format: 'number'},
      {key: 'rebDiff', label: 'REB+/-', title: 'Rebounds per game differential', format: 'number'},
      {key: 'astDiff', label: 'AST+/-', title: 'Assists per game differential', format: 'number'},
      {key: 'toDiff', label: 'TO+/-', title: 'Turnovers per game differential', format: 'number'},
      {key: 'stlDiff', label: 'STL+/-', title: 'Steals per game differential', format: 'number'},
      {key: 'blkDiff', label: 'BLK+/-', title: 'Blocks per game differential', format: 'number'},
      {key: 'pfDiff', label: 'PF+/-', title: 'Fouls per game differential', format: 'number'}
    ]
  }
]

const COLUMNS = GROUPS.flatMap(group => group.columns)

function formatStat(value: number | null, format: StatFormat): string {
  if (value == null) return '–'
  if (format === 'integer') return String(Math.round(value))
  if (format === 'percent') return `${value.toFixed(1)}%`
  if (format === 'rate') return value.toFixed(3)
  return value.toFixed(1)
}

export function TeamStatsFilters({data}: {data: TeamStatsResponse}) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <TeamSeasonSelect
        season={data.season}
        currentSeason={data.currentSeason}
      />
      <nav
        aria-label='Season type'
        className='bg-card flex w-full gap-1 rounded-lg border p-1 sm:w-auto'
      >
        {(['regular', 'playoffs'] as const).map(seasonType => (
          <Link
            key={seasonType}
            href={teamStatsHref({season: data.season, seasonType})}
            aria-current={data.seasonType === seasonType ? 'page' : undefined}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center rounded-md px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-none',
              data.seasonType === seasonType
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {seasonType === 'regular' ? 'Regular' : 'Playoffs'}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function TeamStatsBoard({data}: {data: TeamStatsResponse}) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('net')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const teams = useMemo(() => {
    const rows = [...data.teams]
    rows.sort((left, right) => compareTeams(left, right, sortColumn, sortDirection))
    return rows
  }, [data.teams, sortColumn, sortDirection])

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortColumn(column)
    setSortDirection(column === 'name' ? 'asc' : 'desc')
  }

  return (
    <div className='flex flex-col gap-5'>
      <TeamStatsFilters data={data} />
      {teams.length === 0 ? (
        <p className='text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-sm'>
          No team statistics for this season yet.
        </p>
      ) : (
        <div className='bg-card border-border min-w-0 overflow-x-auto rounded-xl border'>
          <table className='w-max min-w-full border-separate border-spacing-0 text-left text-sm'>
            <caption className='sr-only'>Team season statistics</caption>
            <thead className='text-muted-foreground'>
              <tr>
                <th
                  scope='col'
                  rowSpan={2}
                  aria-sort={ariaSort(sortColumn === 'name', sortDirection)}
                  className='bg-card border-border sticky left-0 z-20 min-w-44 border-r border-b px-3 py-2 align-bottom font-medium'
                >
                  <SortButton
                    label='Team'
                    active={sortColumn === 'name'}
                    direction={sortDirection}
                    align='start'
                    onClick={() => handleSort('name')}
                  />
                </th>
                {GROUPS.map(group => (
                  <th
                    key={group.label}
                    scope='colgroup'
                    colSpan={group.columns.length}
                    className='border-border border-b px-2 py-2 text-center text-[10px] font-medium tracking-wide uppercase'
                  >
                    {group.label}
                  </th>
                ))}
              </tr>
              <tr>
                {COLUMNS.map(column => (
                  <th
                    key={column.key}
                    scope='col'
                    aria-sort={ariaSort(sortColumn === column.key, sortDirection)}
                    className='border-border border-b px-2 py-2 text-right text-xs font-medium'
                  >
                    <SortButton
                      label={column.label}
                      title={column.title}
                      active={sortColumn === column.key}
                      direction={sortDirection}
                      onClick={() => handleSort(column.key)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr
                  key={team.id}
                  className='text-card-foreground'
                >
                  <th
                    scope='row'
                    className='bg-card border-border sticky left-0 z-10 border-r border-b px-3 py-2 text-left font-medium'
                  >
                    <Link
                      href={`/teams/${team.id}`}
                      className='hover:text-foreground flex min-w-0 items-center gap-2'
                    >
                      {team.logo ? (
                        <Image
                          src={team.logo}
                          alt=''
                          width={28}
                          height={28}
                          className='h-7 w-7 shrink-0 object-contain'
                        />
                      ) : (
                        <span className='bg-muted h-7 w-7 shrink-0 rounded-full' />
                      )}
                      <span className='truncate'>{team.name}</span>
                    </Link>
                  </th>
                  {COLUMNS.map(column => (
                    <td
                      key={column.key}
                      className='border-border border-b px-2 py-2 text-right whitespace-nowrap tabular-nums'
                    >
                      {formatStat(team[column.key], column.format)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SortButton({
  label,
  title,
  active,
  direction,
  align = 'end',
  onClick
}: {
  label: string
  title?: string
  active: boolean
  direction: SortDirection
  align?: 'start' | 'end'
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'hover:text-foreground inline-flex items-center gap-1 transition-colors',
        align === 'end' && 'w-full justify-end'
      )}
    >
      {title ? (
        <abbr
          title={title}
          className='no-underline'
        >
          {label}
        </abbr>
      ) : (
        label
      )}
      {active ? <span aria-hidden='true'>{direction === 'asc' ? '↑' : '↓'}</span> : null}
    </button>
  )
}

function ariaSort(active: boolean, direction: SortDirection): 'ascending' | 'descending' | 'none' {
  if (!active) return 'none'
  return direction === 'asc' ? 'ascending' : 'descending'
}

function compareTeams(left: TeamStatRow, right: TeamStatRow, column: SortColumn, direction: SortDirection): number {
  if (column === 'name') {
    const comparison = left.name.localeCompare(right.name)
    return direction === 'asc' ? comparison : -comparison
  }

  const leftValue = left[column]
  const rightValue = right[column]
  if (leftValue == null && rightValue == null) return left.name.localeCompare(right.name)
  if (leftValue == null) return 1
  if (rightValue == null) return -1

  const comparison = leftValue - rightValue
  if (comparison === 0) return left.name.localeCompare(right.name)
  return direction === 'asc' ? comparison : -comparison
}
