import Image from 'next/image'
import Link from 'next/link'

import {createPageMetadata} from '@/lib/site'
import {getTeams} from '@/lib/teams-api'

export const metadata = createPageMetadata({
  title: 'Teams',
  description: 'All 30 pro basketball franchises with rosters and team details.',
})

export default async function TeamsPage() {
  const teams = await getTeams()

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <h1 className='text-2xl font-semibold sm:text-3xl'>NBA Teams</h1>
      <section className='grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'>
        {teams.map(team => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className='bg-card border-border hover:border-ring flex min-w-0 flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center transition active:scale-[0.98] sm:gap-4 sm:p-6 sm:hover:-translate-y-1'
          >
            {team.logo ? (
              <Image
                src={team.logo}
                alt={`${team.displayName} logo`}
                className='h-14 w-14 object-contain sm:h-16 sm:w-16'
                width={64}
                height={64}
              />
            ) : (
              <div className='bg-muted h-14 w-14 rounded-full sm:h-16 sm:w-16' />
            )}
            <h2 className='text-card-foreground truncate text-base font-semibold sm:text-lg'>{team.displayName}</h2>
          </Link>
        ))}
      </section>
    </main>
  )
}
