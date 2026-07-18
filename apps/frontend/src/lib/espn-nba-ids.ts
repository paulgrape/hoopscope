import {readFile} from 'node:fs/promises'
import path from 'node:path'

import type {ShotHeatmapResponse} from '@/lib/shots-api'

export type EspnNbaPlayerMapFile = {
  generatedAt: string
  matches: Array<{espnId: string; nbaId: string; name: string}>
  unmatchedNba: Array<{nbaId: string; name: string}>
  byEspnId: Record<string, string>
}

const PUBLIC_DATA = path.join(process.cwd(), 'public', 'data')

async function readJsonFile<T>(relativePath: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(PUBLIC_DATA, relativePath), 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

let mapCache: EspnNbaPlayerMapFile | null | undefined

export async function getEspnNbaPlayerMap(): Promise<EspnNbaPlayerMapFile | null> {
  if (mapCache !== undefined) return mapCache
  mapCache = await readJsonFile<EspnNbaPlayerMapFile>('espn-nba-player-ids.json')
  return mapCache
}

export async function resolveNbaPlayerId(espnId: string): Promise<string | null> {
  const map = await getEspnNbaPlayerMap()
  if (!map) return null
  return map.byEspnId[espnId] ?? null
}

export async function getCachedShotHeatmap(
  nbaId: string,
): Promise<ShotHeatmapResponse | null> {
  return readJsonFile<ShotHeatmapResponse>(`shot-heatmaps/${nbaId}.json`)
}

export async function getCachedShotHeatmapForEspnPlayer(
  espnId: string,
): Promise<ShotHeatmapResponse | null> {
  const nbaId = await resolveNbaPlayerId(espnId)
  if (!nbaId) return null
  return getCachedShotHeatmap(nbaId)
}
