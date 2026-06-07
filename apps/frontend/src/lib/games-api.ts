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

export const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store'
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
    offsetMinutes: String(offsetMinutes)
  })

  const response = await fetch(`/api/games/schedule?${params.toString()}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`Failed to load /games/schedule: ${response.status}`)
  }

  return response.json() as Promise<ScoreboardGame[]>
}
