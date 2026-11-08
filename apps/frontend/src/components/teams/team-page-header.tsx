'use client'

import type {TeamDetails} from '@/lib/teams-api'
import Image from 'next/image'
import {type CSSProperties} from 'react'

import {useTeamHeaderCollapse} from './use-team-header-collapse'

type TeamPageHeaderProps = {
  team: TeamDetails
}

const logoStyle: CSSProperties = {
  width: 'calc(var(--logo-rest) - (var(--logo-rest) - var(--logo-end)) * var(--collapse))',
  height: 'calc(var(--logo-rest) - (var(--logo-rest) - var(--logo-end)) * var(--collapse))'
}

const nameStyle: CSSProperties = {
  fontSize: 'calc(var(--name-rest) - (var(--name-rest) - var(--name-end)) * var(--collapse))',
  lineHeight: 'calc(var(--name-leading) - (var(--name-leading) - var(--name-end-leading)) * var(--collapse))'
}

const nameMoveX = 'min(1, var(--collapse) / 0.4)'
const nameMoveY = 'clamp(0, (var(--collapse) - 0.15) / 0.85, 1)'

const nameRowStyle: CSSProperties = {
  transform: `translate(calc(${nameMoveX} * var(--shift-x)), calc(${nameMoveY} * var(--shift-y)))`,
  maxWidth: `calc((1 - ${nameMoveX}) * 100% + ${nameMoveX} * var(--name-max, 100%))`
}

const recordStyle: CSSProperties = {
  opacity: 'min(1, var(--collapse) / 0.45)',
  maxWidth: 'calc(min(1, var(--collapse) / 0.45) * 5rem)',
  marginLeft: 'calc(min(1, var(--collapse) / 0.45) * 0.5rem)',
  minWidth: 0,
  overflow: 'hidden'
}

function fade(variable: '--details-h' | '--meta-h', dimAt = '0.45'): CSSProperties {
  return {
    maxHeight: `calc((1 - min(1, var(--collapse) / 0.45)) * var(${variable}))`,
    opacity: `calc(1 - min(1, var(--collapse) / ${dimAt}))`,
    overflow: 'hidden'
  }
}

export function TeamPageHeader({team}: TeamPageHeaderProps) {
  const {sentinelRef, barRef, rowRef, logoRef, nameRef, detailsInnerRef, metaInnerRef, detailsRef, metaRef, recordRef} =
    useTeamHeaderCollapse()
  const summary = team.record.summary
  const seasonLabel = team.record.seasonLabel

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden='true'
        className='h-0 min-h-0 shrink-0 overflow-hidden'
      />
      <header
        ref={barRef}
        className='border-border bg-card sticky top-14 z-10 [margin-inline:calc(var(--collapse)*var(--bleed))] [width:calc(100%-2*var(--collapse)*var(--bleed))] [border-radius:calc((1-var(--collapse))*var(--radius-xl))] border [border-inline-width:calc((1-var(--collapse)*var(--drop-edge))*1px)] [--bleed:-1rem] [--collapse:0] [--details-h:40rem] [--drop-edge:1] [--kicker-dim:0.25] [--logo-end:2.25rem] [--logo-rest:5rem] [--meta-h:40rem] [--name-end-leading:1.25rem] [--name-end:1.125rem] [--name-leading:2rem] [--name-max:100%] [--name-rest:1.5rem] [--row-h:0px] [--shift-x:0px] [--shift-y:0px] [--stack-h:0px] sm:[--bleed:-1.5rem] sm:[--kicker-dim:0.45] sm:[--logo-rest:6.25rem] sm:[--name-leading:2.25rem] sm:[--name-rest:1.875rem] md:[--bleed:0px] md:[--drop-edge:0]'
      >
        <div
          ref={rowRef}
          className='flex flex-col items-start gap-4 px-3 py-3 sm:flex-row sm:items-center sm:gap-8 sm:px-5 sm:py-[calc(1.25rem-0.5rem*var(--collapse))]'
        >
          <div
            ref={logoRef}
            className='shrink-0'
            style={logoStyle}
          >
            {team.logo ? (
              <Image
                src={team.logo}
                alt={`${team.displayName} logo`}
                width={100}
                height={100}
                className='size-full object-contain'
              />
            ) : (
              <div className='bg-muted size-full rounded-full' />
            )}
          </div>

          <div className='w-full min-w-0 sm:flex-1'>
            <div
              ref={detailsRef}
              style={fade('--details-h', 'var(--kicker-dim, 0.45)')}
            >
              <div
                ref={detailsInnerRef}
                className='pb-1'
              >
                <p className='text-muted-foreground text-xs tracking-wider uppercase'>{team.abbreviation}</p>
              </div>
            </div>

            <div
              ref={nameRef}
              className='flex w-max min-w-0 items-baseline'
              style={nameRowStyle}
            >
              <h1
                className='text-card-foreground min-w-0 truncate font-semibold'
                style={nameStyle}
              >
                {team.displayName}
              </h1>
              {summary ? (
                <span
                  ref={recordRef}
                  className='text-muted-foreground shrink-0 text-xs tracking-wider whitespace-nowrap'
                  style={recordStyle}
                >
                  {summary}
                </span>
              ) : null}
            </div>

            <div
              ref={metaRef}
              style={fade('--meta-h')}
            >
              <div
                ref={metaInnerRef}
                className='text-muted-foreground flex flex-col gap-1 pt-3 text-sm sm:flex-row sm:flex-wrap sm:gap-4'
              >
                <p>
                  <span className='text-foreground'>Location:</span> {team.location}
                </p>
                <p>
                  <span className='text-foreground'>Record:</span> {summary ?? 'N/A'}
                  {seasonLabel ? ` (${seasonLabel})` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export function TeamFacts({team}: TeamPageHeaderProps) {
  const items = [
    {label: 'Conference', value: team.conference},
    {label: 'Division', value: team.division},
    {label: 'Arena', value: team.venue},
    {label: 'Location', value: team.venueLocation},
    {label: 'Head coach', value: team.coach}
  ].filter((item): item is {label: string; value: string} => Boolean(item.value))

  if (items.length === 0) return null

  return (
    <section className='bg-card border-border rounded-xl border p-3 sm:p-5'>
      <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Team details</h2>
      <dl className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
        {items.map(item => (
          <div
            key={item.label}
            className='bg-background/40 border-border rounded-lg border px-3 py-2.5'
          >
            <dt className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>{item.label}</dt>
            <dd className='text-card-foreground mt-1 text-sm font-medium'>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
