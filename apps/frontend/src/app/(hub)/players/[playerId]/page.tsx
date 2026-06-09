import Link from 'next/link'

import {PlayerBioGrid, PlayerPageHeader} from '@/components/player-page-header'
import {PlayerCareerStats} from '@/components/player-career-stats'
import {PlayerNewsSection} from '@/components/player-news-section'
import {PlayerSeasonStats} from '@/components/player-season-stats'
import {
  getPlayer,
  getPlayerCareerStats,
  getPlayerNews,
  getPlayerSeasonStats,
} from '@/lib/players-api'
import {getTeam} from '@/lib/teams-api'
import {SITE_NAME, createPageMetadata} from '@/lib/site'
import type {Metadata} from 'next'

type PlayerDetailsPageProps = {
  params: Promise<{
    playerId: string
  }>
  searchParams: Promise<{
    teamId?: string
  }>
}

export async function generateMetadata({params}: PlayerDetailsPageProps): Promise<Metadata> {
  const {playerId} = await params
  const player = await getPlayer(playerId)

  return createPageMetadata({
    title: player.fullName,
    description: `${player.fullName} stats, career history, and news on ${SITE_NAME}.`,
  })
}

export default async function PlayerDetailsPage({params, searchParams}: PlayerDetailsPageProps) {
  const {playerId} = await params
  const {teamId} = await searchParams

  const [player, regularStats, playoffStats, careerStats, news, team] = await Promise.all([
    getPlayer(playerId),
    getPlayerSeasonStats(playerId, {seasonType: 'regular'}),
    getPlayerSeasonStats(playerId, {seasonType: 'playoffs'}),
    getPlayerCareerStats(playerId),
    getPlayerNews(playerId),
    teamId ? getTeam(teamId).catch(() => null) : Promise.resolve(null),
  ])

  const backHref = teamId ? `/teams/${teamId}` : '/teams'
  const backLabel = team ? `Back to ${team.displayName}` : 'Back to teams'

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <Link
        href={backHref}
        className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
      >
        {backLabel}
      </Link>

      <PlayerPageHeader player={player} />
      <PlayerBioGrid player={player} />
      <PlayerSeasonStats
        regularStats={regularStats}
        playoffStats={playoffStats}
      />
      <PlayerCareerStats seasons={careerStats.seasons} />
      <PlayerNewsSection articles={news} />
    </main>
  )
}
