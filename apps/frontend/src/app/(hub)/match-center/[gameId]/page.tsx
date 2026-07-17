import Link from 'next/link'
import {notFound} from 'next/navigation'

import {JsonLd} from '@/components/json-ld'
import {MatchSummary} from '@/components/match-summary'
import {breadcrumbSchema, sportsEventSchema} from '@/lib/seo-schema'
import {getServerGameSummary, isValidDateKey} from '@/lib/games-api'
import {createPageMetadata} from '@/lib/site'
import type {Metadata} from 'next'

type MatchPageProps = {
  params: Promise<{gameId: string}>
  searchParams: Promise<{date?: string}>
}

export async function generateMetadata({params}: MatchPageProps): Promise<Metadata> {
  const {gameId} = await params
  const game = await getServerGameSummary(gameId)

  if (!game) {
    return createPageMetadata({
      title: 'Match - NBA Game Details',
      description: 'View scoreboard, team totals, and leaders for an NBA matchup on Hoopscope.',
      path: `/match-center/${gameId}`,
    })
  }

  return createPageMetadata({
    title: `${game.shortName ?? game.name} - Match Details`,
    description: `Follow ${game.name}: live or final score, team totals, and game leaders.`,
    path: `/match-center/${gameId}`,
  })
}

export default async function MatchPage({params, searchParams}: MatchPageProps) {
  const {gameId} = await params
  const {date} = await searchParams
  const game = await getServerGameSummary(gameId)

  if (!game) {
    notFound()
  }

  const backHref = isValidDateKey(date) ? `/match-center?date=${date}` : '/match-center'
  const homeName = game.homeTeam?.displayName ?? 'Home'
  const awayName = game.awayTeam?.displayName ?? 'Away'

  return (
    <main className='mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <JsonLd
        data={[
          sportsEventSchema({
            id: game.id,
            name: game.name,
            date: game.date,
            homeTeam: homeName,
            awayTeam: awayName,
            homeScore: game.homeScore ?? 0,
            awayScore: game.awayScore ?? 0,
            status: game.status,
            path: `/match-center/${gameId}`,
          }),
          breadcrumbSchema([
            {name: 'Match Center', path: '/match-center'},
            {name: game.shortName ?? game.name, path: `/match-center/${gameId}`},
          ]),
        ]}
      />

      <Link
        href={backHref}
        className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
      >
        Back to Match Center
      </Link>

      <header>
        <h1 className='text-2xl font-semibold sm:text-3xl'>{game.shortName ?? game.name}</h1>
      </header>

      <MatchSummary initialSummary={game} />
    </main>
  )
}
