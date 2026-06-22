import Image from 'next/image'
import Link from 'next/link'

import {JsonLd} from '@/components/json-ld'
import {getHistoricGames} from '@/lib/games-api'
import {collectionPageSchema} from '@/lib/seo-schema'
import {createPageMetadata} from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'Historic Games',
  description: 'Replay classic matchups with saved play-by-play feeds.',
  path: '/historic-games',
})

export default async function HistoricGamesPage() {
  const games = await getHistoricGames()

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <JsonLd
        data={collectionPageSchema({
          path: '/historic-games',
          title: 'Historic NBA Games',
          description: 'Replay classic matchups with saved play-by-play feeds.',
          items: games.map(game => ({
            name: game.name,
            url: `/historic-games/${game.id}`,
          })),
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Replay archive</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>Historic NBA Games</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          Pick a saved ESPN play-by-play feed and watch it replay through live websocket ticks.
        </p>
      </header>

      <section className='grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-2'>
        {games.map(game => (
          <Link
            key={game.id}
            href={`/historic-games/${game.id}`}
            className='bg-card border-border hover:border-ring flex min-w-0 flex-col gap-4 rounded-xl border p-3 transition active:scale-[0.98] sm:gap-5 sm:p-5 sm:hover:-translate-y-1'
          >
            <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm'>
              <span>{new Date(game.date).toLocaleDateString()}</span>
              <span className='rounded-full border px-2 py-0.5 capitalize'>{game.status}</span>
            </div>

            <div className='grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4'>
              <TeamBlock
                name={game.awayTeam.name}
                abbreviation={game.awayTeam.abbreviation}
                logo={game.awayTeam.logo}
              />
              <div className='text-center'>
                <p className='text-2xl font-semibold sm:text-3xl'>
                  {game.awayScore} - {game.homeScore}
                </p>
                <p className='text-muted-foreground mt-1 text-xs uppercase tracking-wider'>Final</p>
              </div>
              <TeamBlock
                name={game.homeTeam.name}
                abbreviation={game.homeTeam.abbreviation}
                logo={game.homeTeam.logo}
                align='right'
              />
            </div>

            <div className='min-w-0'>
              <h2 className='text-card-foreground truncate text-base font-semibold sm:text-lg'>{game.name}</h2>
              <p className='text-muted-foreground mt-1 text-sm'>
                {game.totalPlays.toLocaleString()} saved play-by-play events
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}

function TeamBlock({
  name,
  abbreviation,
  logo,
  align = 'left',
}: {
  name: string
  abbreviation: string
  logo: string
  align?: 'left' | 'right'
}) {
  return (
    <div
      className={`bg-background/40 flex min-w-0 items-center gap-3 rounded-lg p-3 sm:bg-transparent sm:p-0 ${
        align === 'right' ? 'sm:flex-row-reverse sm:text-right' : ''
      }`}
    >
      {logo ? (
        <Image
          src={logo}
          alt={`${name} logo`}
          className='h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12'
          width={48}
          height={48}
        />
      ) : (
        <div className='bg-muted h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12' />
      )}
      <div className='min-w-0'>
        <p className='text-card-foreground font-semibold'>{abbreviation}</p>
        <p className='text-muted-foreground truncate text-sm'>{name}</p>
      </div>
    </div>
  )
}
