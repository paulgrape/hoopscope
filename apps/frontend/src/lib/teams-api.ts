const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export type TeamSummary = {
  id: string
  name: string
  abbreviation: string
  displayName: string
  logo: string | null
  color: string | null
  alternateColor: string | null
  location: string
}

export type TeamDetails = TeamSummary & {
  record: string | null
}

export type TeamRosterPlayer = {
  id: string
  fullName: string
  jersey: string | null
  position: string | null
  headshot: string | null
  age: number | null
  experience: number
}

export type SeasonType = 'regular' | 'playoffs'

export type TeamSeasonStatPlayer = {
  id: string
  fullName: string
  jersey: string | null
  position: string | null
  headshot: string | null
  gp: number
  min: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  tov: number
  fgPct: number
  threePointPct: number
  freeThrowPct: number
}

export type TeamSeasonStatsResponse = {
  season: number
  seasonLabel: string
  seasonType: SeasonType
  participated: boolean
  players: TeamSeasonStatPlayer[]
}

export type SeasonOption = {
  value: number
  label: string
}

const SEASON_HISTORY_COUNT = 10

export function formatSeasonLabel(season: number): string {
  return `${season - 1}–${String(season).slice(-2)}`
}

export function buildSeasonOptions(currentSeason: number): SeasonOption[] {
  return Array.from({length: SEASON_HISTORY_COUNT}, (_, index) => {
    const value = currentSeason - index
    return {value, label: formatSeasonLabel(value)}
  })
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

export async function getTeams(): Promise<TeamSummary[]> {
  return request<TeamSummary[]>('/teams')
}

export async function getTeam(teamId: string): Promise<TeamDetails> {
  return request<TeamDetails>(`/teams/${teamId}`)
}

export async function getTeamRoster(teamId: string): Promise<TeamRosterPlayer[]> {
  return request<TeamRosterPlayer[]>(`/teams/${teamId}/roster`)
}

type TeamSeasonStatsOptions = {
  season?: number
  seasonType?: SeasonType
}

export async function getTeamSeasonStats(
  teamId: string,
  options: TeamSeasonStatsOptions = {},
): Promise<TeamSeasonStatsResponse> {
  const params = new URLSearchParams()
  if (options.season != null) params.set('season', String(options.season))
  if (options.seasonType) params.set('seasonType', options.seasonType)

  const query = params.toString()
  const path = query ? `/teams/${teamId}/stats?${query}` : `/teams/${teamId}/stats`
  return request<TeamSeasonStatsResponse>(path)
}
