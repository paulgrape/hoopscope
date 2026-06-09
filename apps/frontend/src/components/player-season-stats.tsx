'use client'

import {useState} from 'react'

import {Button} from '@/components/ui/button'
import type {PlayerSeasonStatsResponse, SeasonType} from '@/lib/players-api'

type PlayerSeasonStatsProps = {
  regularStats: PlayerSeasonStatsResponse
  playoffStats: PlayerSeasonStatsResponse
}

export function PlayerSeasonStats({regularStats, playoffStats}: PlayerSeasonStatsProps) {
  const [seasonType, setSeasonType] = useState<SeasonType>('regular')
  const stats = seasonType === 'regular' ? regularStats : playoffStats
  const showEmptyPlayoffs = seasonType === 'playoffs' && !playoffStats.participated

  return (
    <section className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
        <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>
          {regularStats.seasonLabel} Season Stats
        </h2>

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
          No playoff stats recorded for {playoffStats.seasonLabel}.
        </p>
      ) : stats.averages ? (
        <dl className='mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9'>
          <StatItem
            label='GP'
            value={formatStat(stats.averages.gp)}
          />
          <StatItem
            label='MIN'
            value={formatStat(stats.averages.min)}
          />
          <StatItem
            label='PTS'
            value={formatStat(stats.averages.pts)}
            highlight
          />
          <StatItem
            label='REB'
            value={formatStat(stats.averages.reb)}
            highlight
          />
          <StatItem
            label='AST'
            value={formatStat(stats.averages.ast)}
            highlight
          />
          <StatItem
            label='STL'
            value={formatStat(stats.averages.stl)}
          />
          <StatItem
            label='BLK'
            value={formatStat(stats.averages.blk)}
          />
          <StatItem
            label='TO'
            value={formatStat(stats.averages.tov)}
          />
          <StatItem
            label='FG%'
            value={formatPct(stats.averages.fgPct)}
          />
        </dl>
      ) : (
        <p className='text-muted-foreground mt-4 rounded-lg border border-dashed px-4 py-6 text-sm'>
          No {seasonType === 'regular' ? 'regular season' : 'playoff'} stats available for{' '}
          {stats.seasonLabel}.
        </p>
      )}
    </section>
  )
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={
        highlight
          ? 'bg-muted/40 border-border rounded-lg border px-2 py-2 text-center'
          : 'bg-background/40 border-border rounded-lg border px-2 py-2 text-center'
      }
    >
      <dt className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>{label}</dt>
      <dd className='text-card-foreground mt-1 text-base font-semibold tabular-nums'>{value}</dd>
    </div>
  )
}

function formatStat(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`
}
