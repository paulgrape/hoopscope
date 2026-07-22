import {apiFetch} from '@/lib/api-client'

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

export async function getTeams(): Promise<TeamSummary[]> {
  return apiFetch<TeamSummary[]>('/teams', {revalidate: 3600})
}

export async function getTeam(teamId: string): Promise<TeamDetails> {
  return apiFetch<TeamDetails>(`/teams/${teamId}`, {revalidate: 3600})
}

export async function getTeamRoster(teamId: string): Promise<TeamRosterPlayer[]> {
  return apiFetch<TeamRosterPlayer[]>(`/teams/${teamId}/roster`, {revalidate: 3600})
}

type TeamSeasonStatsOptions = {
  season?: number
  seasonType?: SeasonType
}

export async function getTeamSeasonStats(
  teamId: string,
  options: TeamSeasonStatsOptions = {}
): Promise<TeamSeasonStatsResponse> {
  const params = new URLSearchParams()
  if (options.season != null) params.set('season', String(options.season))
  if (options.seasonType) params.set('seasonType', options.seasonType)

  const query = params.toString()
  const path = query ? `/teams/${teamId}/stats?${query}` : `/teams/${teamId}/stats`
  return apiFetch<TeamSeasonStatsResponse>(path, {revalidate: 1800})
}
