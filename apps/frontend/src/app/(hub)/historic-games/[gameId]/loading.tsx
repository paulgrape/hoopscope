import {Skeleton} from '@/components/ui/skeleton'

const PLAY_ROWS = 8
const TRANSPORT_BUTTONS = 7

function TeamScoreSkeleton({align = 'left'}: {align?: 'left' | 'right'}) {
  return (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <Skeleton className='size-10 shrink-0 rounded-full sm:size-14' />
      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${align === 'right' ? 'items-end' : ''}`}>
        <Skeleton className='h-4 w-10' />
        <Skeleton className='h-4 w-28' />
      </div>
      <Skeleton className='h-8 w-12 shrink-0 sm:h-12 sm:w-16' />
    </div>
  )
}

export default function HistoricGameLoading() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <Skeleton className='h-5 w-64' />

      <header className='flex flex-col gap-1.5'>
        <Skeleton className='h-4 w-36' />
        <Skeleton className='h-8 w-full max-w-md sm:h-9' />
        <Skeleton className='h-5 w-full max-w-lg' />
      </header>

      <section className='grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]'>
        <div className='flex min-w-0 flex-col gap-4'>
          {/* Scoreboard */}
          <div className='bg-card border-border rounded-xl border p-3 sm:p-5'>
            <div className='flex items-center justify-between gap-3'>
              <Skeleton className='h-6 w-28 rounded-full' />
              <Skeleton className='h-4 w-24' />
            </div>

            <div className='mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4'>
              <TeamScoreSkeleton />
              <div className='flex flex-col items-center gap-1.5'>
                <Skeleton className='h-3.5 w-10' />
                <Skeleton className='h-7 w-20 sm:h-8' />
              </div>
              <TeamScoreSkeleton align='right' />
            </div>

            <div className='border-border mt-4 border-t pt-3'>
              <Skeleton className='h-4 w-2/3' />
            </div>
          </div>

          {/* Transport */}
          <div className='bg-card border-border flex flex-wrap items-center gap-2 rounded-xl border p-3 sm:gap-3 sm:p-4'>
            <div className='flex items-center gap-1'>
              {Array.from({length: TRANSPORT_BUTTONS}).map((_, index) => (
                <Skeleton
                  key={index}
                  className='size-7 rounded-lg'
                />
              ))}
            </div>
            <div className='ml-auto flex items-center gap-1'>
              {Array.from({length: 4}).map((_, index) => (
                <Skeleton
                  key={index}
                  className='h-6 w-11 rounded-full'
                />
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className='bg-card border-border rounded-xl border p-3 sm:p-4'>
            <Skeleton className='h-2.5 w-full rounded-full' />
            <div className='mt-2 flex gap-2'>
              {Array.from({length: 4}).map((_, index) => (
                <Skeleton
                  key={index}
                  className='h-3.5 flex-1'
                />
              ))}
            </div>
            <div className='mt-3 flex flex-wrap justify-between gap-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-28' />
            </div>
          </div>

          {/* Detail tabs */}
          <div className='flex flex-col gap-3'>
            <Skeleton className='h-8 w-full sm:w-64' />
            <Skeleton className='h-28 w-full rounded-xl' />
          </div>
        </div>

        {/* Play-by-play */}
        <aside className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-4'>
          <div className='flex items-baseline justify-between gap-3'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-4 w-16' />
          </div>

          <div className='mt-3 flex flex-wrap gap-1.5'>
            {Array.from({length: 4}).map((_, index) => (
              <Skeleton
                key={index}
                className='h-6 w-16 rounded-full'
              />
            ))}
          </div>

          <ol className='mt-3 flex max-h-96 flex-col gap-2 overflow-hidden'>
            {Array.from({length: PLAY_ROWS}).map((_, index) => (
              <li
                key={index}
                className='border-border bg-background/60 rounded-lg border p-2.5'
              >
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <Skeleton className='h-3.5 w-24' />
                  <Skeleton className='h-3.5 w-28' />
                </div>
                <Skeleton className='mt-2 h-4 w-5/6' />
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  )
}
