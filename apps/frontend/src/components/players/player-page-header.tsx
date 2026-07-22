import type {PlayerProfile} from '@/lib/players-api'
import Image from 'next/image'
import Link from 'next/link'

type PlayerPageHeaderProps = {
  player: PlayerProfile
}

export function PlayerPageHeader({player}: PlayerPageHeaderProps) {
  return (
    <header className='bg-card border-border flex flex-col items-start gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:gap-8 sm:p-5'>
      {player.headshot ? (
        <Image
          src={player.headshot}
          alt={player.fullName}
          width={120}
          height={120}
          className='h-24 w-24 shrink-0 rounded-full object-cover sm:h-28 sm:w-28'
        />
      ) : (
        <div className='bg-muted h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28' />
      )}

      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          {player.latestTeam ? (
            <Link
              href={`/teams/${player.latestTeam.id}`}
              className='text-muted-foreground hover:text-foreground text-xs tracking-wider uppercase underline-offset-4 hover:underline'
            >
              {player.latestTeam.displayName}
            </Link>
          ) : null}
          {player.injury ? (
            <span className='bg-destructive/15 text-destructive rounded-full px-2.5 py-0.5 text-xs font-medium'>
              {player.injury.status}
              {player.injury.type ? ` · ${player.injury.type}` : ''}
            </span>
          ) : null}
        </div>

        <h1 className='text-card-foreground mt-1 text-2xl font-semibold sm:text-3xl'>{player.fullName}</h1>

        <div className='text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm'>
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

        {player.injury?.detail ? <p className='text-muted-foreground mt-3 text-sm'>{player.injury.detail}</p> : null}
      </div>
    </header>
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
