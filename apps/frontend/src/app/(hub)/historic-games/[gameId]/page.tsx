import Link from 'next/link'
import {notFound} from 'next/navigation'

import {HistoricGameSimulator} from '@/components/historic-game-simulator'
import {SOCKET_BASE_URL, getHistoricGame} from '@/lib/games-api'

type HistoricGamePageProps = {
  params: Promise<{
    gameId: string
  }>
}

export default async function HistoricGamePage({params}: HistoricGamePageProps) {
  const {gameId} = await params
  const game = await getHistoricGame(gameId)

  if (!game) {
    notFound()
  }

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8'>
      <Link
        href='/historic-games'
        className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
      >
        Back to historic games
      </Link>

      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Live replay</p>
        <h1 className='text-3xl font-semibold'>{game.name}</h1>
        <p className='text-muted-foreground max-w-2xl'>
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
