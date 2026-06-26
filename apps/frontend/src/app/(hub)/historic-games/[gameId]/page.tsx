import Link from 'next/link'
import {notFound} from 'next/navigation'

import {JsonLd} from '@/components/json-ld'
import {HistoricGameSimulator} from '@/components/historic-game-simulator'
import {breadcrumbSchema, sportsEventSchema} from '@/lib/seo-schema'
import {SOCKET_BASE_URL, getHistoricGame} from '@/lib/games-api'
import {createPageMetadata} from '@/lib/site'
import type {Metadata} from 'next'

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
      description: 'Replay a classic pro basketball matchup tick-by-tick from saved ESPN play-by-play data on Hoopscope.',
      path: `/historic-games/${gameId}`,
    })
  }

  return createPageMetadata({
    title: `${game.name} - Play-by-Play Replay`,
    description: `Replay ${game.name} on Hoopscope with a simulated, tick-by-tick play-by-play feed recreated from the original ESPN game data.`,
    path: `/historic-games/${gameId}`,
  })
}

export default async function HistoricGamePage({params}: HistoricGamePageProps) {
  const {gameId} = await params
  const game = await getHistoricGame(gameId)

  if (!game) {
    notFound()
  }

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
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
            status: game.status,
          }),
          breadcrumbSchema([
            {name: 'Historic Games', path: '/historic-games'},
            {name: game.name, path: `/historic-games/${gameId}`},
          ]),
        ]}
      />
      <Link
        href='/historic-games'
        className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
      >
        Back to historic games
      </Link>

      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Live replay</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>{game.name}</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          This replay follows the saved ESPN play-by-play feed and updates as websocket ticks arrive.
        </p>
      </header>

      <HistoricGameSimulator
        initialGame={game}
        socketBaseUrl={SOCKET_BASE_URL}
      />
    </main>
  )
}
