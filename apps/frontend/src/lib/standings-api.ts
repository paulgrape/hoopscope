import {apiFetch} from '@/lib/api-client'

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

export async function getStandings(): Promise<StandingsResponse> {
  return apiFetch<StandingsResponse>('/standings', {revalidate: 900})
}
