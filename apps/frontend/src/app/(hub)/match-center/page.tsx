import {MatchCenterTimeline} from '@/components/match-center-timeline'

export default function MatchCenterPage() {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8'>
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Live schedule</p>
        <h1 className='text-3xl font-semibold'>Match Center</h1>
        <p className='text-muted-foreground max-w-2xl'>
          Browse NBA games by your local calendar date, including completed scoreboards, live game
          state, and upcoming tip-off times.
        </p>
      </header>

      <MatchCenterTimeline />
    </main>
  )
}
