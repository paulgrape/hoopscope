import {PageBreadcrumb} from '@/components/layout/page-breadcrumb'
import {HistoricGameSimulator} from '@/components/match/historic-game-simulator'
import {JsonLd} from '@/components/seo/json-ld'
import {SOCKET_BASE_URL, getHistoricGame} from '@/lib/games-api'
import {breadcrumbSchema, sportsEventSchema} from '@/lib/seo-schema'
import {createPageMetadata} from '@/lib/site'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

const DISPLAY_LOCALE = 'en-US'

type HistoricGamePageProps = {
  params: Promise<{
    gameId: string
  }>
}

export async function generateMetadata({params}: HistoricGamePageProps): Promise<Metadata> {
  const {gameId} = await params
  const game = await getHistoricGame(gameId)

  if (!game) {
    return createPageMetadata({
      title: 'Historic Game - Classic NBA Replay',
      description:
        'Replay a classic pro basketball matchup tick-by-tick from saved ESPN play-by-play data on Hoopscope.',
      path: `/historic-games/${gameId}`
    })
  }

  return createPageMetadata({
    title: `${game.name} - Play-by-Play Replay`,
    description: `Replay ${game.name} on Hoopscope with a simulated, tick-by-tick play-by-play feed recreated from the original ESPN game data.`,
    path: `/historic-games/${gameId}`
  })
}

export default async function HistoricGamePage({params}: HistoricGamePageProps) {
  const {gameId} = await params
  const game = await getHistoricGame(gameId)

  if (!game) {
    notFound()
  }

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={[
          sportsEventSchema({
            id: game.id,
            name: game.name,
            date: game.date,
            homeTeam: game.homeTeam.name,
            awayTeam: game.awayTeam.name,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            status: game.status
          }),
          breadcrumbSchema([
            {name: 'Historic Games', path: '/historic-games'},
            {name: game.name, path: `/historic-games/${gameId}`}
          ])
        ]}
      />
      <PageBreadcrumb
        items={[
          {name: 'Historic Games', href: '/historic-games'},
          {name: game.name}
        ]}
      />

      <header className='flex flex-col gap-1.5'>
        <p className='text-muted-foreground text-xs tracking-wider uppercase sm:text-sm'>Play-by-play replay</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>{game.name}</h1>
        <p className='text-muted-foreground text-sm'>
          {formatGameDate(game.date)}
          {game.venue ? ` · ${game.venue}` : ''}
          {` · ${game.totalPlays.toLocaleString()} saved plays`}
        </p>
      </header>

      <HistoricGameSimulator
        initialGame={game}
        socketBaseUrl={SOCKET_BASE_URL}
      />
    </main>
  )
}

function formatGameDate(date: string) {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date))
}
