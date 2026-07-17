'use client'

import {useEffect, useState} from 'react'

import {ShotHeatmapCourt} from '@/components/shot-heatmap-court'
import type {ShotHeatmapResponse} from '@/lib/shots-api'

type CatalogPlayer = {
  id: string
  name: string
  file: string
  season: string
  seasonType: string
  fga: number
}

type Catalog = {
  season: string
  seasonType: string
  players: CatalogPlayer[]
}

const DATA_BASE = '/data/shot-heatmaps'

export function ShotHeatmapSandbox() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [playerId, setPlayerId] = useState<string>('')
  const [data, setData] = useState<ShotHeatmapResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      try {
        const response = await fetch(`${DATA_BASE}/index.json`, {cache: 'no-store'})
        if (!response.ok) {
          throw new Error(
            `Missing ${DATA_BASE}/index.json (${response.status}). Run: npm run download:shot-heatmaps in apps/backend`,
          )
        }
        const json = (await response.json()) as Catalog
        if (cancelled) return
        setCatalog(json)
        const initial =
          json.players.find(p => p.id === '201939')?.id ?? json.players[0]?.id ?? ''
        setPlayerId(initial)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setLoading(false)
        }
      }
    }

    void loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!playerId || !catalog) return

    const entry = catalog.players.find(p => p.id === playerId)
    if (!entry) return

    let cancelled = false
    setLoading(true)
    setError(null)

    async function loadPlayer() {
      try {
        const response = await fetch(`${DATA_BASE}/${entry!.file}`, {cache: 'no-store'})
        if (!response.ok) {
          throw new Error(`Failed to load ${entry!.file}: ${response.status}`)
        }
        const json = (await response.json()) as ShotHeatmapResponse
        if (cancelled) return
        setData(json)
      } catch (err) {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPlayer()
    return () => {
      cancelled = true
    }
  }, [playerId, catalog])

  const attempts = data?.shots.length ?? 0
  const makes = data?.shots.filter(shot => shot.made).length ?? 0
  const fgPct = attempts > 0 ? (makes / attempts) * 100 : 0
  const season = data?.season ?? catalog?.season ?? '—'
  const seasonType = data?.seasonType ?? catalog?.seasonType ?? '—'
  const playerLabel = data?.playerName ?? catalog?.players.find(p => p.id === playerId)?.name ?? 'Player'

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <header className='flex flex-col gap-3'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Sandbox</p>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div className='flex flex-col gap-2'>
            <h1 className='text-2xl font-semibold sm:text-3xl'>
              {playerLabel} — Shot Heatmap
            </h1>
            <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
              {season} {seasonType} FGAs from cached JSON — color is shrink-adjusted FG% vs zone
              league average; brightness is volume.
            </p>
          </div>

          <label className='flex flex-col gap-1 text-sm'>
            <span className='text-muted-foreground'>Player</span>
            <select
              className='border-border bg-background min-w-56 rounded-lg border px-3 py-2'
              value={playerId}
              disabled={!catalog || catalog.players.length === 0}
              onChange={event => setPlayerId(event.target.value)}
            >
              {(catalog?.players ?? []).map(player => (
                <option
                  key={player.id}
                  value={player.id}
                >
                  {player.name} ({player.fga} FGA)
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error ? (
        <p className='text-destructive text-sm'>{error}</p>
      ) : loading && !data ? (
        <p className='text-muted-foreground text-sm'>Loading shot chart…</p>
      ) : data && attempts > 0 ? (
        <section className='flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8'>
          <dl className='grid grid-cols-3 gap-3 text-sm sm:min-w-48 sm:grid-cols-1 sm:gap-4'>
            <div>
              <dt className='text-muted-foreground'>FGA</dt>
              <dd className='text-xl font-semibold'>{attempts}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>FGM</dt>
              <dd className='text-xl font-semibold'>{makes}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>FG%</dt>
              <dd className='text-xl font-semibold'>{fgPct.toFixed(1)}%</dd>
            </div>
            <div className='col-span-3 sm:col-span-1'>
              <dt className='text-muted-foreground'>League zones</dt>
              <dd className='text-xl font-semibold'>{data.leagueZones.length}</dd>
            </div>
          </dl>

          <ShotHeatmapCourt
            shots={data.shots}
            leagueZones={data.leagueZones}
          />
        </section>
      ) : (
        <p className='text-muted-foreground text-sm'>No shot chart data for this player.</p>
      )}
    </main>
  )
}
