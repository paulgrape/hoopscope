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
  period: number
  clock: string
  text: string
  homeScore: number
  awayScore: number
}

export type LiveGameState = {
  id: string
  name: string
  date: string
  homeTeam: GameTeam
  awayTeam: GameTeam
  homeScore: number
  awayScore: number
  quarter: number
  clock: string
  lastPlay: string
  status: 'live' | 'final'
  playIndex: number
  totalPlays: number
  plays: LivePlayEvent[]
}

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

export async function getHistoricGames(): Promise<LiveGameState[]> {
  return apiFetch<LiveGameState[]>('/games/live')
}

export async function getHistoricGame(gameId: string): Promise<LiveGameState | null> {
  return apiFetch<LiveGameState | null>(`/games/live/${gameId}`)
}

export async function getSchedule(date: string, offsetMinutes: number): Promise<ScoreboardGame[]> {
  const params = new URLSearchParams({
    date,
    offsetMinutes: String(offsetMinutes)
  })

  return proxyFetch<ScoreboardGame[]>(`/api/games/schedule?${params.toString()}`)
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

  const payload = await proxyFetchOrNull<{date: string}>(`/api/games/schedule/nearest?${params.toString()}`)
  return payload?.date ?? null
}

export async function getServerGameSummary(gameId: string): Promise<GameSummary | null> {
  return apiFetchOrNull<GameSummary>(`/games/${gameId}`)
}

export async function getGameSummary(gameId: string): Promise<GameSummary | null> {
  return proxyFetchOrNull<GameSummary>(`/api/games/${gameId}`)
}

export function getTodayDateKey(): string {
  return formatDateKey(new Date())
}

export function getOffsetMinutesForDate(dateKey: string): number {
  return parseLocalDateKey(dateKey).getTimezoneOffset()
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
