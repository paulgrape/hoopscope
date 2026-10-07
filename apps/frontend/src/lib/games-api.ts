import {apiFetch, apiFetchOrNull, proxyFetch, proxyFetchOrNull} from '@/lib/api-client'

export {SOCKET_BASE_URL} from '@/lib/api-client'

export type GameTeam = {
  id: string
  name: string
  abbreviation: string
  logo: string
  color: string
}

export type LivePlayEvent = {
  id: string
  sequenceNumber: number
  period: number
  clock: string
  elapsedSeconds: number
  text: string
  shortText?: string
  scoringPlay: boolean
  scoreValue: number
  teamId?: string
  homeScore: number
  awayScore: number
}

export type ReplayTimelineEntry = {
  index: number
  period: number
  elapsedSeconds: number
}

export type ReplayPlayerStat = {
  name: string
  points: number
  rebounds: number
  assists: number
  minutes: string
}

export type LiveGameState = {
  id: string
  name: string
  date: string
  venue?: string
  homeTeam: GameTeam
  awayTeam: GameTeam
  homeScore: number
  awayScore: number
  quarter: number
  clock: string
  lastPlay: string
  status: 'live' | 'final'
  paused: boolean
  playIndex: number
  totalPlays: number
  plays: LivePlayEvent[]
  timeline: ReplayTimelineEntry[]
  periodScores?: {
    home: number[]
    away: number[]
  }
  finalPlayers?: {
    home: ReplayPlayerStat[]
    away: ReplayPlayerStat[]
  }
}

export type GameSeasonType = 'preseason' | 'regular' | 'playoffs' | 'play-in'

export type ScoreboardTeam = {
  id: string
  name: string
  displayName: string
  abbreviation: string
  logo: string | null
  color: string | null
}

export type ScoreboardGame = {
  id: string
  name: string
  shortName: string | null
  date: string
  seasonType: GameSeasonType | null
  status: 'scheduled' | 'live' | 'final'
  statusDetail: string
  homeTeam: ScoreboardTeam | null
  awayTeam: ScoreboardTeam | null
  homeScore: number | null
  awayScore: number | null
  period: number | null
  clock: string | null
  venue: string | null
}

export type TeamStatLine = {
  name: string
  label: string
  displayValue: string
}

export type GameLeader = {
  category: string
  displayName: string
  athleteId: string | null
  athleteName: string
  shortName: string | null
  headshot: string | null
  teamId: string | null
  teamAbbreviation: string | null
  value: string
  summary: string | null
}

export type BoxScorePlayer = {
  athleteId: string | null
  name: string
  shortName: string | null
  jersey: string | null
  position: string | null
  starter: boolean
  minutes: string
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

export type GameSummary = {
  id: string
  name: string
  shortName: string | null
  date: string
  seasonType: GameSeasonType | null
  status: 'scheduled' | 'live' | 'final'
  statusDetail: string
  period: number | null
  clock: string | null
  venue: string | null
  homeTeam: ScoreboardTeam | null
  awayTeam: ScoreboardTeam | null
  homeScore: number | null
  awayScore: number | null
  periodScores: {
    home: number[]
    away: number[]
  }
  homeTotals: TeamStatLine[]
  awayTotals: TeamStatLine[]
  homePlayers: BoxScorePlayer[]
  awayPlayers: BoxScorePlayer[]
  leaders: GameLeader[]
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const BROWSER_REFRESH = {timeoutMs: 5000, retries: 1}

export async function getHistoricGames(): Promise<LiveGameState[]> {
  return apiFetch<LiveGameState[]>('/games/live')
}

export async function getHistoricGame(gameId: string): Promise<LiveGameState | null> {
  return apiFetchOrNull<LiveGameState>(`/games/live/${gameId}`)
}

export async function getSchedule(date: string, offsetMinutes: number): Promise<ScoreboardGame[]> {
  const params = new URLSearchParams({
    date,
    offsetMinutes: String(offsetMinutes)
  })

  return proxyFetch<ScoreboardGame[]>(`/api/games/schedule?${params.toString()}`, BROWSER_REFRESH)
}

export async function getServerSchedule(date: string, offsetMinutes: number): Promise<ScoreboardGame[]> {
  const params = new URLSearchParams({
    date,
    offsetMinutes: String(offsetMinutes)
  })

  return apiFetch<ScoreboardGame[]>(`/games/schedule?${params.toString()}`)
}

export async function getNearestScheduleDate(
  date: string,
  offsetMinutes: number,
  direction: 'before' | 'after' = 'before'
): Promise<string | null> {
  const params = new URLSearchParams({
    date,
    offsetMinutes: String(offsetMinutes),
    direction
  })

  const payload = await proxyFetchOrNull<{date: string}>(
    `/api/games/schedule/nearest?${params.toString()}`,
    BROWSER_REFRESH
  )
  return payload?.date ?? null
}

export async function getServerGameSummary(gameId: string): Promise<GameSummary | null> {
  return apiFetchOrNull<GameSummary>(`/games/${gameId}`)
}

export async function getGameSummary(gameId: string): Promise<GameSummary | null> {
  return proxyFetchOrNull<GameSummary>(`/api/games/${gameId}`, BROWSER_REFRESH)
}

export function getTodayDateKey(): string {
  return formatDateKey(new Date())
}

export function getOffsetMinutesForDate(dateKey: string): number {
  return parseLocalDateKey(dateKey).getTimezoneOffset()
}

const MAX_IANA_TIME_ZONE_LENGTH = 100

export type ScheduleSeed = {
  date: string
  today: string
  offsetMinutes: number
  timeZone: string
}

/** Civil date in an IANA zone, as YYYY-MM-DD. */
export function getDateKeyInTimeZone(timeZone: string, now = new Date()): string {
  const clock = zonedClock(timeZone, now)
  const month = String(clock.month).padStart(2, '0')
  const day = String(clock.day).padStart(2, '0')
  return `${clock.year}-${month}-${day}`
}

/**
 * Minutes as reported by Date#getTimezoneOffset() at local midnight of dateKey.
 * Re-checks the instant so a DST boundary uses the offset in effect at midnight.
 */
export function getOffsetMinutesInTimeZone(dateKey: string, timeZone: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcMidnight = Date.UTC(year, month - 1, day)
  const guessedOffset = offsetMinutesAt(timeZone, new Date(utcMidnight))
  const localMidnight = new Date(utcMidnight + guessedOffset * 60_000)
  const offsetAtMidnight = offsetMinutesAt(timeZone, localMidnight)
  if (offsetAtMidnight === guessedOffset) return offsetAtMidnight
  return offsetMinutesAt(timeZone, new Date(utcMidnight + offsetAtMidnight * 60_000))
}

/** True only when the seed was fetched with the offset the browser would send. */
export function seedOffsetMatchesBrowser(initialOffsetMinutes: number | undefined, dateKey: string): boolean {
  return typeof initialOffsetMinutes === 'number' && initialOffsetMinutes === getOffsetMinutesForDate(dateKey)
}

/**
 * When the page was opened without ?date=, a server "today" that is not the
 * browser's today should be replaced. An explicit date query stays put.
 */
export function browserTodayOverride(
  urlDate: string | null,
  initialDate: string | undefined,
  selectedDate: string,
  browserToday: string
): string | null {
  if (isValidDateKey(urlDate)) return null
  if (!isValidDateKey(initialDate)) return null
  if (selectedDate !== initialDate || browserToday === initialDate) return null
  return browserToday
}

/** Calendar day and offset for a schedule seed. An IANA hint wins over the machine zone. */
export function resolveScheduleSeed(
  timeZone: string | null | undefined,
  explicitDate?: string | null,
  now = new Date()
): ScheduleSeed {
  const zone = usableTimeZone(timeZone)
  const today = zone ? getDateKeyInTimeZone(zone, now) : formatDateKey(now)
  const date = isValidDateKey(explicitDate) ? explicitDate : today
  return {
    date,
    today,
    offsetMinutes: zone ? getOffsetMinutesInTimeZone(date, zone) : getOffsetMinutesForDate(date),
    timeZone: zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

function usableTimeZone(timeZone: string | null | undefined): string | undefined {
  if (!timeZone || timeZone.length > MAX_IANA_TIME_ZONE_LENGTH) return undefined
  try {
    Intl.DateTimeFormat('en-US', {timeZone})
    return timeZone
  } catch {
    return undefined
  }
}

function zonedClock(timeZone: string, instant: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(instant)

  const value: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {}
  for (const part of parts) {
    if (part.type !== 'literal') value[part.type] = part.value
  }

  let year = Number(value.year)
  let month = Number(value.month)
  let day = Number(value.day)
  let hour = Number(value.hour)
  // Some engines format midnight as 24:00 on the ending civil date.
  if (hour === 24) {
    hour = 0
    const rolled = new Date(Date.UTC(year, month - 1, day + 1))
    year = rolled.getUTCFullYear()
    month = rolled.getUTCMonth() + 1
    day = rolled.getUTCDate()
  }

  return {year, month, day, hour, minute: Number(value.minute), second: Number(value.second)}
}

function offsetMinutesAt(timeZone: string, instant: Date): number {
  const clock = zonedClock(timeZone, instant)
  const asUtc = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second)
  return Math.round((instant.getTime() - asUtc) / 60_000)
}

export function isValidDateKey(dateKey: string | null | undefined): dateKey is string {
  if (!dateKey || !DATE_KEY_PATTERN.test(dateKey)) return false
  const date = parseLocalDateKey(dateKey)
  return Number.isFinite(date.getTime()) && formatDateKey(date) === dateKey
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseLocalDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return formatDateKey(date)
}

export function parseLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatCompactDateLabel(dateKey: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'long',
    day: 'numeric'
  }).format(parseLocalDateKey(dateKey))
}
