import {StandingsTables} from '@/components/standings-tables'
import {getStandings} from '@/lib/standings-api'
import {createPageMetadata} from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'Standings',
  description: 'Conference standings with playoff and play-in positions highlighted.',
})

export default async function StandingsPage() {
  const standings = await getStandings()

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
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
