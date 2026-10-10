import {Skeleton} from '@/components/ui/skeleton'

const PLACEHOLDER_CARDS = 4

export function ScoreboardMiniSkeleton({cards = PLACEHOLDER_CARDS}: {cards?: number}) {
  return (
    <div className='flex min-w-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          <Skeleton className='size-7 rounded-lg' />
          <Skeleton className='h-7 w-36 rounded-lg' />
          <Skeleton className='size-7 rounded-lg' />
        </div>
        <Skeleton className='h-7 w-16 rounded-lg' />
      </div>

      <div className='grid min-w-0 gap-3 sm:grid-cols-2'>
        {Array.from({length: cards}).map((_, index) => (
          <ScoreboardMiniCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export function ScoreboardMiniCardSkeleton() {
  return (
    <div className='bg-card border-border grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2.5'>
      {Array.from({length: 2}).map((_, index) => (
        <div
          key={index}
          className={`col-start-1 flex items-center gap-2 ${index === 0 ? 'row-start-1' : 'row-start-2'}`}
        >
          <Skeleton className='size-6 shrink-0 rounded-full' />
          <Skeleton className='h-4 w-10 shrink-0' />
          <Skeleton className='hidden h-4 flex-1 sm:block' />
        </div>
      ))}
      <Skeleton className='col-start-2 row-span-2 row-start-1 h-3.5 w-12 self-center' />
      <Skeleton className='col-start-3 row-start-1 ml-6 h-5 w-8' />
      <Skeleton className='col-start-3 row-start-2 ml-6 h-5 w-8' />
    </div>
  )
}
