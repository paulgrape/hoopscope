import Image from 'next/image'
import Link from 'next/link'

import type {ConferenceStandings, PlayoffStatus, StandingTeam} from '@/lib/standings-api'
import {cn} from '@/lib/utils'

const playoffRowClass: Record<PlayoffStatus, string> = {
  playoff: 'border-l-emerald-500 bg-emerald-500/10',
  'play-in': 'border-l-amber-500 bg-amber-500/10',
  out: 'border-l-transparent',
}

const legendItems: Array<{status: PlayoffStatus; label: string; className: string}> = [
  {status: 'playoff', label: 'Playoff (seeds 1–6)', className: 'bg-emerald-500'},
  {status: 'play-in', label: 'Play-In (seeds 7–10)', className: 'bg-amber-500'},
  {status: 'out', label: 'Out of postseason', className: 'bg-muted-foreground/30'},
]

function StandingRow({team}: {team: StandingTeam}) {
  return (
    <tr className={cn('border-border border-b border-l-4 transition-colors', playoffRowClass[team.playoffStatus])}>
      <td className='text-muted-foreground px-2 py-2.5 text-center text-sm font-medium tabular-nums sm:px-3'>
        {team.seed}
      </td>
      <td className='px-2 py-2.5 sm:px-3'>
        <Link
          href={`/teams/${team.id}`}
          className='hover:text-primary flex min-w-0 items-center gap-2 transition-colors sm:gap-3'
        >
          {team.logo ? (
            <Image
              src={team.logo}
              alt=''
              width={28}
              height={28}
              className='h-7 w-7 shrink-0 object-contain'
            />
          ) : (
            <div className='bg-muted h-7 w-7 shrink-0 rounded-full' />
          )}
          <span className='truncate text-sm font-medium sm:text-base'>{team.displayName}</span>
        </Link>
      </td>
      <td className='px-2 py-2.5 text-center text-sm tabular-nums sm:px-3'>{team.wins}</td>
      <td className='px-2 py-2.5 text-center text-sm tabular-nums sm:px-3'>{team.losses}</td>
      <td className='px-2 py-2.5 text-center text-sm tabular-nums sm:px-3'>{team.winPct}</td>
      <td className='text-muted-foreground hidden px-2 py-2.5 text-center text-sm tabular-nums sm:table-cell sm:px-3'>
        {team.gamesBehind}
      </td>
      <td className='hidden px-2 py-2.5 text-center text-sm tabular-nums md:table-cell md:px-3'>{team.home}</td>
      <td className='hidden px-2 py-2.5 text-center text-sm tabular-nums md:table-cell md:px-3'>{team.road}</td>
      <td className='hidden px-2 py-2.5 text-center text-sm tabular-nums lg:table-cell lg:px-3'>{team.lastTen}</td>
      <td className='hidden px-2 py-2.5 text-center text-sm tabular-nums lg:table-cell lg:px-3'>{team.streak}</td>
    </tr>
  )
}

function ConferenceTable({conference}: {conference: ConferenceStandings}) {
  return (
    <section className='bg-card border-border min-w-0 overflow-hidden rounded-xl border'>
      <header className='border-border border-b px-4 py-3 sm:px-5'>
        <h2 className='text-lg font-semibold sm:text-xl'>{conference.name}</h2>
      </header>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-xl text-left'>
          <thead>
            <tr className='bg-muted/40 text-muted-foreground border-border border-b text-xs uppercase tracking-wide'>
              <th className='px-2 py-2.5 text-center font-medium sm:px-3'>#</th>
              <th className='px-2 py-2.5 font-medium sm:px-3'>Team</th>
              <th className='px-2 py-2.5 text-center font-medium sm:px-3'>W</th>
              <th className='px-2 py-2.5 text-center font-medium sm:px-3'>L</th>
              <th className='px-2 py-2.5 text-center font-medium sm:px-3'>PCT</th>
              <th className='hidden px-2 py-2.5 text-center font-medium sm:table-cell sm:px-3'>GB</th>
              <th className='hidden px-2 py-2.5 text-center font-medium md:table-cell md:px-3'>Home</th>
              <th className='hidden px-2 py-2.5 text-center font-medium md:table-cell md:px-3'>Road</th>
              <th className='hidden px-2 py-2.5 text-center font-medium lg:table-cell lg:px-3'>L10</th>
              <th className='hidden px-2 py-2.5 text-center font-medium lg:table-cell lg:px-3'>STRK</th>
            </tr>
          </thead>
          <tbody>
            {conference.teams.map((team) => (
              <StandingRow key={team.id} team={team} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function StandingsTables({conferences}: {conferences: ConferenceStandings[]}) {
  return (
    <div className='flex flex-col gap-5 sm:gap-6'>
      <div className='flex flex-wrap items-center gap-4 text-sm'>
        {legendItems.map((item) => (
          <div key={item.status} className='flex items-center gap-2'>
            <span className={cn('h-3 w-3 rounded-sm', item.className)} aria-hidden='true' />
            <span className='text-muted-foreground'>{item.label}</span>
          </div>
        ))}
      </div>

      <div className='grid min-w-0 gap-5 lg:grid-cols-2 lg:gap-6'>
        {conferences.map((conference) => (
          <ConferenceTable key={conference.id} conference={conference} />
        ))}
      </div>
    </div>
  )
}
