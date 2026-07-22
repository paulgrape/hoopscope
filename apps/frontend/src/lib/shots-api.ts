import {apiFetch} from '@/lib/api-client'

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

export async function getShotHeatmap(options: ShotHeatmapOptions): Promise<ShotHeatmapResponse> {
  const params = new URLSearchParams({
    playerId: options.playerId
  })

  if (options.season) params.set('season', options.season)
  if (options.seasonType) params.set('seasonType', options.seasonType)

  return apiFetch<ShotHeatmapResponse>(`/shots/heatmap?${params.toString()}`, {
    revalidate: 3600
  })
}
