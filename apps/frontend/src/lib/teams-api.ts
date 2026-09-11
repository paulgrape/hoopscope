import {apiFetch, apiFetchOrNull} from '@/lib/api-client'

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
  currentSeason: number
  participated: boolean
  players: TeamSeasonStatPlayer[]
}

/** Number of seasons offered in the team stats year control. */
export const TEAM_SEASON_OPTION_COUNT = 25

export function formatSeasonLabel(season: number): string {
  const start = season - 1
  return `${start}–${String(season).slice(-2)}`
}

export function listTeamSeasonYears(currentSeason: number, count = TEAM_SEASON_OPTION_COUNT): number[] {
  return Array.from({length: count}, (_, index) => currentSeason - index)
}

export function parseSeasonQuery(value?: string): number | undefined {
  if (value == null || value.trim() === '') return undefined
  const season = Number(value)
  return Number.isInteger(season) ? season : undefined
}

export async function getTeams(): Promise<TeamSummary[]> {
  return apiFetch<TeamSummary[]>('/teams', {revalidate: 3600})
}

export async function getTeam(teamId: string): Promise<TeamDetails | null> {
  return apiFetchOrNull<TeamDetails>(`/teams/${teamId}`, {revalidate: 3600})
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
