'use client'

import Image from 'next/image'
import Link from 'next/link'
import {useEffect, useState} from 'react'

import {getGameSummary, type GameLeader, type GameSummary, type ScoreboardTeam, type TeamStatLine} from '@/lib/games-api'
import {cn} from '@/lib/utils'

const REFRESH_INTERVAL_MS = 60_000
const DISPLAY_LOCALE = 'en-US'

type MatchSummaryProps = {
  initialSummary: GameSummary
}

export function MatchSummary({initialSummary}: MatchSummaryProps) {
  const [summary, setSummary] = useState(initialSummary)

  useEffect(() => {
    setSummary(initialSummary)
  }, [initialSummary])

  useEffect(() => {
    if (summary.status !== 'live') return

    let isActive = true

    async function refresh() {
      try {
        const next = await getGameSummary(summary.id)
        if (isActive && next) setSummary(next)
      } catch {
        // Keep showing the last good summary during transient refresh failures.
      }
    }

    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
    return () => {
      isActive = false
      window.clearInterval(interval)
    }
  }, [summary.id, summary.status])

  const showScore = summary.status !== 'scheduled'
  const tipLabel = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(summary.date))

  return (
    <div className='flex flex-col gap-6 sm:gap-8'>
      <section className='bg-card border-border rounded-xl border p-4 sm:p-6'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-muted-foreground text-sm'>{tipLabel}</p>
            {summary.venue ? <p className='text-muted-foreground mt-1 text-sm'>{summary.venue}</p> : null}
          </div>
          <StatusPill summary={summary} />
        </div>

        <div className='mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center'>
          <TeamScorePanel team={summary.awayTeam} score={showScore ? summary.awayScore : null} />
          <div className='text-muted-foreground text-center text-sm font-semibold uppercase tracking-wider'>
            {summary.status === 'scheduled' ? 'vs' : 'at'}
          </div>
          <TeamScorePanel
            team={summary.homeTeam}
            score={showScore ? summary.homeScore : null}
            align='right'
          />
        </div>
      </section>

      {(summary.awayTotals.length > 0 || summary.homeTotals.length > 0) && (
        <section className='flex flex-col gap-3'>
          <h2 className='text-lg font-semibold'>Team totals</h2>
          <TeamTotalsTable
            awayTeam={summary.awayTeam}
            homeTeam={summary.homeTeam}
            awayTotals={summary.awayTotals}
            homeTotals={summary.homeTotals}
          />
        </section>
      )}

      {summary.leaders.length > 0 && (
        <section className='flex flex-col gap-3'>
          <h2 className='text-lg font-semibold'>Leaders</h2>
          <div className='grid gap-3 sm:grid-cols-3'>
            {summary.leaders.map(leader => (
              <LeaderCard key={`${leader.category}-${leader.athleteId}`} leader={leader} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatusPill({summary}: {summary: GameSummary}) {
  const label =
    summary.status === 'live' && summary.period
      ? `${summary.statusDetail}${summary.clock ? ` · ${summary.clock}` : ''}`
      : summary.statusDetail

  return (
    <span
      className={cn(
        'w-fit rounded-full border px-3 py-1 text-sm font-medium',
        summary.status === 'live' && 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300',
        summary.status === 'final' && 'border-border bg-muted text-muted-foreground',
        summary.status === 'scheduled' &&
          'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
      )}
    >
      {label}
    </span>
  )
}

function TeamScorePanel({
  team,
  score,
  align = 'left',
}: {
  team: ScoreboardTeam | null
  score: number | null
  align?: 'left' | 'right'
}) {
  const body = (
    <>
      {team?.logo ? (
        <Image
          src={team.logo}
          alt={`${team.displayName} logo`}
          width={64}
          height={64}
          className='size-14 object-contain sm:size-16'
        />
      ) : (
        <div className='bg-muted size-14 rounded-full sm:size-16' />
      )}
      <div className={cn('min-w-0', align === 'right' && 'md:text-right')}>
        <p className='text-xl font-semibold'>{team?.abbreviation ?? 'TBD'}</p>
        <p className='text-muted-foreground truncate text-sm'>
          {team?.displayName ?? 'To be determined'}
        </p>
      </div>
      {score !== null ? <p className='text-4xl font-semibold tabular-nums'>{score}</p> : null}
    </>
  )

  const className = cn(
    'flex min-w-0 items-center gap-3',
    align === 'right' && 'md:flex-row-reverse',
  )

  if (!team?.id) {
    return <div className={className}>{body}</div>
  }

  return (
    <Link href={`/teams/${team.id}`} className={cn(className, 'hover:opacity-90')}>
      {body}
    </Link>
  )
}

function TeamTotalsTable({
  awayTeam,
  homeTeam,
  awayTotals,
  homeTotals,
}: {
  awayTeam: ScoreboardTeam | null
  homeTeam: ScoreboardTeam | null
  awayTotals: TeamStatLine[]
  homeTotals: TeamStatLine[]
}) {
  const labels = mergeStatLabels(awayTotals, homeTotals)
  if (labels.length === 0) return null

  const awayByName = new Map(awayTotals.map(stat => [stat.name, stat.displayValue]))
  const homeByName = new Map(homeTotals.map(stat => [stat.name, stat.displayValue]))

  return (
    <div className='border-border overflow-x-auto rounded-xl border'>
      <table className='w-full min-w-md text-sm'>
        <thead className='bg-muted/40 text-muted-foreground'>
          <tr>
            <th className='px-3 py-2 text-left font-medium'>Stat</th>
            <th className='px-3 py-2 text-right font-medium'>
              {awayTeam?.abbreviation ?? 'Away'}
            </th>
            <th className='px-3 py-2 text-right font-medium'>
              {homeTeam?.abbreviation ?? 'Home'}
            </th>
          </tr>
        </thead>
        <tbody>
          {labels.map(stat => (
            <tr key={stat.name} className='border-border border-t'>
              <td className='px-3 py-2'>{stat.label}</td>
              <td className='px-3 py-2 text-right tabular-nums'>
                {awayByName.get(stat.name) ?? '—'}
              </td>
              <td className='px-3 py-2 text-right tabular-nums'>
                {homeByName.get(stat.name) ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LeaderCard({leader}: {leader: GameLeader}) {
  return (
    <div className='bg-card border-border flex items-center gap-3 rounded-xl border p-3'>
      {leader.headshot ? (
        <Image
          src={leader.headshot}
          alt={leader.athleteName}
          width={48}
          height={48}
          className='size-12 rounded-full object-cover'
        />
      ) : (
        <div className='bg-muted size-12 rounded-full' />
      )}
      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs uppercase tracking-wider'>{leader.displayName}</p>
        <p className='truncate font-semibold'>{leader.shortName ?? leader.athleteName}</p>
        <p className='text-muted-foreground text-sm'>
          {leader.value}
          {leader.teamAbbreviation ? ` · ${leader.teamAbbreviation}` : ''}
        </p>
      </div>
    </div>
  )
}

function mergeStatLabels(awayTotals: TeamStatLine[], homeTotals: TeamStatLine[]) {
  const seen = new Set<string>()
  const labels: TeamStatLine[] = []

  for (const stat of [...awayTotals, ...homeTotals]) {
    if (seen.has(stat.name)) continue
    seen.add(stat.name)
    labels.push(stat)
  }

  return labels
}
