import Image from 'next/image'
import Link from 'next/link'

import {getHistoricGames} from '@/lib/games-api'

export default async function HistoricGamesPage() {
  const games = await getHistoricGames()

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8'>
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Replay archive</p>
        <h1 className='text-3xl font-semibold'>Historic NBA Games</h1>
        <p className='text-muted-foreground max-w-2xl'>
          Pick a saved ESPN play-by-play feed and watch it replay through live websocket ticks.
        </p>
      </header>

      <section className='grid gap-4 lg:grid-cols-2'>
        {games.map(game => (
          <Link
            key={game.id}
            href={`/historic-games/${game.id}`}
            className='bg-card border-border hover:border-ring flex flex-col gap-5 rounded-xl border p-5 transition hover:-translate-y-1 hover:active:-translate-y-0.5 hover:active:scale-95'
          >
            <div className='text-muted-foreground flex items-center justify-between gap-4 text-sm'>
              <span>{new Date(game.date).toLocaleDateString()}</span>
              <span className='rounded-full border px-2 py-0.5 capitalize'>{game.status}</span>
            </div>

            <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-4'>
              <TeamBlock
                name={game.awayTeam.name}
                abbreviation={game.awayTeam.abbreviation}
                logo={game.awayTeam.logo}
              />
              <div className='text-center'>
                <p className='text-3xl font-semibold'>
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

            <div>
              <h2 className='text-card-foreground text-lg font-semibold'>{game.name}</h2>
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
    <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {logo ? (
        <Image
          src={logo}
          alt={`${name} logo`}
          className='h-12 w-12 object-contain'
          width={48}
          height={48}
        />
      ) : (
        <div className='bg-muted h-12 w-12 rounded-full' />
      )}
      <div>
        <p className='text-card-foreground font-semibold'>{abbreviation}</p>
        <p className='text-muted-foreground text-sm'>{name}</p>
      </div>
    </div>
  )
}
