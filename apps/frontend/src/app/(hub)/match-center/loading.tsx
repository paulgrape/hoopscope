import {MatchCenterTimelineSkeleton} from '@/components/match/match-center-timeline-skeleton'
import {Skeleton} from '@/components/ui/skeleton'

export default function MatchCenterLoading() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <header className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-8 w-56 sm:h-9 sm:w-64' />
        <Skeleton className='h-5 w-full max-w-2xl' />
      </header>

      <MatchCenterTimelineSkeleton />
    </main>
  )
}
