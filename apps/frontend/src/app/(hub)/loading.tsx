import {ScoreboardMiniSkeleton} from '@/components/match/scoreboard-mini-skeleton'
import {Skeleton} from '@/components/ui/skeleton'

const SNAPSHOT_ROWS = 6
const HEADLINE_CARDS = 4

function SectionHeadingSkeleton() {
  return (
    <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
      <Skeleton className='h-6 w-40 sm:h-7 sm:w-48' />
      <Skeleton className='h-4 w-28' />
    </div>
  )
}

function ConferenceSkeleton() {
  return (
    <div className='bg-card border-border flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border'>
      <div className='border-border flex items-center justify-between gap-3 border-b px-3 py-3 sm:px-4'>
        <Skeleton className='h-5 w-36' />
        <Skeleton className='h-3.5 w-12' />
      </div>
      <div className='flex flex-1 flex-col'>
        {Array.from({length: SNAPSHOT_ROWS}).map((_, row) => (
          <div
            key={row}
            className='border-border flex flex-1 items-center gap-3 border-b px-3 py-2.5 last:border-b-0 sm:px-4'
          >
            <Skeleton className='size-6 shrink-0 rounded-full' />
            <Skeleton className='h-4 flex-1' />
            <Skeleton className='h-4 w-12 shrink-0' />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomeLoading() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <header className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <Skeleton className='h-7 w-40 sm:h-8' />
        <Skeleton className='h-4 w-48' />
      </header>

      <section className='flex min-w-0 flex-col gap-3'>
        <SectionHeadingSkeleton />
        <ScoreboardMiniSkeleton />
      </section>

      <div className='grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6'>
        <section className='flex min-w-0 flex-col gap-3'>
          <SectionHeadingSkeleton />
          <div className='grid min-w-0 flex-1 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4'>
            {Array.from({length: HEADLINE_CARDS}).map((_, card) => (
              <div
                key={card}
                className='bg-card border-border flex flex-col gap-2 rounded-xl border p-3 sm:p-4'
              >
                <Skeleton className='aspect-3/2 w-full rounded-lg' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-2/3' />
                <Skeleton className='h-3 w-24' />
              </div>
            ))}
          </div>
        </section>

        <section className='flex min-w-0 flex-col gap-3'>
          <SectionHeadingSkeleton />
          <div className='flex min-w-0 flex-1 flex-col gap-4'>
            {Array.from({length: 2}).map((_, conference) => (
              <ConferenceSkeleton key={conference} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
