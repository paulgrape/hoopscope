import {JsonLd} from '@/components/seo/json-ld'
import {TeamStatsBoard} from '@/components/team-stats/team-stats-board'
import {collectionPageSchema} from '@/lib/seo-schema'
import {createPageMetadata} from '@/lib/site'
import {getTeamStats} from '@/lib/team-stats-api'
import {parseSeasonQuery} from '@/lib/teams-api'

export const metadata = createPageMetadata({
  title: 'NBA Team Stats',
  description:
    'NBA team season stat sheet with estimated net, offensive, and defensive ratings plus per-game offense, defense, and differentials.',
  path: '/team-stats'
})

export default async function TeamStatsPage({
  searchParams
}: {
  searchParams: Promise<{season?: string | string[]; seasonType?: string | string[]}>
}) {
  const params = await searchParams
  const requestedSeason = parseSeasonQuery(typeof params.season === 'string' ? params.season : undefined)
  const season =
    requestedSeason != null && requestedSeason >= 1947 && requestedSeason <= 2100 ? requestedSeason : undefined
  const seasonType = params.seasonType === 'playoffs' ? 'playoffs' : 'regular'
  const data = await getTeamStats({season, seasonType})

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={collectionPageSchema({
          path: '/team-stats',
          title: 'NBA Team Stats',
          description: 'Team offensive, defensive, and differential season statistics.',
          items: data.teams.map(team => ({name: team.name, url: `/teams/${team.id}`}))
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm tracking-wider uppercase'>
          {data.seasonLabel} · {data.seasonType === 'regular' ? 'Regular season' : 'Playoffs'}
        </p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>NBA Team Stats</h1>
        <p className='text-muted-foreground text-sm sm:text-base'>
          OFF, DEF, NET, and PACE are estimated from ESPN counting stats.
        </p>
      </header>
      <TeamStatsBoard data={data} />
    </main>
  )
}
