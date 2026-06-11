import {Skeleton} from '@/components/ui/skeleton'

const PLAY_ROWS = 8

function TeamScoreSkeleton({align = 'left'}: {align?: 'left' | 'right'}) {
  return (
    <div
      className={`bg-background/40 flex min-w-0 items-center gap-3 rounded-lg p-3 md:bg-transparent md:p-0 ${
        align === 'right' ? 'md:flex-row-reverse' : ''
      }`}
    >
      <Skeleton className='h-12 w-12 shrink-0 rounded-full sm:h-14 sm:w-14 md:h-16 md:w-16' />
      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${align === 'right' ? 'md:items-end' : ''}`}>
        <Skeleton className='h-4 w-10' />
        <Skeleton className='h-5 w-28 sm:h-6' />
        <Skeleton className='mt-2 hidden h-12 w-16 md:block' />
      </div>
      <Skeleton className='h-9 w-12 shrink-0 md:hidden' />
    </div>
  )
}

export default function HistoricGameLoading() {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <Skeleton className='h-5 w-44' />

      <header className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-8 w-full max-w-md sm:h-9' />
        <Skeleton className='h-5 w-full max-w-2xl' />
      </header>

      <section className='grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]'>
        {/* Scoreboard */}
        <div className='bg-card border-border rounded-xl border p-3 sm:p-6'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <Skeleton className='h-4 w-36' />
            <Skeleton className='h-5 w-24 rounded-full' />
          </div>

          <div className='mt-5 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center'>
            <Skeleton className='col-span-4 h-5 w-24 sm:col-span-1' />
            {Array.from({length: 4}).map((_, i) => (
              <Skeleton
                key={i}
                className='h-7 rounded-full sm:w-12'
              />
            ))}
          </div>

          <div className='mt-6 grid gap-3 sm:mt-8 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4'>
            <div className='bg-background/40 flex flex-col items-center gap-2 rounded-lg p-3 md:hidden'>
              <Skeleton className='h-3.5 w-16' />
              <Skeleton className='h-8 w-20 sm:h-9' />
              <Skeleton className='h-4 w-14' />
            </div>
            <TeamScoreSkeleton />
            <div className='hidden flex-col items-center gap-2 md:flex'>
              <Skeleton className='h-3.5 w-16' />
              <Skeleton className='h-9 w-24' />
              <Skeleton className='h-4 w-14' />
            </div>
            <TeamScoreSkeleton align='right' />
          </div>

          <div className='mt-6 sm:mt-8'>
            <Skeleton className='h-3 w-full rounded-full' />
            <div className='mt-2 flex flex-wrap justify-between gap-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-8' />
            </div>
          </div>
        </div>

        {/* Play-by-play */}
        <aside className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-6'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex min-w-0 flex-col gap-2'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-4 w-40' />
            </div>
            <Skeleton className='h-5 w-12 rounded-full' />
          </div>

          <ol className='mt-5 flex max-h-136 flex-col gap-3 overflow-hidden sm:pr-2'>
            {Array.from({length: PLAY_ROWS}).map((_, i) => (
              <li
                key={i}
                className='border-border bg-background/60 rounded-lg border p-3'
              >
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <Skeleton className='h-3.5 w-16' />
                  <Skeleton className='h-3.5 w-24' />
                </div>
                <div className='mt-2 flex flex-col gap-1.5'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-2/3' />
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  )
}
