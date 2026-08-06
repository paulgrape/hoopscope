import {Skeleton} from '@/components/ui/skeleton'

const PLACEHOLDER_CARDS = 4

export function MatchCenterTimelineSkeleton() {
  return (
    <section className='flex min-w-0 flex-col gap-5 sm:gap-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          <Skeleton className='size-8 rounded-lg' />
          <Skeleton className='h-8 w-44 rounded-lg' />
          <Skeleton className='size-8 rounded-lg' />
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Skeleton className='h-8 w-20 rounded-lg' />
          <Skeleton className='h-8 w-32 rounded-lg' />
        </div>
      </div>

      <Skeleton className='h-5 w-56' />

      <div className='relative flex min-w-0 flex-col gap-3 sm:gap-4'>
        <div className='bg-border absolute top-2 bottom-2 left-4 hidden w-px md:block' />
        {Array.from({length: PLACEHOLDER_CARDS}).map((_, index) => (
          <GameTimelineCardSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}

export function GameTimelineCardSkeleton() {
  return (
    <article className='relative md:pl-12'>
      <div className='bg-background border-border absolute top-7 left-2 hidden h-5 w-5 rounded-full border-4 md:block' />
      <div className='bg-card border-border rounded-xl border p-3 sm:p-5'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div className='flex min-w-0 flex-col gap-1.5'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-5 w-32 sm:h-6' />
            <Skeleton className='h-4 w-40' />
          </div>
          <Skeleton className='h-7 w-32 rounded-full' />
        </div>

        <div className='mt-4 grid gap-2 sm:mt-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4'>
          <TeamPanelSkeleton />
          <Skeleton className='mx-auto my-1 h-4 w-6' />
          <TeamPanelSkeleton align='right' />
        </div>
      </div>
    </article>
  )
}

function TeamPanelSkeleton({align = 'left'}: {align?: 'left' | 'right'}) {
  return (
    <div
      className={`bg-background/40 flex min-w-0 items-center gap-3 rounded-lg p-3 md:bg-transparent md:p-0 ${
        align === 'right' ? 'md:flex-row-reverse' : ''
      }`}
    >
      <Skeleton className='h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12' />
      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${align === 'right' ? 'md:items-end' : ''}`}>
        <Skeleton className='h-4 w-10' />
        <Skeleton className='h-4 w-28' />
      </div>
    </div>
  )
}
