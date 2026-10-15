'use client'

import type {PlayerProfile} from '@/lib/players-api'
import {cn} from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import {type CSSProperties} from 'react'

import {usePlayerHeaderCollapse} from './use-player-header-collapse'

type PlayerPageHeaderProps = {
  player: PlayerProfile
}

const photoStyle: CSSProperties = {
  width: 'calc(var(--photo-rest) - (var(--photo-rest) - var(--photo-end)) * var(--collapse))',
  height: 'calc(var(--photo-rest) - (var(--photo-rest) - var(--photo-end)) * var(--collapse))'
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

const abbrStyle: CSSProperties = {
  opacity: 'min(1, var(--collapse) / 0.45)',
  maxWidth: 'calc(min(1, var(--collapse) / 0.45) * 5rem)',
  marginLeft: 'calc(min(1, var(--collapse) / 0.45) * 0.5rem)',
  minWidth: 0,
  overflow: 'hidden'
}

const teamLinkClass =
  'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm text-xs tracking-wider uppercase underline-offset-4 outline-none hover:underline focus-visible:ring-3'

function fade(variable: '--details-h' | '--meta-h', dimAt = '0.45'): CSSProperties {
  return {
    maxHeight: `calc((1 - min(1, var(--collapse) / 0.45)) * var(${variable}))`,
    opacity: `calc(1 - min(1, var(--collapse) / ${dimAt}))`,
    overflow: 'hidden'
  }
}

export function PlayerPageHeader({player}: PlayerPageHeaderProps) {
  const {sentinelRef, barRef, rowRef, photoRef, nameRef, detailsInnerRef, metaInnerRef, detailsRef, metaRef, abbrRef} =
    usePlayerHeaderCollapse()
  const team = player.latestTeam
  const hasMeta = Boolean(player.jersey || player.position || player.status || player.injury?.detail)

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden='true'
        className='h-0 min-h-0 shrink-0 overflow-hidden'
      />
      <header
        ref={barRef}
        className='border-border bg-card sticky top-14 z-10 [margin-inline:calc(var(--collapse)*var(--bleed))] [width:calc(100%-2*var(--collapse)*var(--bleed))] [border-radius:calc((1-var(--collapse))*var(--radius-xl))] border [border-inline-width:calc((1-var(--collapse)*var(--drop-edge))*1px)] [--bleed:-1rem] [--collapse:0] [--details-h:40rem] [--drop-edge:1] [--meta-h:40rem] [--name-end-leading:1.25rem] [--name-end:1.125rem] [--name-leading:2rem] [--name-max:100%] [--name-rest:1.5rem] [--photo-end:2.25rem] [--photo-rest:6rem] [--row-h:0px] [--shift-x:0px] [--shift-y:0px] [--stack-h:0px] [--team-dim:0.25] sm:[--bleed:-1.5rem] sm:[--name-leading:2.25rem] sm:[--name-rest:1.875rem] sm:[--photo-rest:7rem] sm:[--team-dim:0.45] md:[--bleed:0px] md:[--drop-edge:0]'
      >
        <div
          ref={rowRef}
          className='flex flex-col items-start gap-4 px-3 py-3 sm:flex-row sm:items-center sm:gap-8 sm:px-5 sm:py-[calc(1.25rem-0.5rem*var(--collapse))]'
        >
          <div
            ref={photoRef}
            className='shrink-0'
            style={photoStyle}
          >
            {player.headshot ? (
              <Image
                src={player.headshot}
                alt={player.fullName}
                width={120}
                height={120}
                className='size-full rounded-full object-cover'
              />
            ) : (
              <div className='bg-muted size-full rounded-full' />
            )}
          </div>

          <div className='w-full min-w-0 sm:flex-1'>
            {team || player.injury ? (
              <div
                ref={detailsRef}
                style={fade('--details-h', 'var(--team-dim, 0.45)')}
              >
                <div
                  ref={detailsInnerRef}
                  className='flex flex-wrap items-center gap-2 pb-1'
                >
                  {team ? (
                    <Link
                      href={`/teams/${team.id}`}
                      className={teamLinkClass}
                    >
                      {team.displayName}
                    </Link>
                  ) : null}
                  {player.injury ? (
                    <span className='bg-destructive/15 text-destructive rounded-full px-2.5 py-0.5 text-xs font-medium'>
                      {player.injury.status}
                      {player.injury.type ? ` · ${player.injury.type}` : ''}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div
              ref={nameRef}
              className='flex w-max min-w-0 items-baseline'
              style={nameRowStyle}
            >
              <h1
                className='text-card-foreground min-w-0 truncate font-semibold'
                style={nameStyle}
              >
                {player.fullName}
              </h1>
              {team ? (
                <Link
                  ref={abbrRef}
                  href={`/teams/${team.id}`}
                  className={cn(teamLinkClass, 'shrink-0 whitespace-nowrap')}
                  style={abbrStyle}
                >
                  {team.abbreviation}
                </Link>
              ) : null}
            </div>

            {hasMeta ? (
              <div
                ref={metaRef}
                style={fade('--meta-h')}
              >
                <div
                  ref={metaInnerRef}
                  className='flex flex-col gap-3 pt-3'
                >
                  {player.jersey || player.position || player.status ? (
                    <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm'>
                      {player.jersey ? (
                        <p>
                          <span className='text-foreground'>Number:</span> #{player.jersey}
                        </p>
                      ) : null}
                      {player.position ? (
                        <p>
                          <span className='text-foreground'>Position:</span> {player.position}
                        </p>
                      ) : null}
                      {player.status ? (
                        <p>
                          <span className='text-foreground'>Status:</span> {player.status}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {player.injury?.detail ? (
                    <p className='text-muted-foreground text-sm'>{player.injury.detail}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  )
}

type PlayerBioGridProps = {
  player: PlayerProfile
}

export function PlayerBioGrid({player}: PlayerBioGridProps) {
  const items = [
    {label: 'Age', value: player.age != null ? String(player.age) : null},
    {label: 'Height', value: player.height},
    {label: 'Weight', value: player.weight},
    {label: 'College', value: player.college},
    {label: 'Birthplace', value: player.birthPlace},
    {label: 'Experience', value: `${player.experience} yrs`},
    {
      label: 'Active',
      value: player.active == null ? null : player.active ? 'Yes' : 'No'
    }
  ].filter(item => item.value)

  if (items.length === 0) return null

  return (
    <section className='bg-card border-border rounded-xl border p-3 sm:p-5'>
      <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Bio</h2>
      <dl className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
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
