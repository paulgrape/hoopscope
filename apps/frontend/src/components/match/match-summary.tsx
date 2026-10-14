'use client'

import {type BoxScoreLine, BoxScoreTable as BoxScoreTableBase} from '@/components/match/box-score-table'
import {ChangedValue} from '@/components/match/changed-value'
import {LiveBadge, formatLiveClock} from '@/components/match/live-status'
import {SeasonTypeKicker} from '@/components/match/season-type'
import {StickyScoreHeader} from '@/components/match/sticky-score-header'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
  type BoxScorePlayer,
  type GameLeader,
  type GameSummary,
  type ScoreboardTeam,
  type TeamStatLine,
  getGameSummary
} from '@/lib/games-api'
import {cn} from '@/lib/utils'
import Image from 'next/image'
import {useEffect, useState} from 'react'

const REFRESH_INTERVAL_MS = 60_000
const DISPLAY_LOCALE = 'en-US'

type MatchSummaryProps = {
  initialSummary: GameSummary
}

export function MatchSummary({initialSummary}: MatchSummaryProps) {
  const [summary, setSummary] = useState(initialSummary)

  const [prevInitialSummary, setPrevInitialSummary] = useState(initialSummary)
  if (initialSummary !== prevInitialSummary) {
    setPrevInitialSummary(initialSummary)
    setSummary(initialSummary)
  }

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
  const scoreAnnouncement =
    summary.awayScore != null && summary.homeScore != null
      ? `${summary.awayTeam?.displayName ?? 'Away'} ${summary.awayScore}, ${summary.homeTeam?.displayName ?? 'Home'} ${summary.homeScore}.`
      : ''
  const tipLabel = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(summary.date))

  return (
    <div className='flex flex-col [overflow-anchor:none] [&_*]:[overflow-anchor:none]'>
      <p
        className='sr-only'
        aria-live='polite'
      >
        {scoreAnnouncement}
      </p>
      <div className='bg-card border-border rounded-t-xl border border-b-0 px-4 pt-4 sm:px-6 sm:pt-6'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <SeasonTypeKicker
              seasonType={summary.seasonType}
              className='mb-1'
            />
            <p className='text-muted-foreground text-sm'>{tipLabel}</p>
            {summary.venue ? <p className='text-muted-foreground mt-1 text-sm'>{summary.venue}</p> : null}
          </div>
          <StatusPill summary={summary} />
        </div>
      </div>

      <StickyScoreHeader
        awayTeam={summary.awayTeam}
        homeTeam={summary.homeTeam}
        awayScore={showScore ? summary.awayScore : null}
        homeScore={showScore ? summary.homeScore : null}
        showVersus={summary.status === 'scheduled'}
        liveLabel={summary.status === 'live' ? formatLiveClock(summary) : null}
      />

      <div className='bg-card border-border rounded-b-xl border border-t-0 px-4 pb-4 sm:px-6 sm:pb-6'>
        <LineScore summary={summary} />
      </div>

      <div className='mt-6 flex flex-col gap-6 sm:mt-8 sm:gap-8'>
        {(summary.awayPlayers.length > 0 || summary.homePlayers.length > 0) && (
          <section className='flex flex-col gap-3'>
            <h2 className='text-lg font-semibold'>Box score</h2>
            <BoxScoreTabs summary={summary} />
          </section>
        )}

        {(summary.awayTotals.length > 0 || summary.homeTotals.length > 0) && (
          <section className='flex flex-col gap-3'>
            <h2 className='text-lg font-semibold'>Team totals</h2>
            <TeamTotalsComparison
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
            <div className='border-border divide-border grid divide-y rounded-xl border sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
              {summary.leaders.map(leader => (
                <LeaderCard
                  key={`${leader.category}-${leader.athleteId}`}
                  leader={leader}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatusPill({summary}: {summary: GameSummary}) {
  const label =
    summary.status === 'live'
      ? formatLiveClock(summary)
      : summary.status === 'scheduled'
        ? `Starts ${formatStartTime(new Date(summary.date))}`
        : summary.statusDetail

  if (summary.status === 'live') {
    return (
      <span className='inline-flex w-fit items-center gap-2'>
        <LiveBadge />
        <ChangedValue
          value={label}
          className='text-sm font-medium text-red-600 dark:text-red-300'
        >
          {label}
        </ChangedValue>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'w-fit rounded-full border px-3 py-1 text-sm font-medium',
        summary.status === 'final' && 'border-border bg-muted text-muted-foreground',
        summary.status === 'scheduled' && 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
      )}
    >
      <ChangedValue value={label}>{label}</ChangedValue>
    </span>
  )
}

function formatStartTime(date: Date) {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function LineScore({summary}: {summary: GameSummary}) {
  const awayPeriods = summary.periodScores?.away ?? []
  const homePeriods = summary.periodScores?.home ?? []
  const periodCount = Math.max(awayPeriods.length, homePeriods.length)
  if (periodCount === 0) return null

  const headers = Array.from({length: periodCount}, (_, index) => (index < 4 ? `Q${index + 1}` : `OT${index - 3}`))

  return (
    <div className='border-border mt-6 overflow-hidden rounded-lg border'>
      <table className='w-full text-sm'>
        <thead className='bg-muted/40 text-muted-foreground'>
          <tr>
            <th className='w-full px-3 py-2 text-left font-medium'>Team</th>
            {headers.map(label => (
              <th
                key={label}
                className='px-1.5 py-2 text-center font-medium sm:px-2'
              >
                {label}
              </th>
            ))}
            <th className='px-3 py-2 text-center font-medium'>T</th>
          </tr>
        </thead>
        <tbody>
          <LineScoreRow
            team={summary.awayTeam}
            periods={awayPeriods}
            periodCount={periodCount}
            total={summary.awayScore}
          />
          <LineScoreRow
            team={summary.homeTeam}
            periods={homePeriods}
            periodCount={periodCount}
            total={summary.homeScore}
          />
        </tbody>
      </table>
    </div>
  )
}

function LineScoreRow({
  team,
  periods,
  periodCount,
  total
}: {
  team: ScoreboardTeam | null
  periods: number[]
  periodCount: number
  total: number | null
}) {
  return (
    <tr className='border-border border-t'>
      <td className='px-3 py-2 font-medium'>{team?.abbreviation ?? '—'}</td>
      {Array.from({length: periodCount}, (_, index) => (
        <td
          key={index}
          className='px-1.5 py-2 text-center tabular-nums sm:px-2'
        >
          <ChangedValue value={periods[index] ?? '—'}>{periods[index] ?? '—'}</ChangedValue>
        </td>
      ))}
      <td className='px-3 py-2 text-center font-semibold tabular-nums'>
        <ChangedValue value={total ?? '—'}>{total ?? '—'}</ChangedValue>
      </td>
    </tr>
  )
}

function BoxScoreTabs({summary}: {summary: GameSummary}) {
  const awayLabel = summary.awayTeam?.name ?? summary.awayTeam?.abbreviation ?? 'Away'
  const homeLabel = summary.homeTeam?.name ?? summary.homeTeam?.abbreviation ?? 'Home'
  const defaultTab = summary.awayPlayers.length > 0 ? 'away' : summary.homePlayers.length > 0 ? 'home' : 'away'

  return (
    <Tabs
      defaultValue={defaultTab}
      className='gap-3'
    >
      <TabsList className='w-full sm:w-fit'>
        <TabsTrigger
          value='away'
          className='flex-1 sm:flex-none'
          disabled={summary.awayPlayers.length === 0}
        >
          {awayLabel}
        </TabsTrigger>
        <TabsTrigger
          value='home'
          className='flex-1 sm:flex-none'
          disabled={summary.homePlayers.length === 0}
        >
          {homeLabel}
        </TabsTrigger>
      </TabsList>
      <TabsContent value='away'>
        <BoxScoreTable
          team={summary.awayTeam}
          players={summary.awayPlayers}
        />
      </TabsContent>
      <TabsContent value='home'>
        <BoxScoreTable
          team={summary.homeTeam}
          players={summary.homePlayers}
        />
      </TabsContent>
    </Tabs>
  )
}

function BoxScoreTable({team, players}: {team: ScoreboardTeam | null; players: BoxScorePlayer[]}) {
  return (
    <BoxScoreTableBase
      lines={players.map(toBoxScoreLine)}
      emptyMessage={`No box score yet for ${team?.displayName ?? 'this team'}.`}
      showLineupGroups
    />
  )
}

function toBoxScoreLine(player: BoxScorePlayer): BoxScoreLine {
  return {
    id: player.athleteId ?? player.name,
    name: player.shortName ?? player.name,
    href: player.athleteId ? `/players/${player.athleteId}` : null,
    meta: player.position,
    starter: player.starter,
    minutes: player.minutes,
    points: player.points,
    rebounds: player.rebounds,
    assists: player.assists,
    steals: player.steals,
    blocks: player.blocks,
    turnovers: player.turnovers,
    fouls: player.fouls,
    fieldGoals: player.fieldGoals,
    threePointers: player.threePointers,
    freeThrows: player.freeThrows
  }
}

function TeamTotalsComparison({
  awayTeam,
  homeTeam,
  awayTotals,
  homeTotals
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
    <div className='border-border max-w-xl rounded-xl border'>
      <div className='bg-muted/40 text-muted-foreground grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 px-3 py-2 text-sm font-medium sm:px-4'>
        <span className='text-left'>{awayTeam?.abbreviation ?? 'Away'}</span>
        <span className='w-28 text-center sm:w-36'>Stat</span>
        <span className='text-right'>{homeTeam?.abbreviation ?? 'Home'}</span>
      </div>
      <ul>
        {labels.map(stat => {
          const awayValue = awayByName.get(stat.name) ?? '—'
          const homeValue = homeByName.get(stat.name) ?? '—'
          const leader = compareNumericLead(awayValue, homeValue)

          return (
            <li
              key={stat.name}
              className='border-border grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-t px-3 py-2.5 text-sm sm:px-4'
            >
              <span className={cn('text-left tabular-nums', leader === 'away' && 'font-semibold')}>{awayValue}</span>
              <span className='text-muted-foreground w-28 text-center sm:w-36'>{stat.label}</span>
              <span className={cn('text-right tabular-nums', leader === 'home' && 'font-semibold')}>{homeValue}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function LeaderCard({leader}: {leader: GameLeader}) {
  return (
    <div className='flex items-center gap-3 p-3 sm:flex-col sm:items-start sm:gap-3 sm:p-4'>
      <p className='text-muted-foreground hidden text-xs font-medium tracking-wider uppercase sm:block'>
        {leader.displayName}
      </p>

      <div className='flex min-w-0 flex-1 items-center gap-3 sm:w-full'>
        {leader.headshot ? (
          <Image
            src={leader.headshot}
            alt={leader.athleteName}
            width={48}
            height={48}
            className='size-11 shrink-0 rounded-full object-cover'
          />
        ) : (
          <div className='bg-muted size-11 shrink-0 rounded-full' />
        )}
        <div className='min-w-0 flex-1'>
          <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase sm:hidden'>
            {leader.displayName}
          </p>
          <p className='truncate font-semibold'>{leader.shortName ?? leader.athleteName}</p>
          {leader.teamAbbreviation ? <p className='text-muted-foreground text-sm'>{leader.teamAbbreviation}</p> : null}
        </div>
        <p className='shrink-0 text-2xl leading-none font-semibold tabular-nums'>{leader.value}</p>
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

/** Pure numbers only — skip FG-style "32-80" / percentages mixed with text. */
function compareNumericLead(awayValue: string, homeValue: string): 'away' | 'home' | null {
  const away = parseStrictNumber(awayValue)
  const home = parseStrictNumber(homeValue)
  if (away === null || home === null || away === home) return null
  return away > home ? 'away' : 'home'
}

function parseStrictNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}
