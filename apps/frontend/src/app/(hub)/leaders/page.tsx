import {LeadersBoard, LeadersFilters, qualificationNote} from '@/components/leaders/leaders-board'
import {JsonLd} from '@/components/seo/json-ld'
import {getLeaders, parseLeaderStat} from '@/lib/leaders-api'
import {collectionPageSchema} from '@/lib/seo-schema'
import {createPageMetadata} from '@/lib/site'
import {parseSeasonQuery} from '@/lib/teams-api'

export const metadata = createPageMetadata({
  title: 'NBA Season Leaders - Player Stats',
  description:
    'NBA per-game and shooting percentage leaders by season, with qualified rankings for the regular season and playoffs.',
  path: '/leaders'
})

export default async function LeadersPage({
  searchParams
}: {
  searchParams: Promise<{season?: string | string[]; seasonType?: string | string[]; stat?: string | string[]}>
}) {
  const params = await searchParams
  const requestedSeason = parseSeasonQuery(typeof params.season === 'string' ? params.season : undefined)
  const season =
    requestedSeason != null && requestedSeason >= 1947 && requestedSeason <= 2100 ? requestedSeason : undefined
  const seasonType = params.seasonType === 'playoffs' ? 'playoffs' : 'regular'
  const stat = parseLeaderStat(typeof params.stat === 'string' ? params.stat : undefined)
  const data = await getLeaders({season, seasonType, stat, limit: stat ? 50 : 5})
  const players = [
    ...new Map(data.categories.flatMap(category => category.leaders).map(leader => [leader.playerId, leader])).values()
  ]

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={collectionPageSchema({
          path: '/leaders',
          title: 'NBA Season Leaders',
          description: 'Qualified per-game and shooting percentage leaders.',
          items: players.map(player => ({name: player.name, url: `/players/${player.playerId}`}))
        })}
      />
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm tracking-wider uppercase'>
          {data.seasonLabel} · {data.seasonType === 'regular' ? 'Regular season' : 'Playoffs'}
        </p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>NBA Season Leaders</h1>
        <p className='text-muted-foreground text-sm sm:text-base'>{qualificationNote(data.categories)}</p>
      </header>
      <LeadersFilters
        data={data}
        stat={stat}
      />
      <LeadersBoard
        data={data}
        stat={stat}
      />
    </main>
  )
}
