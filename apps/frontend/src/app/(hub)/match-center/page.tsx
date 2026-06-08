import {MatchCenterTimeline} from '@/components/match-center-timeline'
import {createPageMetadata} from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'Match Center',
  description:
    'Browse pro basketball games by your local calendar date, including live scoreboards and upcoming tip-offs.',
})

export default function MatchCenterPage() {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Live schedule</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>Match Center</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          Browse NBA games by your local calendar date, including completed scoreboards, live game
          state, and upcoming tip-off times.
        </p>
      </header>

      <MatchCenterTimeline />
    </main>
  )
}
