'use client'

import {useId} from 'react'

import type {PeriodSegment} from './replay-utils'

const VIEWBOX_WIDTH = 100
const VIEWBOX_HEIGHT = 60
const BASELINE = VIEWBOX_HEIGHT / 2
const PLOT_HALF_HEIGHT = 26
const MIN_LEAD_SCALE = 6

type DifferentialPoint = {
  elapsedSeconds: number
  diff: number
}

type ReplayDifferentialChartProps = {
  points: DifferentialPoint[]
  currentSeconds: number
  totalSeconds: number
  segments: PeriodSegment[]
  homeAbbreviation: string
  awayAbbreviation: string
  homeColor?: string
  awayColor?: string
  biggestHomeLead: number
  biggestAwayLead: number
}

export function ReplayDifferentialChart({
  points,
  currentSeconds,
  totalSeconds,
  segments,
  homeAbbreviation,
  awayAbbreviation,
  homeColor,
  awayColor,
  biggestHomeLead,
  biggestAwayLead
}: ReplayDifferentialChartProps) {
  const clipId = useId()

  if (points.length === 0 || totalSeconds === 0) {
    return <p className='text-muted-foreground mt-3 text-sm'>No points scored yet.</p>
  }

  const leadScale = Math.max(MIN_LEAD_SCALE, biggestHomeLead, biggestAwayLead)
  const toX = (seconds: number) => Math.min(VIEWBOX_WIDTH, (seconds / totalSeconds) * VIEWBOX_WIDTH)
  const toY = (diff: number) => BASELINE - (diff / leadScale) * PLOT_HALF_HEIGHT

  const currentX = Math.max(toX(currentSeconds), toX(points[points.length - 1].elapsedSeconds))
  const currentDiff = points[points.length - 1].diff

  // A score margin holds until the next basket, so the outline steps instead of sloping.
  const outline = points.map(point => `H${toX(point.elapsedSeconds).toFixed(2)}V${toY(point.diff).toFixed(2)}`).join('')
  const linePath = `M0,${BASELINE}${outline}H${currentX.toFixed(2)}`
  const areaPath = `${linePath}V${BASELINE}Z`

  const leader = currentDiff > 0 ? homeAbbreviation : currentDiff < 0 ? awayAbbreviation : null
  const label = leader
    ? `${leader} lead ${Math.abs(currentDiff)}. Biggest leads ${homeAbbreviation} ${biggestHomeLead}, ${awayAbbreviation} ${biggestAwayLead}.`
    : `Scores level. Biggest leads ${homeAbbreviation} ${biggestHomeLead}, ${awayAbbreviation} ${biggestAwayLead}.`

  return (
    <div className='mt-3 flex gap-2'>
      <div className='text-muted-foreground flex w-7 shrink-0 flex-col justify-between text-right text-[0.65rem] tabular-nums'>
        <span>+{leadScale}</span>
        <span>0</span>
        <span>-{leadScale}</span>
      </div>

      <div className='min-w-0 flex-1'>
        <div className='relative'>
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            preserveAspectRatio='none'
            role='img'
            aria-label={label}
            className='h-28 w-full sm:h-36'
          >
            <defs>
              <clipPath id={`${clipId}-above`}>
                <rect
                  x='0'
                  y='0'
                  width={VIEWBOX_WIDTH}
                  height={BASELINE}
                />
              </clipPath>
              <clipPath id={`${clipId}-below`}>
                <rect
                  x='0'
                  y={BASELINE}
                  width={VIEWBOX_WIDTH}
                  height={BASELINE}
                />
              </clipPath>
            </defs>

            {segments.slice(1).map(segment => (
              <line
                key={segment.period}
                x1={toX(segment.startSeconds)}
                y1='0'
                x2={toX(segment.startSeconds)}
                y2={VIEWBOX_HEIGHT}
                stroke='currentColor'
                strokeWidth='0.5'
                vectorEffect='non-scaling-stroke'
                className='text-border'
              />
            ))}

            <path
              d={areaPath}
              clipPath={`url(#${clipId}-above)`}
              fill={homeColor ?? 'currentColor'}
              fillOpacity='0.18'
              className={homeColor ? undefined : 'text-primary'}
            />
            <path
              d={areaPath}
              clipPath={`url(#${clipId}-below)`}
              fill={awayColor ?? 'currentColor'}
              fillOpacity='0.18'
              className={awayColor ? undefined : 'text-primary'}
            />

            <line
              x1='0'
              y1={BASELINE}
              x2={VIEWBOX_WIDTH}
              y2={BASELINE}
              stroke='currentColor'
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
              className='text-muted-foreground'
            />

            <path
              d={linePath}
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              vectorEffect='non-scaling-stroke'
              className='text-foreground/70'
            />
          </svg>

          <span
            aria-hidden='true'
            className='bg-primary ring-background absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2'
            style={{
              left: `${currentX}%`,
              top: `${(toY(currentDiff) / VIEWBOX_HEIGHT) * 100}%`
            }}
          />
        </div>

        <div
          aria-hidden='true'
          className='text-muted-foreground mt-1 flex text-[0.65rem]'
        >
          {segments.map(segment => (
            <span
              key={segment.period}
              className='border-border truncate border-l pl-1 first:border-l-0 first:pl-0'
              style={{width: `${((segment.endSeconds - segment.startSeconds) / totalSeconds) * 100}%`}}
            >
              {segment.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
