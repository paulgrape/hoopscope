import {MatchCenterTimeline} from '@/components/match/match-center-timeline'
import {MatchCenterTimelineSkeleton} from '@/components/match/match-center-timeline-skeleton'
import {JsonLd} from '@/components/seo/json-ld'
import {getOffsetMinutesForDate, getServerSchedule, getTodayDateKey, isValidDateKey} from '@/lib/games-api'
import {webPageSchema} from '@/lib/seo-schema'
import {createPageMetadata} from '@/lib/site'
import {Suspense} from 'react'

export const metadata = createPageMetadata({
  title: 'Match Center - Live NBA Scores & Schedule',
  description:
    'Browse pro basketball games by your local calendar date, including live scoreboards, final results, and upcoming tip-offs across the league.',
  path: '/match-center'
})

type MatchCenterPageProps = {
  searchParams: Promise<{date?: string}>
}

export default async function MatchCenterPage({searchParams}: MatchCenterPageProps) {
  const params = await searchParams
  const initialDate = isValidDateKey(params.date) ? params.date : getTodayDateKey()

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
            'Browse NBA games by your local calendar date, including completed scoreboards, live game state, and upcoming tip-off times.'
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm tracking-wider uppercase'>Live schedule</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>Match Center</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          Browse NBA games by your local calendar date, including completed scoreboards, live game state, and upcoming
          tip-off times.
        </p>
      </header>

      <Suspense fallback={<MatchCenterTimelineSkeleton />}>
        <ScheduleTimeline initialDate={initialDate} />
      </Suspense>
    </main>
  )
}

async function ScheduleTimeline({initialDate}: {initialDate: string}) {
  const initialGames = await getServerSchedule(initialDate, getOffsetMinutesForDate(initialDate)).catch(() => [])

  return (
    <MatchCenterTimeline
      initialDate={initialDate}
      initialGames={initialGames}
    />
  )
}
