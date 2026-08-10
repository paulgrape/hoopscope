import {PlayerSearchControls} from '@/components/players/player-search-controls'
import {JsonLd} from '@/components/seo/json-ld'
import {PLAYER_SEARCH_LIMIT, type PlayerListItem, getPlayerHref, searchPlayers} from '@/lib/players-api'
import {collectionPageSchema} from '@/lib/seo-schema'
import {createPageMetadata} from '@/lib/site'
import {getTeams} from '@/lib/teams-api'
import Image from 'next/image'
import Link from 'next/link'

export const metadata = createPageMetadata({
  title: 'NBA Players - Search Rosters by Name or Team',
  description:
    'Search every pro basketball player on an active roster by name or team, then jump straight to bios, season averages, career stats, and related news.',
  path: '/players'
})

type PlayersPageProps = {
  searchParams: Promise<{
    q?: string
    teamId?: string
  }>
}

export default async function PlayersPage({searchParams}: PlayersPageProps) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const teamId = params.teamId?.trim() ?? ''

  const [result, teams] = await Promise.all([
    searchPlayers({
      q: query || undefined,
      teamId: teamId || undefined,
      limit: PLAYER_SEARCH_LIMIT
    }),
    getTeams().catch(() => [])
  ])

  const isTruncated = result.total > result.players.length

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={collectionPageSchema({
          path: '/players',
          title: 'NBA Players',
          description: 'Search active NBA rosters by player name or team.',
          items: result.players.map(player => ({
            name: player.fullName,
            url: `/players/${player.id}`
          }))
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm tracking-wider uppercase'>Player directory</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>NBA Players</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          Search every player on an active roster, or filter by team, then open a profile for bio, season averages, and
          career stats.
        </p>
      </header>

      <PlayerSearchControls
        teams={teams}
        query={query}
        teamId={teamId}
      />

      <p className='text-muted-foreground text-sm'>
        {result.total === 0
          ? 'No players match these filters.'
          : isTruncated
            ? `Showing ${result.players.length} of ${result.total} players. Refine the search to narrow the list.`
            : `${result.total} ${result.total === 1 ? 'player' : 'players'}`}
      </p>

      {result.players.length === 0 ? (
        <div className='bg-card border-border flex flex-col items-center gap-2 rounded-xl border p-6 text-center'>
          <p className='font-medium'>Nobody found</p>
          <p className='text-muted-foreground text-sm'>
            Check the spelling, try a last name only, or clear the team filter.
          </p>
        </div>
      ) : (
        <section className='grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'>
          {result.players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
            />
          ))}
        </section>
      )}
    </main>
  )
}

function PlayerCard({player}: {player: PlayerListItem}) {
  const details = [player.team?.abbreviation, player.position, player.jersey ? `#${player.jersey}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={getPlayerHref(player.id, player.team?.id)}
      className='bg-card border-border hover:border-ring flex min-w-0 items-center gap-3 rounded-xl border p-3 transition active:scale-[0.98] sm:gap-4 sm:p-4 sm:hover:-translate-y-1'
    >
      {player.headshot ? (
        <Image
          src={player.headshot}
          alt={player.fullName}
          width={56}
          height={56}
          className='h-12 w-12 shrink-0 rounded-full object-cover sm:h-14 sm:w-14'
        />
      ) : (
        <div className='bg-muted h-12 w-12 shrink-0 rounded-full sm:h-14 sm:w-14' />
      )}
      <div className='min-w-0'>
        <p className='truncate font-semibold'>{player.fullName}</p>
        <p className='text-muted-foreground truncate text-sm'>{details || 'Free agent'}</p>
      </div>
    </Link>
  )
}
