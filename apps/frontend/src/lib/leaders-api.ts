import {apiFetch} from '@/lib/api-client'
import type {SeasonType} from '@/lib/teams-api'

export const LEADER_STATS = [
  'pts',
  'reb',
  'ast',
  'stl',
  'blk',
  'min',
  'threePm',
  'fgPct',
  'threePointPct',
  'freeThrowPct'
] as const
export type LeaderStat = (typeof LEADER_STATS)[number]

export type Leader = {
  rank: number
  playerId: string
  name: string
  headshot: string | null
  position: string | null
  teamId: string | null
  teamAbbreviation: string | null
  teamName: string | null
  gamesPlayed: number
  value: number
}

export type LeaderCategory = {
  stat: LeaderStat
  label: string
  abbreviation: string
  format: 'average' | 'percent'
  qualification: {stat: 'gp' | 'fgm' | 'ftm' | 'threePmTotal'; minimum: number; teamGames: number}
  leaders: Leader[]
}

export type LeadersResponse = {
  season: number
  seasonLabel: string
  seasonType: SeasonType
  currentSeason: number
  categories: LeaderCategory[]
}

export function parseLeaderStat(value?: string): LeaderStat | undefined {
  return LEADER_STATS.find(stat => stat === value)
}

export function leadersHref({season, seasonType, stat}: {season: number; seasonType: SeasonType; stat?: LeaderStat}) {
  const params = new URLSearchParams({season: String(season), seasonType})
  if (stat) params.set('stat', stat)
  return `/leaders?${params}`
}

export async function getLeaders(
  options: {season?: number; seasonType?: SeasonType; stat?: LeaderStat; limit?: number} = {}
): Promise<LeadersResponse> {
  const params = new URLSearchParams()
  if (options.season != null) params.set('season', String(options.season))
  if (options.seasonType) params.set('seasonType', options.seasonType)
  if (options.stat) params.set('stat', options.stat)
  if (options.limit != null) params.set('limit', String(options.limit))
  const query = params.toString()
  return apiFetch<LeadersResponse>(query ? `/leaders?${query}` : '/leaders', {timeoutMs: 30_000, revalidate: 1800})
}
