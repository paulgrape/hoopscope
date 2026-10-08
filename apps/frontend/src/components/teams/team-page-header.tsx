import type {TeamDetails} from '@/lib/teams-api'
import Image from 'next/image'

type TeamPageHeaderProps = {
  team: TeamDetails
}

export function TeamPageHeader({team}: TeamPageHeaderProps) {
  return (
    <header className='bg-card border-border flex flex-col items-start gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:gap-8 sm:p-5'>
      {team.logo ? (
        <Image
          src={team.logo}
          alt={`${team.displayName} logo`}
          className='h-20 w-20 shrink-0 object-contain sm:h-25 sm:w-25'
          width={100}
          height={100}
        />
      ) : (
        <div className='bg-muted h-20 w-20 shrink-0 rounded-full sm:h-25 sm:w-25' />
      )}
      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs tracking-wider uppercase'>{team.abbreviation}</p>
        <h1 className='text-card-foreground mt-1 text-2xl font-semibold sm:text-3xl'>{team.displayName}</h1>
        <div className='text-muted-foreground mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-4'>
          <p>
            <span className='text-foreground'>Location:</span> {team.location}
          </p>
          <p>
            <span className='text-foreground'>Record:</span> {team.record?.summary ?? 'N/A'}
            {team.record?.seasonLabel ? ` (${team.record.seasonLabel})` : ''}
          </p>
        </div>
      </div>
    </header>
  )
}

export function TeamFacts({team}: TeamPageHeaderProps) {
  const items = [
    {label: 'Conference', value: team.conference},
    {label: 'Division', value: team.division},
    {label: 'Arena', value: team.venue},
    {label: 'Location', value: team.venueLocation},
    {label: 'Home', value: team.record?.home},
    {label: 'Road', value: team.record?.road},
    {label: 'Division record', value: team.record?.divisionRecord},
    {label: 'Conference record', value: team.record?.conferenceRecord},
    {label: 'PPG', value: team.record?.pointsPerGame},
    {label: 'Opponent PPG', value: team.record?.opponentPointsPerGame},
    {label: 'Streak', value: team.record?.streak},
    {label: 'Playoff seed', value: team.record?.playoffSeed},
    {label: 'Head coach', value: team.coach}
  ].filter((item): item is {label: string; value: string} => Boolean(item.value))

  if (items.length === 0) return null

  return (
    <section className='bg-card border-border rounded-xl border p-3 sm:p-5'>
      <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Team details</h2>
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
