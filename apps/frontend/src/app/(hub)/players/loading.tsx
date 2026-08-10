import {Skeleton} from '@/components/ui/skeleton'

export default function PlayersLoading() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-8 w-48 sm:h-9 sm:w-56' />
        <Skeleton className='h-4 w-full max-w-2xl' />
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <Skeleton className='h-14 flex-1' />
        <Skeleton className='h-14 sm:w-64' />
      </div>

      <Skeleton className='h-4 w-28' />

      <section className='grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'>
        {Array.from({length: 12}).map((_, index) => (
          <div
            key={index}
            className='bg-card border-border flex min-w-0 items-center gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4'
          >
            <Skeleton className='h-12 w-12 shrink-0 rounded-full sm:h-14 sm:w-14' />
            <div className='flex min-w-0 flex-1 flex-col gap-2'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
