const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

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

export const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getHistoricGames(): Promise<LiveGameState[]> {
  return request<LiveGameState[]>('/games/live')
}

export async function getHistoricGame(gameId: string): Promise<LiveGameState | null> {
  return request<LiveGameState | null>(`/games/live/${gameId}`)
}

export async function getSchedule(date: string, offsetMinutes: number): Promise<ScoreboardGame[]> {
  const params = new URLSearchParams({
    date,
    offsetMinutes: String(offsetMinutes),
  })

  const response = await fetch(`/api/games/schedule?${params.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load /games/schedule: ${response.status}`)
  }

  return response.json() as Promise<ScoreboardGame[]>
}

export async function getServerSchedule(
  date: string,
  offsetMinutes: number,
): Promise<ScoreboardGame[]> {
  const params = new URLSearchParams({
    date,
    offsetMinutes: String(offsetMinutes),
  })

  return request<ScoreboardGame[]>(`/games/schedule?${params.toString()}`)
}

export async function getNearestScheduleDate(
  date: string,
  offsetMinutes: number,
  direction: 'before' | 'after' = 'before',
): Promise<string | null> {
  const params = new URLSearchParams({
    date,
    offsetMinutes: String(offsetMinutes),
    direction,
  })

  const response = await fetch(`/api/games/schedule/nearest?${params.toString()}`, {
    cache: 'no-store',
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Failed to load /games/schedule/nearest: ${response.status}`)
  }

  const payload = (await response.json()) as {date: string}
  return payload.date
}

export async function getServerGameSummary(gameId: string): Promise<GameSummary | null> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
    cache: 'no-store',
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Failed to load /games/${gameId}: ${response.status}`)
  }

  return response.json() as Promise<GameSummary>
}

export async function getGameSummary(gameId: string): Promise<GameSummary | null> {
  const response = await fetch(`/api/games/${gameId}`, {
    cache: 'no-store',
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Failed to load /api/games/${gameId}: ${response.status}`)
  }

  return response.json() as Promise<GameSummary>
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
  return (
    Number.isFinite(date.getTime()) &&
    formatDateKey(date) === dateKey
  )
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
    day: 'numeric',
  }).format(parseLocalDateKey(dateKey))
}
