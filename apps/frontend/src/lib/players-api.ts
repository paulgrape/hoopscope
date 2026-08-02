import {apiFetch, apiFetchOrNull} from '@/lib/api-client'

export type SeasonType = 'regular' | 'playoffs'

export type PlayerInjury = {
  status: string
  type: string | null
  detail: string | null
  returnDate: string | null
}

export type PlayerTeamSummary = {
  id: string
  abbreviation: string
  displayName: string
}

export type PlayerProfile = {
  id: string
  fullName: string
  jersey: string | null
  position: string | null
  headshot: string | null
  age: number | null
  height: string | null
  weight: string | null
  birthPlace: string | null
  experience: number
  college: string | null
  active: boolean | null
  status: string | null
  latestTeam: PlayerTeamSummary | null
  injury: PlayerInjury | null
}

export type PlayerSeasonAverages = {
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

export type PlayerSeasonStatsResponse = {
  season: number
  seasonLabel: string
  seasonType: SeasonType
  participated: boolean
  averages: PlayerSeasonAverages | null
}

export type PlayerCareerSeasonStats = {
  season: number
  seasonLabel: string
  seasonType: SeasonType
  teamId: string | null
  teamAbbr: string | null
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

export type PlayerCareerStatsResponse = {
  seasons: PlayerCareerSeasonStats[]
}

export type PlayerNewsArticle = {
  id: number
  type: string
  headline: string
  description: string
  published: string | null
  imageUrl: string | null
  imageCaption: string | null
  url: string | null
  byline: string | null
  teams: string[]
}

export async function getPlayer(playerId: string): Promise<PlayerProfile | null> {
  return apiFetchOrNull<PlayerProfile>(`/players/${playerId}`, {revalidate: 3600})
}

type PlayerSeasonStatsOptions = {
  season?: number
  seasonType?: SeasonType
}

export async function getPlayerSeasonStats(
  playerId: string,
  options: PlayerSeasonStatsOptions = {}
): Promise<PlayerSeasonStatsResponse> {
  const params = new URLSearchParams()
  if (options.season != null) params.set('season', String(options.season))
  if (options.seasonType) params.set('seasonType', options.seasonType)

  const query = params.toString()
  const path = query ? `/players/${playerId}/stats?${query}` : `/players/${playerId}/stats`

  return apiFetch<PlayerSeasonStatsResponse>(path, {revalidate: 1800})
}

export async function getPlayerCareerStats(playerId: string): Promise<PlayerCareerStatsResponse> {
  return apiFetch<PlayerCareerStatsResponse>(`/players/${playerId}/stats/career`, {
    revalidate: 3600
  })
}

export async function getPlayerNews(playerId: string, limit = 6): Promise<PlayerNewsArticle[]> {
  return apiFetch<PlayerNewsArticle[]>(`/players/${playerId}/news?limit=${limit}`, {
    revalidate: 600
  })
}

export function getEspnPlayerNewsHref(playerId: string, fullName: string): string {
  const slug = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const id = String(playerId)
  return `https://www.espn.com/nba/player/news/_/id/${id}/${slug || id}`
}

export function getPlayerHref(playerId: string, teamId?: string): string {
  if (teamId) {
    return `/players/${playerId}?teamId=${teamId}`
  }

  return `/players/${playerId}`
}
