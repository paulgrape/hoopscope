import {ScoreboardMiniSkeleton} from '@/components/match/scoreboard-mini-skeleton'
import {TodaysScores} from '@/components/match/todays-scores'
import {NewsStrip} from '@/components/news/news-strip'
import {JsonLd} from '@/components/seo/json-ld'
import {StandingsSnapshot} from '@/components/standings/standings-snapshot'
import {getNews} from '@/lib/news-api'
import {webPageSchema} from '@/lib/seo-schema'
import {SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, createPageMetadata} from '@/lib/site'
import {getStandings} from '@/lib/standings-api'
import type {Metadata} from 'next'
import Link from 'next/link'
import {Suspense} from 'react'

const HEADLINE_COUNT = 4

const HOME_DESCRIPTION = `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`

export const metadata: Metadata = {
  ...createPageMetadata({
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    path: '/'
  }),
  title: {
    absolute: SITE_NAME
  }
}

export default async function Home() {
  const [standings, articles] = await Promise.all([
    getStandings().catch(() => null),
    getNews(HEADLINE_COUNT, 0)
      .then(page => page.articles)
      .catch(() => [])
  ])

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={webPageSchema({
          path: '/',
          title: SITE_NAME,
          description: HOME_DESCRIPTION
        })}
      />
      <header className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <h1 className='text-xl font-semibold sm:text-2xl'>{SITE_NAME}</h1>
        <p className='text-muted-foreground text-sm'>{SITE_TAGLINE}</p>
      </header>

      <DashboardSection
        id='home-scores'
        title='Scoreboard'
        href='/match-center'
        linkLabel='Full schedule'
      >
        <Suspense fallback={<ScoreboardMiniSkeleton />}>
          <TodaysScores />
        </Suspense>
      </DashboardSection>

      <div className='grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6'>
        <DashboardSection
          id='home-news'
          title='Latest headlines'
          href='/news'
          linkLabel='All news'
        >
          <NewsStrip articles={articles} />
        </DashboardSection>

        <DashboardSection
          id='home-standings'
          title='Standings'
          subtitle={standings?.season}
          href='/standings'
          linkLabel='Full standings'
        >
          <StandingsSnapshot conferences={standings?.conferences ?? []} />
        </DashboardSection>
      </div>
    </main>
  )
}

function DashboardSection({
  id,
  title,
  subtitle,
  href,
  linkLabel,
  children
}: {
  id: string
  title: string
  subtitle?: string
  href: string
  linkLabel: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className='flex min-w-0 flex-col gap-3'
    >
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
          <h2
            id={id}
            className='text-lg font-semibold sm:text-xl'
          >
            {title}
          </h2>
          {subtitle ? <p className='text-muted-foreground text-xs tracking-wider uppercase'>{subtitle}</p> : null}
        </div>
        <Link
          href={href}
          className='text-muted-foreground hover:text-foreground text-sm transition-colors'
        >
          {linkLabel} &rarr;
        </Link>
      </div>
      <div className='flex min-w-0 flex-1 flex-col'>{children}</div>
    </section>
  )
}
