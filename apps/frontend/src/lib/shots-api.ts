const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export type ShotPoint = {
  x: number
  y: number
  made: boolean
  value: 2 | 3
  distance: number
  zoneBasic: string
  zoneArea: string
  zoneRange: string
}

export type LeagueZoneAvg = {
  zoneBasic: string
  zoneArea: string
  zoneRange: string
  fga: number
  fgm: number
  fgPct: number
}

export type ShotHeatmapResponse = {
  playerId: string
  playerName: string
  season: string
  seasonType: string
  shots: ShotPoint[]
  leagueZones: LeagueZoneAvg[]
}

type ShotHeatmapOptions = {
  playerId: string
  season?: string
  seasonType?: string
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

export async function getShotHeatmap(
  options: ShotHeatmapOptions,
): Promise<ShotHeatmapResponse> {
  const params = new URLSearchParams({
    playerId: options.playerId,
  })

  if (options.season) params.set('season', options.season)
  if (options.seasonType) params.set('seasonType', options.seasonType)

  return request<ShotHeatmapResponse>(`/shots/heatmap?${params.toString()}`)
}
