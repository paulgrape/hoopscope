import Image from 'next/image'
import Link from 'next/link'

import {getTeams} from '@/lib/teams-api'

export default async function TeamsPage() {
  const teams = await getTeams()

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8'>
      <h1 className='text-3xl font-semibold'>NBA Teams</h1>
      <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {teams.map(team => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className='bg-card border-border hover:border-ring flex flex-col items-center justify-center gap-4 rounded-xl border p-6 text-center transition hover:-translate-y-1 hover:active:-translate-y-0.5 hover:active:scale-95'
          >
            {team.logo ? (
              <Image
                src={team.logo}
                alt={`${team.displayName} logo`}
                className='h-16 w-16 object-contain'
                width={64}
                height={64}
              />
            ) : (
              <div className='bg-muted h-16 w-16 rounded-full' />
            )}
            <h2 className='text-card-foreground text-lg font-semibold'>{team.displayName}</h2>
          </Link>
        ))}
      </section>
    </main>
  )
}
