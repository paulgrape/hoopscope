import type {ConferenceStandings, PlayoffStatus, StandingTeam} from '@/lib/standings-api'
import {cn} from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

const DEFAULT_TEAM_COUNT = 6

const playoffRowClass: Record<PlayoffStatus, string> = {
  playoff: 'border-l-emerald-500 bg-emerald-500/10',
  'play-in': 'border-l-amber-500 bg-amber-500/10',
  out: 'border-l-transparent'
}

type StandingsSnapshotProps = {
  conferences: ConferenceStandings[]
  teamCount?: number
}

function SnapshotRow({team}: {team: StandingTeam}) {
  return (
    <li
      className={cn(
        'border-border flex min-w-0 flex-1 items-center gap-3 border-b border-l-4 px-3 py-2 last:border-b-0 sm:px-4',
        playoffRowClass[team.playoffStatus]
      )}
    >
      <span className='text-muted-foreground w-4 shrink-0 text-center text-sm font-medium tabular-nums'>
        {team.seed}
      </span>
      <Link
        href={`/teams/${team.id}`}
        className='hover:text-foreground flex min-w-0 flex-1 items-center gap-2 transition-colors'
      >
        {team.logo ? (
          <Image
            src={team.logo}
            alt=''
            width={24}
            height={24}
            className='h-6 w-6 shrink-0 object-contain'
          />
        ) : (
          <div className='bg-muted h-6 w-6 shrink-0 rounded-full' />
        )}
        <span className='truncate text-sm font-medium'>{team.shortName}</span>
      </Link>
      <span className='shrink-0 text-sm tabular-nums'>
        {team.wins}-{team.losses}
      </span>
      <span className='text-muted-foreground hidden w-10 shrink-0 text-right text-sm tabular-nums sm:inline'>
        {team.gamesBehind}
      </span>
    </li>
  )
}

export function StandingsSnapshot({conferences, teamCount = DEFAULT_TEAM_COUNT}: StandingsSnapshotProps) {
  if (conferences.length === 0) {
    return (
      <div className='bg-card border-border rounded-xl border p-6 text-center'>
        <p className='text-muted-foreground text-sm'>Standings are unavailable right now.</p>
      </div>
    )
  }

  return (
    <div className='flex min-w-0 flex-1 flex-col gap-4'>
      {conferences.map(conference => (
        <section
          key={conference.id}
          aria-labelledby={`snapshot-${conference.id}`}
          className='bg-card border-border flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border'
        >
          <header className='border-border flex items-center justify-between gap-3 border-b px-3 py-3 sm:px-4'>
            <h3
              id={`snapshot-${conference.id}`}
              className='font-semibold'
            >
              {conference.name}
            </h3>
            <p className='text-muted-foreground text-xs tracking-wider uppercase'>Top {teamCount}</p>
          </header>
          <ol className='flex flex-1 flex-col'>
            {conference.teams.slice(0, teamCount).map(team => (
              <SnapshotRow
                key={team.id}
                team={team}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
