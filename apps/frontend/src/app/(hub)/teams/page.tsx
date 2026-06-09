import {TeamCard} from '@/components/team-card'
import {createPageMetadata} from '@/lib/site'
import {getTeams} from '@/lib/teams-api'

export const metadata = createPageMetadata({
  title: 'Teams',
  description: 'All 30 pro basketball franchises with rosters and team details.'
})

export default async function TeamsPage() {
  const teams = await getTeams()

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <h1 className='text-2xl font-semibold sm:text-3xl'>NBA Teams</h1>
      <section className='grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'>
        {teams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
          />
        ))}
      </section>
    </main>
  )
}
