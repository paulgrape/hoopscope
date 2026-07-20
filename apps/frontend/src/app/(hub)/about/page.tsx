import Image from 'next/image'

import {JsonLd} from '@/components/json-ld'
import {webPageSchema} from '@/lib/seo-schema'
import {createPageMetadata, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE} from '@/lib/site'

const PAGE_DESCRIPTION = `The story behind ${SITE_NAME} — a non-commercial pro basketball hub built with a great love for the game.`

export const metadata = createPageMetadata({
  title: 'About',
  description: PAGE_DESCRIPTION,
  path: '/about',
})

const dataSources = [
  {
    name: 'ESPN public APIs',
    href: 'https://github.com/pseudo-r/Public-ESPN-API',
    detail: 'Scores, schedules, teams, rosters, standings, and headlines.',
  },
  {
    name: 'NBA Stats',
    href: 'https://www.nba.com/stats/',
    detail: 'Advanced player statistics and shot chart data.',
  },
  {
    name: 'ESPN CDN',
    href: 'https://a.espncdn.com',
    detail: 'Team logos and related imagery.',
  },
]

export default function AboutPage() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-5 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={webPageSchema({
          path: '/about',
          title: 'About',
          description: PAGE_DESCRIPTION,
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>About</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>About {SITE_NAME}</h1>
        <p className='text-muted-foreground text-sm'>{SITE_TAGLINE}</p>
      </header>

      <div className='text-muted-foreground flex flex-col gap-6 text-sm leading-relaxed sm:text-base'>
        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>The project</h2>
          <p>{SITE_DESCRIPTION}</p>
          <p>
            {SITE_NAME} was built with a great love for the game of basketball — a light, fast place
            to follow the whole league at a glance, from live match centers to historic games.
          </p>
        </section>

        <section className='flex flex-col gap-4'>
          <h2 className='text-foreground text-lg font-medium'>Who made it</h2>
          <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
            <Image
              src='/avatar.jpg'
              alt='Pavel Vinogradov'
              width={128}
              height={128}
              className='h-32 w-32 shrink-0 rounded-full object-cover'
              priority
            />
            <div className='flex flex-col gap-2'>
              <p>
                Hi, I&apos;m <span className='text-foreground font-medium'>Pavel Vinogradov</span>, a
                senior frontend engineer. I designed and built {SITE_NAME} as a passion project to
                bring the game I love into a clean, modern web experience.
              </p>
              <p>
                Find more of my work on{' '}
                <a
                  href='https://github.com/paulgrape'
                  className='text-foreground underline-offset-4 hover:underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  GitHub
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Data sources</h2>
          <p>
            {SITE_NAME} is powered by publicly available data. Big thanks to the APIs that make it
            possible:
          </p>
          <ul className='list-disc space-y-2 pl-5'>
            {dataSources.map(source => (
              <li key={source.href}>
                <a
                  href={source.href}
                  className='text-foreground underline-offset-4 hover:underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {source.name}
                </a>{' '}
                — {source.detail}
              </li>
            ))}
          </ul>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-foreground text-lg font-medium'>Non-commercial &amp; open data</h2>
          <p>
            {SITE_NAME} is a non-commercial project made for the love of basketball. It uses only
            publicly available open data and is not sold, monetized, or run for profit.
          </p>
          <p>
            This site is an independent fan project and is not affiliated with, endorsed by, or
            sponsored by the NBA, ESPN, or any of their partners. All team names, logos, and related
            marks are the property of their respective owners.
          </p>
        </section>
      </div>
    </main>
  )
}
