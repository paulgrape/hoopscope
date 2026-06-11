import {Skeleton} from '@/components/ui/skeleton'

const ROWS_PER_CONFERENCE = 15

function StandingRowSkeleton() {
  return (
    <tr className='border-border border-b border-l-4 border-l-transparent'>
      <td className='px-2 py-2.5 sm:px-3'>
        <Skeleton className='mx-auto h-4 w-5' />
      </td>
      <td className='px-2 py-2.5 sm:px-3'>
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <Skeleton className='h-7 w-7 shrink-0 rounded-full' />
          <Skeleton className='h-4 w-32 sm:h-5' />
        </div>
      </td>
      <td className='px-2 py-2.5 sm:px-3'>
        <Skeleton className='mx-auto h-4 w-6' />
      </td>
      <td className='px-2 py-2.5 sm:px-3'>
        <Skeleton className='mx-auto h-4 w-6' />
      </td>
      <td className='px-2 py-2.5 sm:px-3'>
        <Skeleton className='mx-auto h-4 w-9' />
      </td>
      <td className='hidden px-2 py-2.5 sm:table-cell sm:px-3'>
        <Skeleton className='mx-auto h-4 w-7' />
      </td>
      <td className='hidden px-2 py-2.5 md:table-cell md:px-3'>
        <Skeleton className='mx-auto h-4 w-10' />
      </td>
      <td className='hidden px-2 py-2.5 md:table-cell md:px-3'>
        <Skeleton className='mx-auto h-4 w-10' />
      </td>
      <td className='hidden px-2 py-2.5 lg:table-cell lg:px-3'>
        <Skeleton className='mx-auto h-4 w-8' />
      </td>
      <td className='hidden px-2 py-2.5 lg:table-cell lg:px-3'>
        <Skeleton className='mx-auto h-4 w-8' />
      </td>
    </tr>
  )
}

function ConferenceTableSkeleton() {
  return (
    <section className='bg-card border-border min-w-0 overflow-hidden rounded-xl border'>
      <header className='border-border border-b px-4 py-3 sm:px-5'>
        <Skeleton className='h-6 w-44 sm:h-7' />
      </header>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-xl text-left'>
          <thead>
            <tr className='bg-muted/40 border-border border-b'>
              <th className='px-2 py-2.5 sm:px-3'>
                <Skeleton className='mx-auto h-3.5 w-4' />
              </th>
              <th className='px-2 py-2.5 sm:px-3'>
                <Skeleton className='h-3.5 w-12' />
              </th>
              <th className='px-2 py-2.5 sm:px-3'>
                <Skeleton className='mx-auto h-3.5 w-4' />
              </th>
              <th className='px-2 py-2.5 sm:px-3'>
                <Skeleton className='mx-auto h-3.5 w-4' />
              </th>
              <th className='px-2 py-2.5 sm:px-3'>
                <Skeleton className='mx-auto h-3.5 w-8' />
              </th>
              <th className='hidden px-2 py-2.5 sm:table-cell sm:px-3'>
                <Skeleton className='mx-auto h-3.5 w-6' />
              </th>
              <th className='hidden px-2 py-2.5 md:table-cell md:px-3'>
                <Skeleton className='mx-auto h-3.5 w-10' />
              </th>
              <th className='hidden px-2 py-2.5 md:table-cell md:px-3'>
                <Skeleton className='mx-auto h-3.5 w-10' />
              </th>
              <th className='hidden px-2 py-2.5 lg:table-cell lg:px-3'>
                <Skeleton className='mx-auto h-3.5 w-7' />
              </th>
              <th className='hidden px-2 py-2.5 lg:table-cell lg:px-3'>
                <Skeleton className='mx-auto h-3.5 w-9' />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({length: ROWS_PER_CONFERENCE}).map((_, i) => (
              <StandingRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function StandingsLoading() {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <header className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-8 w-56 sm:h-9 sm:w-64' />
        <Skeleton className='h-5 w-full max-w-2xl' />
      </header>

      <div className='flex flex-col gap-5 sm:gap-6'>
        {/* Legend */}
        <div className='flex flex-wrap items-center gap-4'>
          {Array.from({length: 3}).map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-2'
            >
              <Skeleton className='size-3 rounded-sm' />
              <Skeleton className='h-4 w-32' />
            </div>
          ))}
        </div>

        <div className='grid min-w-0 gap-5 lg:grid-cols-2 lg:gap-6'>
          <ConferenceTableSkeleton />
          <ConferenceTableSkeleton />
        </div>
      </div>
    </main>
  )
}
