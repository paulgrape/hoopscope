'use client'

import {cn} from '@/lib/utils'
import {ChevronDownIcon} from 'lucide-react'
import Link from 'next/link'
import {useState} from 'react'

export type BoxScoreLine = {
  id: string
  name: string
  href: string | null
  meta: string | null
  starter: boolean
  minutes: string | null
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  fieldGoals: string | null
  threePointers: string | null
  freeThrows: string | null
}

type StatColumn = {
  label: string
  value: (line: BoxScoreLine) => string | number
  width: string
}

const COUNT_WIDTH = 'min-w-11 md:min-w-12'
const SPLIT_WIDTH = 'min-w-14 md:min-w-16'

const PRIMARY_COLUMNS: StatColumn[] = [
  {label: 'REB', value: line => line.rebounds, width: COUNT_WIDTH},
  {label: 'AST', value: line => line.assists, width: COUNT_WIDTH}
]

const SPLIT_COLUMNS: StatColumn[] = [
  {label: 'FG', value: line => line.fieldGoals ?? '—', width: SPLIT_WIDTH},
  {label: '3PT', value: line => line.threePointers ?? '—', width: SPLIT_WIDTH},
  {label: 'FT', value: line => line.freeThrows ?? '—', width: SPLIT_WIDTH}
]

const SECONDARY_COLUMNS: StatColumn[] = [
  {label: 'STL', value: line => line.steals, width: COUNT_WIDTH},
  {label: 'BLK', value: line => line.blocks, width: COUNT_WIDTH},
  {label: 'TO', value: line => line.turnovers, width: COUNT_WIDTH},
  {label: 'PF', value: line => line.fouls, width: COUNT_WIDTH}
]

const SECONDARY_CELL = 'hidden md:table-cell'

type BoxScoreTableProps = {
  lines: BoxScoreLine[]
  caption?: string
  emptyMessage: string
  showMinutes?: boolean
  showLineupGroups?: boolean
}

export function BoxScoreTable({
  lines,
  caption,
  emptyMessage,
  showMinutes = true,
  showLineupGroups = false
}: BoxScoreTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (lines.length === 0) {
    return <p className='text-muted-foreground text-sm'>{emptyMessage}</p>
  }

  const groups = showLineupGroups
    ? [
        {label: 'Starters', lines: lines.filter(line => line.starter)},
        {label: 'Bench', lines: lines.filter(line => !line.starter)}
      ].filter(group => group.lines.length > 0)
    : [{label: null, lines}]

  const columnCount =
    1 + (showMinutes ? 1 : 0) + 1 + PRIMARY_COLUMNS.length + SPLIT_COLUMNS.length + SECONDARY_COLUMNS.length + 1

  return (
    <div className='border-border overflow-hidden rounded-xl border md:overflow-x-auto'>
      <table className='w-full text-sm'>
        {caption ? <caption className='bg-muted/40 px-3 py-2 text-left font-semibold'>{caption}</caption> : null}
        <thead className='text-muted-foreground'>
          <tr className={cn('border-border', caption && 'border-t')}>
            <th
              scope='col'
              className='w-full px-3 py-2 text-left font-medium'
            >
              Player
            </th>
            {showMinutes ? (
              <StatHeader
                label='MIN'
                className={COUNT_WIDTH}
              />
            ) : null}
            <StatHeader
              label='PTS'
              className={cn('text-foreground', COUNT_WIDTH)}
            />
            {PRIMARY_COLUMNS.map(column => (
              <StatHeader
                key={column.label}
                label={column.label}
                className={column.width}
              />
            ))}
            {[...SPLIT_COLUMNS, ...SECONDARY_COLUMNS].map(column => (
              <StatHeader
                key={column.label}
                label={column.label}
                className={cn(SECONDARY_CELL, column.width)}
              />
            ))}
            <th
              scope='col'
              className='w-8 md:hidden'
            >
              <span className='sr-only'>More stats</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map(group => (
            <BoxScoreGroup
              key={group.label ?? 'all'}
              label={group.label}
              lines={group.lines}
              columnCount={columnCount}
              showMinutes={showMinutes}
              expandedId={expandedId}
              onToggle={id => setExpandedId(current => (current === id ? null : id))}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BoxScoreGroup({
  label,
  lines,
  columnCount,
  showMinutes,
  expandedId,
  onToggle
}: {
  label: string | null
  lines: BoxScoreLine[]
  columnCount: number
  showMinutes: boolean
  expandedId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <>
      {label ? (
        <tr className='bg-muted/20'>
          <td
            colSpan={columnCount}
            className='text-muted-foreground px-3 py-1.5 text-xs font-medium tracking-wider uppercase'
          >
            {label}
          </td>
        </tr>
      ) : null}
      {lines.map(line => (
        <BoxScoreRow
          key={line.id}
          line={line}
          columnCount={columnCount}
          showMinutes={showMinutes}
          expanded={expandedId === line.id}
          onToggle={onToggle}
        />
      ))}
    </>
  )
}

function BoxScoreRow({
  line,
  columnCount,
  showMinutes,
  expanded,
  onToggle
}: {
  line: BoxScoreLine
  columnCount: number
  showMinutes: boolean
  expanded: boolean
  onToggle: (id: string) => void
}) {
  const detailId = `box-score-detail-${line.id}`

  const name = (
    <span className='flex min-w-0 items-baseline gap-1.5'>
      <span className='truncate font-medium'>{line.name}</span>
      {line.meta ? <span className='text-muted-foreground shrink-0 text-xs'>{line.meta}</span> : null}
    </span>
  )

  return (
    <>
      <tr className='border-border border-t'>
        <th
          scope='row'
          className='max-w-0 px-3 py-2.5 text-left font-normal'
        >
          {line.href ? (
            <Link
              href={line.href}
              className='flex min-w-0 hover:underline'
            >
              {name}
            </Link>
          ) : (
            name
          )}
        </th>
        {showMinutes ? <StatCell value={line.minutes || '—'} /> : null}
        <StatCell
          value={line.points}
          className='text-foreground font-semibold'
        />
        {PRIMARY_COLUMNS.map(column => (
          <StatCell
            key={column.label}
            value={column.value(line)}
          />
        ))}
        {[...SPLIT_COLUMNS, ...SECONDARY_COLUMNS].map(column => (
          <StatCell
            key={column.label}
            value={column.value(line)}
            className={SECONDARY_CELL}
          />
        ))}
        <td className='pr-1 md:hidden'>
          <button
            type='button'
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={() => onToggle(line.id)}
            className='text-muted-foreground hover:text-foreground flex size-8 items-center justify-center transition-colors'
          >
            <ChevronDownIcon
              className={cn('size-4 transition-transform', expanded && 'rotate-180')}
              aria-hidden='true'
            />
            <span className='sr-only'>
              {expanded ? 'Hide' : 'Show'} more stats for {line.name}
            </span>
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr
          id={detailId}
          className='border-border bg-muted/20 border-t md:hidden'
        >
          <td
            colSpan={columnCount}
            className='px-3 py-2.5'
          >
            <dl className='text-muted-foreground grid grid-cols-4 gap-x-2 gap-y-2 text-xs'>
              {[...SPLIT_COLUMNS, ...SECONDARY_COLUMNS].map(column => (
                <DetailStat
                  key={column.label}
                  label={column.label}
                  value={column.value(line)}
                />
              ))}
            </dl>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function StatHeader({label, className}: {label: string; className?: string}) {
  return (
    <th
      scope='col'
      className={cn('px-2 py-2 text-center font-medium whitespace-nowrap md:px-3', className)}
    >
      {label}
    </th>
  )
}

function StatCell({value, className}: {value: string | number; className?: string}) {
  return <td className={cn('px-2 py-2.5 text-center whitespace-nowrap tabular-nums md:px-3', className)}>{value}</td>
}

function DetailStat({label, value}: {label: string; value: string | number}) {
  return (
    <div className='text-center'>
      <dt className='text-[10px] font-medium tracking-wide uppercase'>{label}</dt>
      <dd className='text-card-foreground mt-0.5 font-medium whitespace-nowrap tabular-nums'>{value}</dd>
    </div>
  )
}
