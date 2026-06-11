import {Skeleton} from '@/components/ui/skeleton'

const TABLE_ROWS = 12
const MOBILE_CARDS = 6

export default function TeamDetailsLoading() {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <Skeleton className='h-5 w-32' />

      {/* Team header card */}
      <header className='bg-card border-border flex flex-col items-start gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:gap-8 sm:p-5'>
        <Skeleton className='h-20 w-20 shrink-0 rounded-full sm:h-25 sm:w-25' />
        <div className='flex min-w-0 flex-col gap-1 w-full max-w-sm'>
          <Skeleton className='h-3.5 w-10' />
          <Skeleton className='mt-1 h-8 w-56 sm:h-9 sm:w-72' />
          <div className='mt-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-4'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-5 w-28' />
          </div>
        </div>
      </header>

      {/* Season stats card */}
      <section className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
          <Skeleton className='h-6 w-48 sm:h-7' />
          <Skeleton className='h-9 w-full rounded-lg sm:w-44' />
        </div>

        {/* Mobile: sort control + stat cards */}
        <div className='mt-4 flex items-center gap-2 md:hidden'>
          <Skeleton className='h-5 w-14 shrink-0' />
          <Skeleton className='h-9 min-w-0 flex-1 rounded-lg' />
          <Skeleton className='h-9 w-10 shrink-0 rounded-lg' />
        </div>

        <div className='mt-3 grid gap-3 md:hidden'>
          {Array.from({length: MOBILE_CARDS}).map((_, i) => (
            <div
              key={i}
              className='bg-background/40 border-border rounded-lg border p-3'
            >
              <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
                <Skeleton className='h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10' />
                <div className='flex min-w-0 flex-col gap-1'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>
              <div className='mt-3 grid grid-cols-3 gap-2'>
                {Array.from({length: 3}).map((_, j) => (
                  <Skeleton
                    key={j}
                    className='h-12 rounded-md'
                  />
                ))}
              </div>
              <div className='mt-3 grid grid-cols-4 gap-x-2 gap-y-2 sm:grid-cols-7'>
                {Array.from({length: 6}).map((_, j) => (
                  <Skeleton
                    key={j}
                    className='h-8'
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: stats table */}
        <div className='mt-4 hidden overflow-x-auto md:block'>
          <div className='w-full min-w-xl'>
            <div className='border-border flex items-center gap-2 border-b px-2 py-2 sm:px-3'>
              <Skeleton className='h-4 min-w-40 flex-1' />
              {Array.from({length: 5}).map((_, i) => (
                <Skeleton
                  key={i}
                  className='h-4 w-10'
                />
              ))}
              <Skeleton className='hidden h-4 w-10 lg:block' />
              <Skeleton className='hidden h-4 w-10 lg:block' />
              <Skeleton className='hidden h-4 w-10 xl:block' />
              <Skeleton className='hidden h-4 w-10 xl:block' />
            </div>
            {Array.from({length: TABLE_ROWS}).map((_, i) => (
              <div
                key={i}
                className='border-border/70 flex items-center gap-2 border-b px-2 py-2.5 sm:px-3'
              >
                <div className='flex min-w-40 flex-1 items-center gap-2 sm:gap-3'>
                  <Skeleton className='h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10' />
                  <div className='flex min-w-0 flex-col gap-1'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-3 w-16' />
                  </div>
                </div>
                {Array.from({length: 5}).map((_, j) => (
                  <Skeleton
                    key={j}
                    className='h-4 w-10'
                  />
                ))}
                <Skeleton className='hidden h-4 w-10 lg:block' />
                <Skeleton className='hidden h-4 w-10 lg:block' />
                <Skeleton className='hidden h-4 w-10 xl:block' />
                <Skeleton className='hidden h-4 w-10 xl:block' />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
