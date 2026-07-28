import type {LivePlayEvent, ReplayTimelineEntry} from '@/lib/games-api'

export const REGULATION_PERIODS = 4
export const REGULATION_PERIOD_SECONDS = 12 * 60
export const OVERTIME_PERIOD_SECONDS = 5 * 60

export type PeriodSegment = {
  period: number
  label: string
  startSeconds: number
  endSeconds: number
}

export type PeriodScoreRow = {
  period: number
  label: string
  home: number
  away: number
}

export type TeamSide = 'home' | 'away'

export type ScoringEventKind = 'ft' | '2pt' | '3pt'

export type ScoringEvent = {
  playIndex: number
  elapsedSeconds: number
  team: TeamSide
  points: number
  kind: ScoringEventKind
  homeScore: number
  awayScore: number
}

export type ReplayInsights = {
  leadChanges: number
  ties: number
  biggestHomeLead: number
  biggestAwayLead: number
  run: {team: TeamSide | null; points: number}
  homeShots: ShotSplit
  awayShots: ShotSplit
  differential: {elapsedSeconds: number; diff: number}[]
}

export type ShotSplit = {
  freeThrows: number
  twos: number
  threes: number
  points: number
}

export function periodDuration(period: number) {
  return period <= REGULATION_PERIODS ? REGULATION_PERIOD_SECONDS : OVERTIME_PERIOD_SECONDS
}

export function periodLabel(period: number) {
  if (period <= REGULATION_PERIODS) return `Q${period}`
  const overtime = period - REGULATION_PERIODS
  return overtime === 1 ? 'OT' : `${overtime}OT`
}

export function periodStartSeconds(period: number) {
  let start = 0
  for (let earlier = 1; earlier < period; earlier += 1) {
    start += periodDuration(earlier)
  }
  return start
}

export function clockToSeconds(clock: string): number | null {
  if (clock.includes(':')) {
    const [minutes, seconds] = clock.split(':').map(Number)
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null
    return minutes * 60 + seconds
  }

  const seconds = Number(clock)
  return Number.isFinite(seconds) ? seconds : null
}

export function formatGameClock(totalSeconds: number) {
  const roundedSeconds = Math.max(0, Math.ceil(totalSeconds))
  const minutes = Math.floor(roundedSeconds / 60)
  const seconds = roundedSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function totalGameSeconds(timeline: ReplayTimelineEntry[]) {
  const lastPeriod = timeline.reduce((period, entry) => Math.max(period, entry.period), REGULATION_PERIODS)
  return periodStartSeconds(lastPeriod) + periodDuration(lastPeriod)
}

export function periodSegments(timeline: ReplayTimelineEntry[]): PeriodSegment[] {
  const lastPeriod = timeline.reduce((period, entry) => Math.max(period, entry.period), REGULATION_PERIODS)

  return Array.from({length: lastPeriod}, (_, index) => {
    const period = index + 1
    const startSeconds = periodStartSeconds(period)

    return {
      period,
      label: periodLabel(period),
      startSeconds,
      endSeconds: startSeconds + periodDuration(period)
    }
  })
}

/** Last play that had already happened at the requested game time. */
export function playIndexAtElapsed(timeline: ReplayTimelineEntry[], elapsedSeconds: number) {
  if (timeline.length === 0) return 0

  let low = 0
  let high = timeline.length - 1
  let match = 0

  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    if (timeline[middle].elapsedSeconds <= elapsedSeconds) {
      match = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }

  return match
}

export function elapsedForPlayIndex(timeline: ReplayTimelineEntry[], playIndex: number) {
  if (timeline.length === 0) return 0
  const index = Math.min(Math.max(0, playIndex), timeline.length - 1)
  return timeline[index].elapsedSeconds
}

/** Game clock label for an absolute elapsed time, e.g. 800s -> Q2 10:40. */
export function clockLabelAtElapsed(elapsedSeconds: number, lastPeriod = REGULATION_PERIODS) {
  let period = 1
  let remaining = Math.max(0, elapsedSeconds)

  while (period < lastPeriod && remaining >= periodDuration(period)) {
    remaining -= periodDuration(period)
    period += 1
  }

  const clockRemaining = Math.max(0, periodDuration(period) - remaining)
  return `${periodLabel(period)} ${formatGameClock(clockRemaining)}`
}

export function periodScoresFromPlays(plays: LivePlayEvent[]): PeriodScoreRow[] {
  const cumulativeByPeriod = new Map<number, {home: number; away: number}>()

  for (const play of plays) {
    cumulativeByPeriod.set(play.period, {home: play.homeScore, away: play.awayScore})
  }

  let previousHome = 0
  let previousAway = 0

  return [...cumulativeByPeriod.keys()]
    .sort((first, second) => first - second)
    .map(period => {
      const cumulative = cumulativeByPeriod.get(period) ?? {home: previousHome, away: previousAway}
      const row = {
        period,
        label: periodLabel(period),
        home: cumulative.home - previousHome,
        away: cumulative.away - previousAway
      }

      previousHome = cumulative.home
      previousAway = cumulative.away

      return row
    })
}

export function periodScoreRowsFromTotals(home: number[], away: number[]): PeriodScoreRow[] {
  const periodCount = Math.max(home.length, away.length)

  return Array.from({length: periodCount}, (_, index) => ({
    period: index + 1,
    label: periodLabel(index + 1),
    home: home[index] ?? 0,
    away: away[index] ?? 0
  }))
}

/**
 * Score changes come from the running totals, not from `scoringPlay`/`scoreValue`: free throws in
 * this archive carry `scoreValue: 0`, and missing plays make the score jump on unrelated events.
 */
export function scoringEvents(plays: LivePlayEvent[]): ScoringEvent[] {
  const events: ScoringEvent[] = []
  let previousHome = 0
  let previousAway = 0

  plays.forEach((play, playIndex) => {
    const homePoints = play.homeScore - previousHome
    const awayPoints = play.awayScore - previousAway

    if (homePoints > 0) events.push(toScoringEvent(play, playIndex, 'home', homePoints))
    if (awayPoints > 0) events.push(toScoringEvent(play, playIndex, 'away', awayPoints))

    previousHome = play.homeScore
    previousAway = play.awayScore
  })

  return events
}

export function scoringKind(play: Pick<LivePlayEvent, 'text' | 'shortText'>, points: number): ScoringEventKind {
  const label = `${play.shortText ?? ''} ${play.text}`.toLowerCase()

  if (label.includes('free throw') || label.includes('+1 point')) return 'ft'
  if (label.includes('three point') || label.includes('+3 points')) return '3pt'
  if (label.includes('two point') || label.includes('+2 points')) return '2pt'
  if (points === 1) return 'ft'

  return points === 3 ? '3pt' : '2pt'
}

export function computeInsights(plays: LivePlayEvent[]): ReplayInsights {
  const insights: ReplayInsights = {
    leadChanges: 0,
    ties: 0,
    biggestHomeLead: 0,
    biggestAwayLead: 0,
    run: {team: null, points: 0},
    homeShots: emptyShotSplit(),
    awayShots: emptyShotSplit(),
    differential: []
  }

  let previousLeader: TeamSide | null = null
  let previousDiff = 0

  for (const play of plays) {
    const diff = play.homeScore - play.awayScore
    const leader = diff > 0 ? 'home' : diff < 0 ? 'away' : null

    if (leader && previousLeader && leader !== previousLeader) insights.leadChanges += 1
    if (leader === null && previousDiff !== 0) insights.ties += 1
    if (leader) previousLeader = leader

    insights.biggestHomeLead = Math.max(insights.biggestHomeLead, diff)
    insights.biggestAwayLead = Math.max(insights.biggestAwayLead, -diff)

    previousDiff = diff
  }

  for (const event of scoringEvents(plays)) {
    const split = event.team === 'home' ? insights.homeShots : insights.awayShots

    if (event.kind === 'ft') split.freeThrows += 1
    if (event.kind === '2pt') split.twos += 1
    if (event.kind === '3pt') split.threes += 1

    insights.run =
      insights.run.team === event.team
        ? {team: event.team, points: insights.run.points + event.points}
        : {team: event.team, points: event.points}

    insights.differential.push({
      elapsedSeconds: event.elapsedSeconds,
      diff: event.homeScore - event.awayScore
    })
  }

  const lastPlay = plays[plays.length - 1]
  insights.homeShots.points = lastPlay?.homeScore ?? 0
  insights.awayShots.points = lastPlay?.awayScore ?? 0

  return insights
}

export function findScoringPlayIndex(
  plays: (LivePlayEvent | undefined)[],
  fromIndex: number,
  direction: 'previous' | 'next'
): number | null {
  const step = direction === 'next' ? 1 : -1

  for (let index = fromIndex + step; index >= 0 && index < plays.length; index += step) {
    if (plays[index]?.scoringPlay) return index
  }

  return null
}

export function teamAccent(color: string | undefined | null) {
  if (!color) return undefined
  return color.startsWith('#') ? color : `#${color}`
}

function emptyShotSplit(): ShotSplit {
  return {freeThrows: 0, twos: 0, threes: 0, points: 0}
}

function toScoringEvent(play: LivePlayEvent, playIndex: number, team: TeamSide, points: number): ScoringEvent {
  return {
    playIndex,
    elapsedSeconds: play.elapsedSeconds,
    team,
    points,
    kind: scoringKind(play, points),
    homeScore: play.homeScore,
    awayScore: play.awayScore
  }
}
