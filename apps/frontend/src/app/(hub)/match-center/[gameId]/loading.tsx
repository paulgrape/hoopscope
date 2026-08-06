import {Skeleton} from '@/components/ui/skeleton'

const LINE_SCORE_COLUMNS = 4
const BOX_SCORE_ROWS = 8
const LEADER_CARDS = 3

function TeamScorePanelSkeleton({align = 'left'}: {align?: 'left' | 'right'}) {
  return (
    <div
      className={`bg-muted/30 flex min-w-0 items-center gap-3 rounded-lg p-3 md:bg-transparent md:p-0 ${
        align === 'right' ? 'md:flex-row-reverse' : ''
      }`}
    >
      <Skeleton className='size-12 shrink-0 rounded-full sm:size-14' />
      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${align === 'right' ? 'md:items-end' : ''}`}>
        <Skeleton className='h-5 w-12 sm:h-6' />
        <Skeleton className='h-4 w-32' />
      </div>
      <Skeleton className='h-8 w-14 shrink-0 md:h-11 md:w-20' />
    </div>
  )
}

export default function MatchLoading() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <Skeleton className='h-5 w-40' />

      <header>
        <Skeleton className='h-8 w-full max-w-sm sm:h-9' />
      </header>

      <div className='flex flex-col gap-6 sm:gap-8'>
        {/* Scoreboard */}
        <section className='bg-card border-border rounded-xl border p-4 sm:p-6'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex flex-col gap-1.5'>
              <Skeleton className='h-4 w-56' />
              <Skeleton className='h-4 w-40' />
            </div>
            <Skeleton className='h-7 w-28 rounded-full' />
          </div>

          <div className='mt-6 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4'>
            <TeamScorePanelSkeleton />
            <Skeleton className='mx-auto h-4 w-6' />
            <TeamScorePanelSkeleton align='right' />
          </div>

          <div className='border-border mt-6 overflow-hidden rounded-lg border'>
            <div className='bg-muted/40 flex items-center gap-3 px-3 py-2'>
              <Skeleton className='h-3.5 w-12' />
              <div className='ml-auto flex items-center gap-4'>
                {Array.from({length: LINE_SCORE_COLUMNS + 1}).map((_, index) => (
                  <Skeleton
                    key={index}
                    className='h-3.5 w-6'
                  />
                ))}
              </div>
            </div>
            {Array.from({length: 2}).map((_, row) => (
              <div
                key={row}
                className='border-border flex items-center gap-3 border-t px-3 py-2'
              >
                <Skeleton className='h-4 w-10' />
                <div className='ml-auto flex items-center gap-4'>
                  {Array.from({length: LINE_SCORE_COLUMNS + 1}).map((_, index) => (
                    <Skeleton
                      key={index}
                      className='h-4 w-6'
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Box score */}
        <section className='flex flex-col gap-3'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-9 w-full sm:w-48' />
          <div className='border-border flex flex-col gap-2 rounded-xl border p-3'>
            {Array.from({length: BOX_SCORE_ROWS}).map((_, index) => (
              <div
                key={index}
                className='flex items-center gap-3'
              >
                <Skeleton className='h-4 w-32 sm:w-40' />
                <Skeleton className='ml-auto h-4 w-10' />
                <Skeleton className='hidden h-4 w-10 sm:block' />
                <Skeleton className='hidden h-4 w-10 md:block' />
                <Skeleton className='h-4 w-8' />
              </div>
            ))}
          </div>
        </section>

        {/* Team totals */}
        <section className='flex flex-col gap-3'>
          <Skeleton className='h-6 w-32' />
          <div className='border-border flex max-w-xl flex-col gap-2 rounded-xl border p-3'>
            {Array.from({length: 5}).map((_, index) => (
              <div
                key={index}
                className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3'
              >
                <Skeleton className='h-4 w-10' />
                <Skeleton className='h-4 w-24 sm:w-32' />
                <Skeleton className='h-4 w-10 justify-self-end' />
              </div>
            ))}
          </div>
        </section>

        {/* Leaders */}
        <section className='flex flex-col gap-3'>
          <Skeleton className='h-6 w-24' />
          <div className='border-border divide-border grid divide-y rounded-xl border sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
            {Array.from({length: LEADER_CARDS}).map((_, index) => (
              <div
                key={index}
                className='flex items-center gap-3 p-3 sm:flex-col sm:items-start sm:p-4'
              >
                <Skeleton className='hidden h-3.5 w-20 sm:block' />
                <div className='flex min-w-0 flex-1 items-center gap-3 sm:w-full'>
                  <Skeleton className='size-11 shrink-0 rounded-full' />
                  <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
                    <Skeleton className='h-4 w-28' />
                    <Skeleton className='h-4 w-12' />
                  </div>
                  <Skeleton className='h-6 w-10 shrink-0' />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
