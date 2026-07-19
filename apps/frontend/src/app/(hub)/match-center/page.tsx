import {Suspense} from 'react'

import {JsonLd} from '@/components/json-ld'
import {MatchCenterTimeline} from '@/components/match-center-timeline'
import {Skeleton} from '@/components/ui/skeleton'
import {webPageSchema} from '@/lib/seo-schema'
import {
  getOffsetMinutesForDate,
  getServerSchedule,
  getTodayDateKey,
  isValidDateKey,
} from '@/lib/games-api'
import {createPageMetadata} from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'Match Center - Live NBA Scores & Schedule',
  description:
    'Browse pro basketball games by your local calendar date, including live scoreboards, final results, and upcoming tip-offs across the league.',
  path: '/match-center',
})

type MatchCenterPageProps = {
  searchParams: Promise<{date?: string}>
}

export default async function MatchCenterPage({searchParams}: MatchCenterPageProps) {
  const params = await searchParams
  const today = getTodayDateKey()
  const initialDate = isValidDateKey(params.date) ? params.date : today
  const initialGames = await getServerSchedule(
    initialDate,
    getOffsetMinutesForDate(initialDate),
  ).catch(() => [])

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={webPageSchema({
          path: '/match-center',
          title: 'Match Center',
          description:
            'Browse NBA games by your local calendar date, including completed scoreboards, live game state, and upcoming tip-off times.',
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Live schedule</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>Match Center</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          Browse NBA games by your local calendar date, including completed scoreboards, live game
          state, and upcoming tip-off times.
        </p>
      </header>

      <Suspense fallback={<MatchCenterTimelineFallback />}>
        <MatchCenterTimeline initialDate={initialDate} initialGames={initialGames} />
      </Suspense>
    </main>
  )
}

function MatchCenterTimelineFallback() {
  return (
    <section className='flex min-w-0 flex-col gap-5 sm:gap-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <Skeleton className='size-8 rounded-lg' />
        <Skeleton className='h-8 w-44 rounded-lg' />
        <Skeleton className='size-8 rounded-lg' />
      </div>
      {Array.from({length: 3}).map((_, index) => (
        <Skeleton key={index} className='h-40 w-full rounded-xl' />
      ))}
    </section>
  )
}
