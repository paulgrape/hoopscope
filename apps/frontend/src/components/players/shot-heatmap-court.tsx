'use client'

import {Button} from '@/components/ui/button'
import type {LeagueZoneAvg, ShotPoint} from '@/lib/shots-api'
import {cn} from '@/lib/utils'
import {useEffect, useMemo, useRef, useState} from 'react'

/** NBA half-court in feet (stats.nba LOC_* are tenths of a foot). */
const COURT_WIDTH_FT = 50
const COURT_LENGTH_FT = 47
const BASKET_Y_FT = 5.25
const HEX_SIZE = 2.5
const SQRT3 = Math.sqrt(3)

const TOP_VOLUME_2PT = 20
const TOP_VOLUME_3PT = 15
/** Beta-binomial prior strength (attempts worth of league average). */
const SHRINKAGE_K = 20
/** Clip relative efficiency color scale at ±15 percentage points. */
const REL_CLIP = 0.15

const CLOUD_COLS = 100
const CLOUD_ROWS = 94
const CLOUD_SIGMA_FT = 4.5
const CLOUD_DENSITY_FLOOR = 0.08
const CLOUD_BLUR_PX = 4

type VizMode = 'hex' | 'cloud'

type HexCell = {
  q: number
  r: number
  cx: number
  cy: number
  attempts: number
  makes: number
  threeAttempts: number
  leagueRateSum: number
}

type HoverInfo = {
  kind: 'hex' | 'cloud'
  makes: number
  attempts: number
  rawFg: number
  adjustedFg: number
  leagueFg: number
  relative: number
  threeHeavy: boolean
}

type ShotHeatmapCourtProps = {
  shots: ShotPoint[]
  leagueZones: LeagueZoneAvg[]
}

type LeagueLookup = {
  byFull: Map<string, number>
  byBasicArea: Map<string, number>
  byBasic: Map<string, number>
  overall: number
}

function buildLeagueLookup(zones: LeagueZoneAvg[]): LeagueLookup {
  const byFull = new Map<string, number>()
  const byBasicArea = new Map<string, {fgPctSum: number; fga: number}>()
  const byBasic = new Map<string, {fgPctSum: number; fga: number}>()
  let overallFgm = 0
  let overallFga = 0

  for (const zone of zones) {
    byFull.set(`${zone.zoneBasic}|${zone.zoneArea}|${zone.zoneRange}`, zone.fgPct)

    const areaKey = `${zone.zoneBasic}|${zone.zoneArea}`
    const area = byBasicArea.get(areaKey) ?? {fgPctSum: 0, fga: 0}
    area.fgPctSum += zone.fgPct * zone.fga
    area.fga += zone.fga
    byBasicArea.set(areaKey, area)

    const basic = byBasic.get(zone.zoneBasic) ?? {fgPctSum: 0, fga: 0}
    basic.fgPctSum += zone.fgPct * zone.fga
    basic.fga += zone.fga
    byBasic.set(zone.zoneBasic, basic)

    overallFgm += zone.fgm
    overallFga += zone.fga
  }

  const avgMap = (src: Map<string, {fgPctSum: number; fga: number}>) => {
    const out = new Map<string, number>()
    for (const [key, value] of src) {
      if (value.fga > 0) out.set(key, value.fgPctSum / value.fga)
    }
    return out
  }

  return {
    byFull,
    byBasicArea: avgMap(byBasicArea),
    byBasic: avgMap(byBasic),
    overall: overallFga > 0 ? overallFgm / overallFga : 0.45
  }
}

function leagueFgForShot(shot: ShotPoint, league: LeagueLookup): number {
  return (
    league.byFull.get(`${shot.zoneBasic}|${shot.zoneArea}|${shot.zoneRange}`) ??
    league.byBasicArea.get(`${shot.zoneBasic}|${shot.zoneArea}`) ??
    league.byBasic.get(shot.zoneBasic) ??
    league.overall
  )
}

function locToCourtFeet(shot: ShotPoint): {x: number; y: number} {
  return {
    x: shot.x / 10 + COURT_WIDTH_FT / 2,
    y: shot.y / 10 + BASKET_Y_FT
  }
}

function pixelToHex(x: number, y: number, size: number): {q: number; r: number} {
  const q = ((SQRT3 / 3) * x - (1 / 3) * y) / size
  const r = ((2 / 3) * y) / size
  return hexRound(q, r)
}

function hexToPixel(q: number, r: number, size: number): {x: number; y: number} {
  return {
    x: size * (SQRT3 * q + (SQRT3 / 2) * r),
    y: size * ((3 / 2) * r)
  }
}

function hexRound(q: number, r: number): {q: number; r: number} {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  const rs = Math.round(s)

  const qDiff = Math.abs(rq - q)
  const rDiff = Math.abs(rr - r)
  const sDiff = Math.abs(rs - s)

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs
  } else if (rDiff > sDiff) {
    rr = -rq - rs
  }

  return {q: rq, r: rr}
}

function hexagonPath(cx: number, cy: number, size: number): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`)
  }
  return points.join(' ')
}

function buildCourtGrid(): HexCell[] {
  const cells: HexCell[] = []
  const pad = HEX_SIZE

  for (let r = -2; r < 30; r++) {
    for (let q = -15; q < 30; q++) {
      const {x: cx, y: cy} = hexToPixel(q, r, HEX_SIZE)
      if (cx < -pad || cx > COURT_WIDTH_FT + pad || cy < -pad || cy > COURT_LENGTH_FT + pad) {
        continue
      }
      if (cx < 0 || cx > COURT_WIDTH_FT || cy < 0 || cy > COURT_LENGTH_FT) {
        continue
      }

      cells.push({
        q,
        r,
        cx,
        cy,
        attempts: 0,
        makes: 0,
        threeAttempts: 0,
        leagueRateSum: 0
      })
    }
  }

  return cells
}

function buildHexCells(shots: ShotPoint[], league: LeagueLookup): HexCell[] {
  const cells = buildCourtGrid()
  const byKey = new Map(cells.map(cell => [`${cell.q},${cell.r}`, cell]))

  for (const shot of shots) {
    const {x: px, y: py} = locToCourtFeet(shot)
    if (px < -1 || px > COURT_WIDTH_FT + 1 || py < -1 || py > COURT_LENGTH_FT + 2) {
      continue
    }

    const {q, r} = pixelToHex(px, py, HEX_SIZE)
    const key = `${q},${r}`
    let cell = byKey.get(key)
    if (!cell) {
      const {x: cx, y: cy} = hexToPixel(q, r, HEX_SIZE)
      cell = {
        q,
        r,
        cx,
        cy,
        attempts: 0,
        makes: 0,
        threeAttempts: 0,
        leagueRateSum: 0
      }
      byKey.set(key, cell)
      cells.push(cell)
    }

    cell.attempts += 1
    if (shot.made) cell.makes += 1
    if (shot.value === 3) cell.threeAttempts += 1
    cell.leagueRateSum += leagueFgForShot(shot, league)
  }

  return cells
}

function shrinkRate(makes: number, attempts: number, leagueFg: number): number {
  if (attempts <= 0) return leagueFg
  return (makes + SHRINKAGE_K * leagueFg) / (attempts + SHRINKAGE_K)
}

function relativeEfficiency(makes: number, attempts: number, leagueFg: number): {adjustedFg: number; relative: number} {
  const adjustedFg = shrinkRate(makes, attempts, leagueFg)
  return {adjustedFg, relative: adjustedFg - leagueFg}
}

function volumeWeight(volumeT: number): number {
  return Math.pow(Math.max(0, Math.min(1, volumeT)), 0.45)
}

function volumeTForAttempts(attempts: number, isThreeHeavy: boolean): number {
  if (attempts <= 2) return 0
  const top = isThreeHeavy ? TOP_VOLUME_3PT : TOP_VOLUME_2PT
  return Math.min(1, attempts / top)
}

/** Diverging blue (below league) → white → red (above league). */
function relativeRgb(relative: number, volumeT: number, opts: {boost?: boolean} = {}): [number, number, number] {
  const boost = opts.boost ?? false
  // Steeper response for cloud contrast
  const clip = boost ? REL_CLIP * 0.7 : REL_CLIP
  const t = Math.max(-1, Math.min(1, relative / clip))
  const bright = boost ? 0.62 + volumeWeight(volumeT) * 0.38 : 0.4 + volumeWeight(volumeT) * 0.6

  let r: number
  let g: number
  let b: number

  if (t < 0) {
    const u = -t
    // white → deeper blue
    r = 245 - u * (245 - (boost ? 30 : 55))
    g = 245 - u * (245 - (boost ? 90 : 110))
    b = 250 - u * (250 - (boost ? 230 : 200))
  } else {
    const u = t
    // white → hotter red
    r = 245
    g = 245 - u * (245 - (boost ? 20 : 36))
    b = 250 - u * (boost ? 250 : 250)
  }

  return [Math.round(r * bright), Math.round(g * bright), Math.round(b * bright)]
}

function relativeColor(relative: number, volumeT: number): string {
  const [r, g, b] = relativeRgb(relative, volumeT)
  return `rgb(${r} ${g} ${b})`
}

function cellOpacity(volumeT: number): number {
  return 0.22 + volumeWeight(volumeT) * 0.28
}

function cloudOpacity(volumeT: number): number {
  return 0.48 + volumeWeight(volumeT) * 0.42
}

function CourtGeometry() {
  return (
    <>
      <rect
        x={0}
        y={0}
        width={COURT_WIDTH_FT}
        height={COURT_LENGTH_FT}
      />
      <line
        x1={0}
        y1={0}
        x2={COURT_WIDTH_FT}
        y2={0}
      />
      <rect
        x={(COURT_WIDTH_FT - 16) / 2}
        y={0}
        width={16}
        height={19}
      />
      <circle
        cx={COURT_WIDTH_FT / 2}
        cy={19}
        r={6}
      />
      <path d={`M ${COURT_WIDTH_FT / 2 - 4} 5.25 A 4 4 0 0 1 ${COURT_WIDTH_FT / 2 + 4} 5.25`} />
      <circle
        cx={COURT_WIDTH_FT / 2}
        cy={BASKET_Y_FT}
        r={0.75}
      />
      <line
        x1={COURT_WIDTH_FT / 2 - 3}
        y1={4}
        x2={COURT_WIDTH_FT / 2 + 3}
        y2={4}
        strokeWidth={0.35}
      />
      <path
        d={`
          M 3 0
          L 3 14
          A 23.75 23.75 0 0 0 ${COURT_WIDTH_FT - 3} 14
          L ${COURT_WIDTH_FT - 3} 0
        `}
      />
    </>
  )
}

function CourtLinesOverlay() {
  return (
    <g className='pointer-events-none'>
      {/* Halo so lines stay readable over dark clouds / black court */}
      <g
        fill='none'
        stroke='currentColor'
        strokeWidth={0.38}
        strokeLinejoin='round'
        strokeLinecap='round'
        className='text-black/25 dark:text-black/70'
      >
        <CourtGeometry />
      </g>
      <g
        fill='none'
        stroke='currentColor'
        strokeWidth={0.18}
        strokeLinejoin='round'
        strokeLinecap='round'
        className='text-zinc-600 dark:text-zinc-100'
      >
        <CourtGeometry />
      </g>
    </g>
  )
}

function HeatmapLegend({hover}: {hover: HoverInfo | null}) {
  return (
    <div className='text-muted-foreground flex flex-col gap-2 text-xs sm:text-sm'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <div className='flex items-center gap-2'>
          <span>Below league</span>
          <span
            className='border-border/40 inline-block h-2 w-20 rounded-full border'
            style={{
              background: `linear-gradient(90deg, ${relativeColor(-REL_CLIP, 1)}, ${relativeColor(0, 1)}, ${relativeColor(REL_CLIP, 1)})`
            }}
          />
          <span>Above league</span>
        </div>
        <div className='flex items-center gap-2'>
          <span>Dim</span>
          <span
            className='border-border/40 inline-block h-2 w-16 rounded-full border'
            style={{
              background: `linear-gradient(90deg, ${relativeColor(0.05, 0)}, ${relativeColor(0.05, 1)})`
            }}
          />
          <span>Bright</span>
        </div>
      </div>
      {hover ? (
        <p className='text-foreground'>
          {hover.kind === 'cloud' ? (
            <>
              dens. {hover.attempts.toFixed(1)} · ~{(hover.rawFg * 100).toFixed(0)}% raw →{' '}
              {(hover.adjustedFg * 100).toFixed(0)}% shrunk · league {(hover.leagueFg * 100).toFixed(0)}% ·{' '}
              {hover.relative >= 0 ? '+' : ''}
              {(hover.relative * 100).toFixed(1)} pts
              {hover.threeHeavy ? ' (3pt)' : ' (2pt)'}
            </>
          ) : (
            <>
              {hover.makes}/{hover.attempts} ({(hover.rawFg * 100).toFixed(0)}% raw →{' '}
              {(hover.adjustedFg * 100).toFixed(0)}% shrunk) · league {(hover.leagueFg * 100).toFixed(0)}% ·{' '}
              {hover.relative >= 0 ? '+' : ''}
              {(hover.relative * 100).toFixed(1)} pts
              {hover.threeHeavy ? ', 3pt' : ', 2pt'}
            </>
          )}
        </p>
      ) : (
        <p>
          Color = shrink-adjusted FG% vs zone league avg (clip ±{(REL_CLIP * 100).toFixed(0)} pts) · brightness = volume
          (≤2 att. = max dim; caps 20/15)
        </p>
      )}
    </div>
  )
}

function HexHeatmap({
  shots,
  league,
  onHover
}: {
  shots: ShotPoint[]
  league: LeagueLookup
  onHover: (info: HoverInfo | null) => void
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const cells = useMemo(() => buildHexCells(shots, league), [shots, league])
  const onHoverRef = useRef(onHover)
  useEffect(() => {
    onHoverRef.current = onHover
  }, [onHover])

  return (
    <svg
      viewBox={`0 0 ${COURT_WIDTH_FT} ${COURT_LENGTH_FT}`}
      className='border-border aspect-50/47 w-full rounded-lg border bg-zinc-100 dark:bg-zinc-900'
      role='img'
      aria-label='Hexbin shot heatmap vs league average'
    >
      <rect
        x={0}
        y={0}
        width={COURT_WIDTH_FT}
        height={COURT_LENGTH_FT}
        className='fill-zinc-100 dark:fill-zinc-900'
      />

      <g>
        {cells.map(cell => {
          const key = `${cell.q},${cell.r}`
          const isEmpty = cell.attempts === 0
          const isHovered = hoverKey === key && !isEmpty
          const points = hexagonPath(cell.cx, cell.cy, HEX_SIZE * 0.92)

          if (isEmpty) {
            return (
              <polygon
                key={key}
                points={points}
                fill='none'
                stroke='currentColor'
                strokeWidth={0.08}
                className='text-zinc-400 dark:text-zinc-500'
              />
            )
          }

          const isThreeHeavy = cell.threeAttempts * 2 >= cell.attempts
          const leagueFg = cell.leagueRateSum / cell.attempts
          const rawFg = cell.makes / cell.attempts
          const {adjustedFg, relative} = relativeEfficiency(cell.makes, cell.attempts, leagueFg)
          const volumeT = volumeTForAttempts(cell.attempts, isThreeHeavy)

          return (
            <polygon
              key={key}
              points={points}
              fill={relativeColor(relative, volumeT)}
              fillOpacity={cellOpacity(volumeT)}
              stroke={isHovered ? 'currentColor' : 'transparent'}
              strokeWidth={isHovered ? 0.15 : 0}
              className='text-foreground cursor-pointer'
              onMouseEnter={() => {
                setHoverKey(key)
                onHoverRef.current({
                  kind: 'hex',
                  makes: cell.makes,
                  attempts: cell.attempts,
                  rawFg,
                  adjustedFg,
                  leagueFg,
                  relative,
                  threeHeavy: isThreeHeavy
                })
              }}
              onMouseLeave={() => {
                setHoverKey(null)
                onHoverRef.current(null)
              }}
            />
          )
        })}
      </g>

      <CourtLinesOverlay />
    </svg>
  )
}

type CloudField = {
  attempts: Float32Array
  makes: Float32Array
  expected: Float32Array
  three: Float32Array
}

function buildCloudField(shots: ShotPoint[], league: LeagueLookup): CloudField {
  const attempts = new Float32Array(CLOUD_COLS * CLOUD_ROWS)
  const makes = new Float32Array(CLOUD_COLS * CLOUD_ROWS)
  const expected = new Float32Array(CLOUD_COLS * CLOUD_ROWS)
  const three = new Float32Array(CLOUD_COLS * CLOUD_ROWS)

  const cellW = COURT_WIDTH_FT / CLOUD_COLS
  const cellH = COURT_LENGTH_FT / CLOUD_ROWS
  const sigma = CLOUD_SIGMA_FT
  const radius = Math.ceil((sigma * 3) / Math.min(cellW, cellH))
  const twoSigmaSq = 2 * sigma * sigma

  const kernel: {dx: number; dy: number; w: number}[] = []
  let peak = 0
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const distFtSq = (dx * cellW) ** 2 + (dy * cellH) ** 2
      const w = Math.exp(-distFtSq / twoSigmaSq)
      if (w < 0.02) continue
      kernel.push({dx, dy, w})
      if (w > peak) peak = w
    }
  }
  for (const tap of kernel) tap.w /= peak

  for (const shot of shots) {
    const {x, y} = locToCourtFeet(shot)
    if (x < -1 || x > COURT_WIDTH_FT + 1 || y < -1 || y > COURT_LENGTH_FT + 2) {
      continue
    }

    const cx = Math.floor((x / COURT_WIDTH_FT) * CLOUD_COLS)
    const cy = Math.floor((y / COURT_LENGTH_FT) * CLOUD_ROWS)
    const leagueFg = leagueFgForShot(shot, league)
    const isThree = shot.value === 3

    for (const {dx, dy, w} of kernel) {
      const gx = cx + dx
      const gy = cy + dy
      if (gx < 0 || gy < 0 || gx >= CLOUD_COLS || gy >= CLOUD_ROWS) continue
      const idx = gy * CLOUD_COLS + gx
      attempts[idx] += w
      if (shot.made) makes[idx] += w
      expected[idx] += w * leagueFg
      if (isThree) three[idx] += w
    }
  }

  return {attempts, makes, expected, three}
}

function CloudHeatmap({
  shots,
  league,
  onHover
}: {
  shots: ShotPoint[]
  league: LeagueLookup
  onHover: (info: HoverInfo | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fieldRef = useRef<CloudField | null>(null)
  const onHoverRef = useRef(onHover)
  useEffect(() => {
    onHoverRef.current = onHover
  }, [onHover])

  const field = useMemo(() => buildCloudField(shots, league), [shots, league])
  useEffect(() => {
    fieldRef.current = field
  }, [field])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = canvas.clientWidth
    const cssH = canvas.clientHeight
    if (cssW === 0 || cssH === 0) return

    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = ctx.createImageData(CLOUD_COLS, CLOUD_ROWS)
    const {attempts, makes, expected, three} = field

    for (let i = 0; i < attempts.length; i++) {
      const a = attempts[i]
      if (a < CLOUD_DENSITY_FLOOR) continue

      const isThreeHeavy = three[i] * 2 >= a
      const leagueFg = expected[i] / a
      const {relative} = relativeEfficiency(makes[i], a, leagueFg)
      const volumeT = volumeTForAttempts(a, isThreeHeavy)
      const [r, g, b] = relativeRgb(relative, volumeT, {boost: true})
      const alpha = Math.round(cloudOpacity(volumeT) * 255)
      const px = i * 4
      img.data[px] = r
      img.data[px + 1] = g
      img.data[px + 2] = b
      img.data[px + 3] = alpha
    }

    const offscreen = document.createElement('canvas')
    offscreen.width = CLOUD_COLS
    offscreen.height = CLOUD_ROWS
    const offCtx = offscreen.getContext('2d')
    if (!offCtx) return
    offCtx.putImageData(img, 0, 0)

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.filter = `blur(${CLOUD_BLUR_PX}px)`
    ctx.drawImage(offscreen, 0, 0, cssW, cssH)
    ctx.filter = 'none'
  }, [field])

  return (
    <div className='border-border relative aspect-50/47 w-full overflow-hidden rounded-lg border bg-zinc-100 dark:bg-zinc-900'>
      <div className='absolute inset-0 bg-zinc-100 dark:bg-zinc-900' />
      <canvas
        ref={canvasRef}
        className='absolute inset-0 h-full w-full'
        onMouseMove={event => {
          const fieldData = fieldRef.current
          if (!fieldData) return
          const rect = event.currentTarget.getBoundingClientRect()
          const gx = Math.floor(((event.clientX - rect.left) / rect.width) * CLOUD_COLS)
          const gy = Math.floor(((event.clientY - rect.top) / rect.height) * CLOUD_ROWS)
          if (gx < 0 || gy < 0 || gx >= CLOUD_COLS || gy >= CLOUD_ROWS) {
            onHoverRef.current(null)
            return
          }
          const idx = gy * CLOUD_COLS + gx
          const a = fieldData.attempts[idx]
          if (a < CLOUD_DENSITY_FLOOR) {
            onHoverRef.current(null)
            return
          }
          const leagueFg = fieldData.expected[idx] / a
          const rawFg = fieldData.makes[idx] / a
          const {adjustedFg, relative} = relativeEfficiency(fieldData.makes[idx], a, leagueFg)
          onHoverRef.current({
            kind: 'cloud',
            makes: fieldData.makes[idx],
            attempts: a,
            rawFg,
            adjustedFg,
            leagueFg,
            relative,
            threeHeavy: fieldData.three[idx] * 2 >= a
          })
        }}
        onMouseLeave={() => onHoverRef.current(null)}
      />
      <svg
        viewBox={`0 0 ${COURT_WIDTH_FT} ${COURT_LENGTH_FT}`}
        className='pointer-events-none absolute inset-0 h-full w-full'
        aria-hidden
      >
        <CourtLinesOverlay />
      </svg>
    </div>
  )
}

function ZoneSummaryTable({shots, league}: {shots: ShotPoint[]; league: LeagueLookup}) {
  const rows = useMemo(() => {
    const byZone = new Map<string, {attempts: number; makes: number; leagueSum: number}>()

    for (const shot of shots) {
      const agg = byZone.get(shot.zoneBasic) ?? {attempts: 0, makes: 0, leagueSum: 0}
      agg.attempts += 1
      if (shot.made) agg.makes += 1
      agg.leagueSum += leagueFgForShot(shot, league)
      byZone.set(shot.zoneBasic, agg)
    }

    return [...byZone.entries()]
      .map(([zone, agg]) => {
        const leagueFg = agg.attempts > 0 ? agg.leagueSum / agg.attempts : league.overall
        const {adjustedFg, relative} = relativeEfficiency(agg.makes, agg.attempts, leagueFg)
        return {zone, ...agg, leagueFg, adjustedFg, relative}
      })
      .sort((a, b) => b.attempts - a.attempts)
  }, [shots, league])

  if (rows.length === 0) {
    return null
  }

  return (
    <table className='sr-only'>
      <caption>Shot efficiency by court zone versus league average</caption>
      <thead>
        <tr>
          <th scope='col'>Zone</th>
          <th scope='col'>Attempts</th>
          <th scope='col'>Makes</th>
          <th scope='col'>Adjusted field goal percentage</th>
          <th scope='col'>League average</th>
          <th scope='col'>Difference vs league</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.zone}>
            <th scope='row'>{row.zone}</th>
            <td>{row.attempts}</td>
            <td>{row.makes}</td>
            <td>{(row.adjustedFg * 100).toFixed(0)}%</td>
            <td>{(row.leagueFg * 100).toFixed(0)}%</td>
            <td>
              {row.relative >= 0 ? '+' : ''}
              {(row.relative * 100).toFixed(1)} pts
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ShotHeatmapCourt({shots, leagueZones}: ShotHeatmapCourtProps) {
  const [mode, setMode] = useState<VizMode>('cloud')
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const league = useMemo(() => buildLeagueLookup(leagueZones), [leagueZones])

  return (
    <div className='flex w-full max-w-3xl flex-col gap-3'>
      <div
        className='flex w-fit gap-1 rounded-lg border p-1'
        role='group'
        aria-label='Heatmap visualization mode'
      >
        <Button
          type='button'
          size='sm'
          aria-pressed={mode === 'cloud'}
          variant={mode === 'cloud' ? 'secondary' : 'ghost'}
          className={cn(mode === 'cloud' && 'bg-muted')}
          onClick={() => {
            setHover(null)
            setMode('cloud')
          }}
        >
          Cloud
        </Button>
        <Button
          type='button'
          size='sm'
          aria-pressed={mode === 'hex'}
          variant={mode === 'hex' ? 'secondary' : 'ghost'}
          className={cn(mode === 'hex' && 'bg-muted')}
          onClick={() => {
            setHover(null)
            setMode('hex')
          }}
        >
          Hex
        </Button>
      </div>

      <ZoneSummaryTable
        shots={shots}
        league={league}
      />

      <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
        <div className='w-full max-w-md shrink-0'>
          {mode === 'cloud' ? (
            <CloudHeatmap
              shots={shots}
              league={league}
              onHover={setHover}
            />
          ) : (
            <HexHeatmap
              shots={shots}
              league={league}
              onHover={setHover}
            />
          )}
        </div>

        <div className='sm:sticky sm:top-4 sm:max-w-xs sm:min-w-48'>
          <HeatmapLegend hover={hover} />
        </div>
      </div>
    </div>
  )
}
