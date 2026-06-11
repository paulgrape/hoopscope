import {Skeleton} from '@/components/ui/skeleton'

const GAME_CARDS = 6

function TeamBlockSkeleton({align = 'left'}: {align?: 'left' | 'right'}) {
  return (
    <div
      className={`bg-background/40 flex min-w-0 items-center gap-3 rounded-lg p-3 sm:bg-transparent sm:p-0 ${
        align === 'right' ? 'sm:flex-row-reverse' : ''
      }`}
    >
      <Skeleton className='h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12' />
      <div className={`flex min-w-0 flex-col gap-1 ${align === 'right' ? 'sm:items-end' : ''}`}>
        <Skeleton className='h-4 w-10' />
        <Skeleton className='h-4 w-24' />
      </div>
    </div>
  )
}

export default function HistoricGamesLoading() {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <header className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-8 w-64 sm:h-9 sm:w-72' />
        <Skeleton className='h-5 w-full max-w-2xl' />
      </header>

      <section className='grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-2'>
        {Array.from({length: GAME_CARDS}).map((_, i) => (
          <div
            key={i}
            className='bg-card border-border flex min-w-0 flex-col gap-4 rounded-xl border p-3 sm:gap-5 sm:p-5'
          >
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-5 w-14 rounded-full' />
            </div>

            <div className='grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4'>
              <TeamBlockSkeleton />
              <div className='flex flex-col items-center gap-1.5 text-center'>
                <Skeleton className='h-8 w-24 sm:h-9' />
                <Skeleton className='h-3 w-10' />
              </div>
              <TeamBlockSkeleton align='right' />
            </div>

            <div className='flex min-w-0 flex-col gap-2'>
              <Skeleton className='h-5 w-3/4 sm:h-6' />
              <Skeleton className='h-4 w-48' />
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
