const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

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

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getPlayer(playerId: string): Promise<PlayerProfile> {
  return request<PlayerProfile>(`/players/${playerId}`)
}

type PlayerSeasonStatsOptions = {
  season?: number
  seasonType?: SeasonType
}

export async function getPlayerSeasonStats(
  playerId: string,
  options: PlayerSeasonStatsOptions = {},
): Promise<PlayerSeasonStatsResponse> {
  const params = new URLSearchParams()
  if (options.season != null) params.set('season', String(options.season))
  if (options.seasonType) params.set('seasonType', options.seasonType)

  const query = params.toString()
  const path = query
    ? `/players/${playerId}/stats?${query}`
    : `/players/${playerId}/stats`

  return request<PlayerSeasonStatsResponse>(path)
}

export async function getPlayerCareerStats(
  playerId: string,
): Promise<PlayerCareerStatsResponse> {
  return request<PlayerCareerStatsResponse>(`/players/${playerId}/stats/career`)
}

export async function getPlayerNews(
  playerId: string,
  limit = 12,
): Promise<PlayerNewsArticle[]> {
  return request<PlayerNewsArticle[]>(`/players/${playerId}/news?limit=${limit}`)
}

export function getPlayerHref(playerId: string, teamId?: string): string {
  if (teamId) {
    return `/players/${playerId}?teamId=${teamId}`
  }

  return `/players/${playerId}`
}
