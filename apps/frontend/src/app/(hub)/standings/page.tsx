import {JsonLd} from '@/components/json-ld'
import {StandingsTables} from '@/components/standings-tables'
import {collectionPageSchema} from '@/lib/seo-schema'
import {getStandings} from '@/lib/standings-api'
import {createPageMetadata} from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'NBA Standings - Conference & Playoff Race',
  description:
    'Live pro basketball conference standings on Hoopscope, with playoff seeding and play-in tournament positions clearly highlighted for both conferences.',
  path: '/standings',
})

export default async function StandingsPage() {
  const standings = await getStandings()

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={collectionPageSchema({
          path: '/standings',
          title: 'NBA Standings',
          description: 'Conference standings with playoff and play-in positions highlighted.',
          items: standings.conferences.flatMap(conference =>
            conference.teams.map(team => ({
              name: team.displayName,
              url: `/teams/${team.id}`,
            })),
          ),
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>{standings.season}</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>NBA Standings</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          Conference tables with playoff and play-in positions highlighted.
        </p>
      </header>

      <StandingsTables conferences={standings.conferences} />
    </main>
  )
}
