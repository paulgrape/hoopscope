'use client'

import {ChangedValue} from '@/components/match/changed-value'
import type {ScoreboardTeam} from '@/lib/games-api'
import {cn} from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import {type CSSProperties, type RefObject} from 'react'

import {useScoreHeaderCollapse} from './use-score-header-collapse'

type StickyScoreHeaderProps = {
  awayTeam: ScoreboardTeam | null
  homeTeam: ScoreboardTeam | null
  awayScore: number | null
  homeScore: number | null
  showVersus: boolean
  liveLabel: string | null
}

const logoSize: CSSProperties = {
  width: 'calc(var(--logo-rest) - (var(--logo-rest) - 1.75rem) * var(--collapse))',
  height: 'calc(var(--logo-rest) - (var(--logo-rest) - 1.75rem) * var(--collapse))'
}

const homeLogoMotionClass = cn(
  'max-md:[transform:translateX(calc((1-var(--collapse))*var(--home-logo-slide)))]',
  'md:[transform:translateX(calc((1-min(1,max(0,var(--collapse)-0.5)*100))*var(--home-logo-slide)))]',
  'md:[opacity:clamp(0,1-min(1,var(--collapse)/0.4)+max(0,(var(--collapse)-0.6)/0.4),1)]'
)

const homeNameMotionClass = cn(
  'max-md:[transform:translateX(calc((1-var(--collapse))*var(--home-name-slide)))]',
  'md:[transform:translateX(calc(clamp(0,(0.6-var(--collapse))/0.2,1)*var(--home-name-slide)))]'
)

const homeScoreMotion: CSSProperties = {
  fontSize: 'calc(var(--score-rest) - (var(--score-rest) - 1.25rem) * var(--collapse))',
  transform: 'translateX(calc((1 - var(--collapse)) * var(--home-score-slide, 0px)))'
}

const fullNameMotion: CSSProperties = {
  width: 'max-content',
  maxWidth: 'var(--name-max)',
  maxHeight: 'calc((1 - min(1, var(--collapse) / 0.45)) * 1.25rem)',
  marginTop: 'calc((1 - min(1, var(--collapse) / 0.45)) * 0.125rem)',
  opacity: 'calc(1 - min(1, var(--collapse) / 0.45))'
}

const nameLineMotion: CSSProperties = {
  height: 'calc((1 - min(1, var(--collapse) / 0.45)) * 1.375rem)'
}

const spreadMotion: CSSProperties = {
  width: 'calc((1 - var(--collapse)) * var(--spread))'
}

const clusterShift = (x: string, y: string): CSSProperties => ({
  transform: `translate(calc(var(--collapse) * var(${x})), calc(var(--collapse) * var(${y})))`
})

export function StickyScoreHeader({
  awayTeam,
  homeTeam,
  awayScore,
  homeScore,
  showVersus,
  liveLabel
}: StickyScoreHeaderProps) {
  const live = liveLabel !== null
  const {sentinelRef, barRef, rowRef, awayRef, homeRef, sepRef, awaySpacerRef, homeSpacerRef} = useScoreHeaderCollapse()

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden='true'
        className='h-0 min-h-0 shrink-0 overflow-hidden'
      />
      <div
        ref={barRef}
        className='border-border bg-card sticky top-14 z-10 border-b px-4 [border-inline-width:calc((1-var(--collapse)*var(--drop-edge))*1px)] max-md:mx-[calc(var(--collapse)*var(--bleed))] max-md:w-[calc(100%-2*var(--collapse)*var(--bleed))] [--away-packed:0px] [--away-shift-x:0px] [--away-shift-y:0px] [--bleed:-1rem] [--collapse:0] [--drop-edge:1] [--gap:0.75rem] [--home-logo-slide:0px] [--home-name-slide:0px] [--home-packed:0px] [--home-score-slide:0px] [--home-shift-x:0px] [--home-shift-y:0px] [--logo-rest:3rem] [--name-max:12rem] [--phone-spread:0px] [--row-h:0px] [--score-rest:1.875rem] [--sep-shift-x:0px] [--sep-shift-y:0px] [--spread:0px] [--stack-h:0px] sm:px-6 sm:[--bleed:-1.5rem] md:[--drop-edge:0] md:[--home-logo-slide:calc(3ch+var(--gap))] md:[--home-name-slide:calc(-1*(var(--logo-rest)+var(--gap)))] md:[--logo-rest:3.5rem] md:[--name-max:14rem] md:[--score-rest:3rem]'
      >
        {liveLabel ? (
          <p className='pt-2 text-center text-xs font-medium text-red-600 dark:text-red-400'>
            <ChangedValue value={liveLabel}>{liveLabel}</ChangedValue>
          </p>
        ) : null}
        <div
          ref={rowRef}
          className='@container relative flex w-full flex-col gap-(--gap) py-[calc(1rem-var(--collapse)*0.5rem)] max-md:overflow-hidden md:flex-row md:items-center md:justify-center md:py-[calc(1.5rem-var(--collapse)*1rem)]'
        >
          <div
            ref={awayRef}
            className='flex min-w-0 shrink-0 rounded-lg max-md:w-[calc(var(--away-packed)+(1-var(--collapse))*(100cqi-var(--away-packed)))] max-md:bg-[color-mix(in_oklab,var(--muted)_calc((1-var(--collapse))*30%),transparent)] max-md:p-[calc((1-var(--collapse))*0.75rem)] md:w-auto md:bg-transparent md:p-0'
            style={clusterShift('--away-shift-x', '--away-shift-y')}
          >
            <TeamCluster
              team={awayTeam}
              score={awayScore}
              side='away'
              live={live}
              spacerRef={awaySpacerRef}
            />
          </div>
          {showVersus ? (
            <div
              ref={sepRef}
              className='text-muted-foreground relative z-10 shrink-0 self-center text-center text-xs font-semibold tracking-wider uppercase md:text-sm'
              style={clusterShift('--sep-shift-x', '--sep-shift-y')}
            >
              vs
            </div>
          ) : (
            <div
              ref={sepRef}
              className='text-muted-foreground relative z-10 shrink-0 self-center text-center text-xs font-semibold tracking-wider uppercase md:text-sm'
              style={clusterShift('--sep-shift-x', '--sep-shift-y')}
              aria-hidden='true'
            >
              –
            </div>
          )}
          <div
            ref={homeRef}
            className='flex min-w-0 shrink-0 rounded-lg max-md:w-[calc(var(--home-packed)+(1-var(--collapse))*(100cqi-var(--home-packed)))] max-md:bg-[color-mix(in_oklab,var(--muted)_calc((1-var(--collapse))*30%),transparent)] max-md:p-[calc((1-var(--collapse))*0.75rem)] md:w-auto md:bg-transparent md:p-0'
            style={clusterShift('--home-shift-x', '--home-shift-y')}
          >
            <TeamCluster
              team={homeTeam}
              score={homeScore}
              side='home'
              live={live}
              spacerRef={homeSpacerRef}
            />
          </div>
        </div>
      </div>
    </>
  )
}

function TeamCluster({
  team,
  score,
  side,
  live,
  spacerRef
}: {
  team: ScoreboardTeam | null
  score: number | null
  side: 'away' | 'home'
  live: boolean
  spacerRef: RefObject<HTMLSpanElement | null>
}) {
  const isHome = side === 'home'
  const logo = (
    <span
      data-piece='logo'
      className={cn('relative z-10 mr-(--gap) inline-flex shrink-0', isHome && homeLogoMotionClass)}
      style={logoSize}
    >
      {team?.logo ? (
        <Image
          src={team.logo}
          alt={`${team.displayName} logo`}
          width={64}
          height={64}
          className='size-full object-contain'
        />
      ) : (
        <span className='bg-muted size-full rounded-full' />
      )}
    </span>
  )
  const name = (
    <span
      data-piece='name'
      className={cn('relative inline-flex shrink-0 flex-col', isHome ? homeNameMotionClass : 'mr-6 md:mr-(--gap)')}
    >
      <span className='relative block'>
        <span className='block text-lg leading-none font-semibold whitespace-nowrap md:text-xl'>
          {team?.abbreviation ?? 'TBD'}
        </span>
        <span
          className={cn(
            'text-muted-foreground absolute top-full left-0 truncate text-sm leading-tight',
            isHome && 'md:right-0 md:left-auto md:text-right'
          )}
          style={fullNameMotion}
        >
          {team?.displayName ?? 'To be determined'}
        </span>
      </span>
      <span
        aria-hidden='true'
        className='block'
        style={nameLineMotion}
      />
    </span>
  )
  const spacer = (
    <span
      ref={spacerRef}
      data-piece='spacer'
      aria-hidden='true'
      className={cn('shrink-0', isHome && 'hidden md:block')}
      style={spreadMotion}
    />
  )
  const scoreEl =
    score !== null ? (
      <span
        data-piece='score'
        className={cn(
          'inline-block w-max shrink-0 text-right leading-none font-semibold whitespace-nowrap tabular-nums md:w-[4.5ch]',
          live && 'text-red-600 dark:text-red-400',
          isHome && 'mr-6 md:mr-(--gap) md:text-left'
        )}
        style={
          isHome
            ? homeScoreMotion
            : {fontSize: 'calc(var(--score-rest) - (var(--score-rest) - 1.25rem) * var(--collapse))'}
        }
      >
        <ChangedValue value={score}>{score}</ChangedValue>
      </span>
    ) : null

  const className = 'flex w-full min-w-0 items-center'
  const body = isHome ? (
    <>
      {scoreEl}
      {spacer}
      {logo}
      {name}
    </>
  ) : (
    <>
      {logo}
      {name}
      {spacer}
      {scoreEl}
    </>
  )

  if (!team?.id) {
    return <div className={className}>{body}</div>
  }

  return (
    <Link
      href={`/teams/${team.id}`}
      className={cn(
        className,
        'focus-visible:ring-ring/50 rounded-lg outline-none hover:opacity-90 focus-visible:ring-3'
      )}
    >
      {body}
    </Link>
  )
}
