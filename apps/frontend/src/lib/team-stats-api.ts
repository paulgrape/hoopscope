import {apiFetch} from '@/lib/api-client'
import type {SeasonType} from '@/lib/teams-api'

export type TeamStatRow = {
  id: string
  name: string
  abbreviation: string
  logo: string | null
  gp: number
  off: number | null
  def: number | null
  net: number | null
  pace: number | null
  topg: number | null
  pts: number | null
  oppPts: number | null
  fgm: number | null
  fga: number | null
  fgPct: number | null
  threePm: number | null
  threePa: number | null
  threePct: number | null
  ftm: number | null
  fta: number | null
  ftPct: number | null
  oreb: number | null
  orPct: number | null
  ast: number | null
  astTo: number | null
  scEff: number | null
  shEff: number | null
  dr: number | null
  reb: number | null
  stl: number | null
  blk: number | null
  pf: number | null
  ptsDiff: number | null
  fgPctDiff: number | null
  threePctDiff: number | null
  ftPctDiff: number | null
  orDiff: number | null
  drDiff: number | null
  rebDiff: number | null
  astDiff: number | null
  toDiff: number | null
  stlDiff: number | null
  blkDiff: number | null
  pfDiff: number | null
}

export type TeamStatsResponse = {
  season: number
  seasonLabel: string
  seasonType: SeasonType
  currentSeason: number
  teams: TeamStatRow[]
}

export function teamStatsHref({season, seasonType}: {season: number; seasonType: SeasonType}) {
  const params = new URLSearchParams({season: String(season), seasonType})
  return `/team-stats?${params}`
}

export async function getTeamStats(
  options: {season?: number; seasonType?: SeasonType} = {}
): Promise<TeamStatsResponse> {
  const params = new URLSearchParams()
  if (options.season != null) params.set('season', String(options.season))
  if (options.seasonType) params.set('seasonType', options.seasonType)
  const query = params.toString()
  return apiFetch<TeamStatsResponse>(query ? `/team-stats?${query}` : '/team-stats', {
    timeoutMs: 30_000,
    revalidate: 1800
  })
}
