import {Skeleton} from '@/components/ui/skeleton'

function ArticleSkeleton({withImage = true}: {withImage?: boolean}) {
  return (
    <div className='flex h-full flex-col gap-3'>
      <div className='flex items-center justify-between gap-3'>
        <Skeleton className='h-4 w-6' />
        <Skeleton className='h-5 w-16 rounded-sm' />
      </div>
      {withImage ? <Skeleton className='aspect-video w-full rounded-none' /> : null}
      <Skeleton className='h-5 w-full' />
      <Skeleton className='h-5 w-3/4' />
      <div className='flex flex-col gap-1.5'>
        <Skeleton className='h-3.5 w-full' />
        <Skeleton className='h-3.5 w-5/6' />
      </div>
    </div>
  )
}

export default function NewsLoading() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <header className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-8 w-48 sm:h-9 sm:w-64' />
        <Skeleton className='h-5 w-full max-w-2xl' />
      </header>

      <section className='bg-card border-border overflow-hidden rounded-xl border'>
        {/* Masthead */}
        <div className='border-border flex flex-col items-center gap-2 border-b px-4 py-5 sm:px-8 sm:py-6'>
          <Skeleton className='h-3 w-32 sm:h-4' />
          <Skeleton className='mt-2 h-9 w-64 sm:h-12 sm:w-80 lg:h-14 lg:w-96' />
          <div className='border-border mt-4 flex w-full max-w-xl items-center justify-center gap-4 border-y py-2'>
            <Skeleton className='h-3.5 w-28' />
            <Skeleton className='hidden h-3.5 w-24 sm:block' />
            <Skeleton className='hidden h-3.5 w-12 sm:block' />
          </div>
        </div>

        <div className='grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
          {/* Lead story + sub-leads */}
          <div className='border-border flex flex-col border-b lg:border-r lg:border-b-0'>
            <div className='flex flex-col gap-4 p-4 sm:p-6'>
              <Skeleton className='aspect-video w-full rounded-none' />
              <div className='flex flex-col gap-3'>
                <div className='flex flex-wrap items-center gap-3'>
                  <Skeleton className='h-5 w-24 rounded-none' />
                  <Skeleton className='h-5 w-16 rounded-sm' />
                </div>
                <Skeleton className='h-8 w-full sm:h-9 lg:h-10' />
                <Skeleton className='h-8 w-2/3 sm:h-9 lg:h-10' />
                <div className='flex max-w-3xl flex-col gap-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-4/5' />
                </div>
                <Skeleton className='h-3.5 w-40' />
              </div>
            </div>

            <div className='border-border divide-border grid flex-1 divide-y border-t sm:grid-cols-2 sm:divide-x sm:divide-y-0'>
              {Array.from({length: 2}).map((_, index) => (
                <div
                  key={index}
                  className='p-4 sm:p-5'
                >
                  <ArticleSkeleton />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className='divide-border flex flex-col divide-y'>
            {Array.from({length: 3}).map((_, index) => (
              <div
                key={index}
                className='p-4 sm:p-5'
              >
                <ArticleSkeleton withImage={index === 0} />
              </div>
            ))}
          </aside>
        </div>

        {/* Around the league */}
        <div className='border-border border-t'>
          <div className='border-border flex justify-center border-b px-4 py-2 sm:px-6'>
            <Skeleton className='h-3.5 w-40' />
          </div>
          <div className='grid sm:grid-cols-2 xl:grid-cols-4'>
            {Array.from({length: 4}).map((_, index) => (
              <div
                key={index}
                className='border-border border-b p-4 last:border-b-0 sm:border-b-0 sm:p-5'
              >
                <ArticleSkeleton />
              </div>
            ))}
          </div>
        </div>

        {/* Briefs */}
        <div className='border-border border-t px-4 py-4 sm:px-6 sm:py-5'>
          <div className='mb-3 flex justify-center'>
            <Skeleton className='h-3.5 w-20' />
          </div>
          <div className='grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({length: 3}).map((_, index) => (
              <Skeleton
                key={index}
                className='h-4 w-full'
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pagination */}
      <nav className='flex items-center justify-between gap-4'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-20' />
      </nav>
    </main>
  )
}
