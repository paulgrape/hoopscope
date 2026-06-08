import Link from 'next/link'
import {notFound} from 'next/navigation'

import {HistoricGameSimulator} from '@/components/historic-game-simulator'
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
      title: 'Historic Game',
      description: 'Replay a classic pro basketball matchup.',
    })
  }

  return createPageMetadata({
    title: game.name,
    description: `Replay ${game.name} with live play-by-play ticks.`,
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
