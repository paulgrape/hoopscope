import {Skeleton} from '@/components/ui/skeleton'

export default function TeamsLoading() {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <Skeleton className='h-8 w-40 sm:h-9 sm:w-48' />
      <section className='grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'>
        {Array.from({length: 30}).map((_, i) => (
          <div
            key={i}
            className='bg-card border-border flex h-full w-full min-w-0 flex-col items-center justify-center gap-3 rounded-xl border p-4 sm:gap-4 sm:p-6'
          >
            <Skeleton className='h-14 w-14 rounded-full sm:h-16 sm:w-16' />
            <Skeleton className='h-5 w-3/4 sm:h-6' />
          </div>
        ))}
      </section>
    </main>
  )
}
