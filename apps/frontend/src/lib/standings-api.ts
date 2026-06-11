const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export type PlayoffStatus = 'playoff' | 'play-in' | 'out'

export type StandingTeam = {
  id: string
  displayName: string
  shortName: string
  abbreviation: string
  logo: string | null
  color: string | null
  seed: number
  wins: number
  losses: number
  winPct: string
  gamesBehind: string
  streak: string
  home: string
  road: string
  vsDiv: string
  vsConf: string
  lastTen: string
  clincher: string | null
  playoffStatus: PlayoffStatus
}

export type ConferenceStandings = {
  id: string
  name: string
  abbreviation: string
  teams: StandingTeam[]
}

export type StandingsResponse = {
  season: string
  conferences: ConferenceStandings[]
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getStandings(): Promise<StandingsResponse> {
  return request<StandingsResponse>('/standings')
}
