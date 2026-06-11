import {Skeleton} from '@/components/ui/skeleton'

const CAREER_ROWS = 8
const NEWS_CARDS = 4

function SectionToggleHeader() {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
      <Skeleton className='h-6 w-48 sm:h-7' />
      <Skeleton className='h-9 w-full rounded-lg sm:w-44' />
    </div>
  )
}

export default function PlayerDetailsLoading() {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <Skeleton className='h-5 w-36' />

      {/* Player header */}
      <header className='bg-card border-border flex flex-col items-start gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:gap-8 sm:p-5'>
        <Skeleton className='h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28' />
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='mt-1 h-8 w-56 sm:h-9 sm:w-72' />
          <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-5 w-28' />
            <Skeleton className='h-5 w-24' />
          </div>
        </div>
      </header>

      {/* Bio grid */}
      <section className='bg-card border-border rounded-xl border p-3 sm:p-5'>
        <Skeleton className='h-6 w-12 sm:h-7' />
        <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
          {Array.from({length: 6}).map((_, i) => (
            <div
              key={i}
              className='bg-background/40 border-border flex flex-col gap-2 rounded-lg border px-3 py-2.5'
            >
              <Skeleton className='h-3 w-14' />
              <Skeleton className='h-4 w-20' />
            </div>
          ))}
        </div>
      </section>

      {/* Season stats */}
      <section className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'>
        <SectionToggleHeader />
        <div className='mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9'>
          {Array.from({length: 9}).map((_, i) => (
            <div
              key={i}
              className='bg-background/40 border-border flex flex-col items-center gap-2 rounded-lg border px-2 py-2'
            >
              <Skeleton className='h-3 w-8' />
              <Skeleton className='h-5 w-10' />
            </div>
          ))}
        </div>
      </section>

      {/* Career stats */}
      <section className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'>
        <SectionToggleHeader />

        {/* Mobile: season cards */}
        <div className='mt-4 grid gap-3 md:hidden'>
          {Array.from({length: 4}).map((_, i) => (
            <div
              key={i}
              className='bg-background/40 border-border rounded-lg border p-3'
            >
              <div className='flex items-start justify-between gap-3'>
                <Skeleton className='h-5 w-20' />
                <Skeleton className='h-5 w-10' />
              </div>
              <div className='mt-3 grid grid-cols-4 gap-2'>
                {Array.from({length: 4}).map((_, j) => (
                  <Skeleton
                    key={j}
                    className='h-9'
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: career table */}
        <div className='mt-4 hidden overflow-x-auto md:block'>
          <div className='w-full min-w-xl'>
            <div className='border-b px-2 py-2 sm:px-3'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-12' />
                <div className='ml-auto flex items-center gap-6'>
                  {Array.from({length: 5}).map((_, i) => (
                    <Skeleton
                      key={i}
                      className='h-4 w-10'
                    />
                  ))}
                  <Skeleton className='hidden h-4 w-10 sm:block' />
                </div>
              </div>
            </div>
            {Array.from({length: CAREER_ROWS}).map((_, i) => (
              <div
                key={i}
                className='border-border/70 border-b px-2 py-2.5 sm:px-3'
              >
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-12' />
                  <div className='ml-auto flex items-center gap-6'>
                    {Array.from({length: 5}).map((_, j) => (
                      <Skeleton
                        key={j}
                        className='h-4 w-10'
                      />
                    ))}
                    <Skeleton className='hidden h-4 w-10 sm:block' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className='bg-card border-border rounded-xl border p-3 sm:p-5'>
        <Skeleton className='h-6 w-16 sm:h-7' />
        <div className='mt-4 grid gap-3 sm:grid-cols-2'>
          {Array.from({length: NEWS_CARDS}).map((_, i) => (
            <div
              key={i}
              className='bg-background/40 border-border rounded-lg border p-3'
            >
              <Skeleton className='aspect-[16/9] w-full rounded-lg' />
              <div className='mt-3 flex flex-col gap-2'>
                <Skeleton className='h-3.5 w-32' />
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-2/3' />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
