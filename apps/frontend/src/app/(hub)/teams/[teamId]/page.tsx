import {PageBreadcrumb} from '@/components/layout/page-breadcrumb'
import {JsonLd} from '@/components/seo/json-ld'
import {TeamFacts, TeamPageHeader} from '@/components/teams/team-page-header'
import {TeamSeasonStats} from '@/components/teams/team-season-stats'
import {breadcrumbSchema, sportsTeamSchema} from '@/lib/seo-schema'
import {SITE_NAME, createPageMetadata} from '@/lib/site'
import {getTeam, getTeamSeasonStats, parseSeasonQuery} from '@/lib/teams-api'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

type TeamDetailsPageProps = {
  params: Promise<{
    teamId: string
  }>
  searchParams: Promise<{
    season?: string
  }>
}

export async function generateMetadata({params}: TeamDetailsPageProps): Promise<Metadata> {
  const {teamId} = await params
  const team = await getTeam(teamId)

  if (!team) {
    return createPageMetadata({
      title: 'Team Not Found',
      description: `No NBA team matches this ${SITE_NAME} address.`,
      path: `/teams/${teamId}`
    })
  }

  return createPageMetadata({
    title: `${team.displayName} - Roster, Stats & Schedule`,
    description: `Follow the ${team.displayName} on ${SITE_NAME}: full roster, season record, team details, and regular season and playoff statistics.`,
    path: `/teams/${teamId}`,
    image: team.logo
  })
}

export default async function TeamDetailsPage({params, searchParams}: TeamDetailsPageProps) {
  const {teamId} = await params
  const {season: seasonQuery} = await searchParams
  const team = await getTeam(teamId)

  if (!team) {
    notFound()
  }

  const season = parseSeasonQuery(seasonQuery)
  const [regularStats, playoffStats] = await Promise.all([
    getTeamSeasonStats(teamId, {season, seasonType: 'regular'}),
    getTeamSeasonStats(teamId, {season, seasonType: 'playoffs'})
  ])

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'
    >
      <JsonLd
        data={[
          sportsTeamSchema({
            id: team.id,
            name: team.displayName,
            location: team.location,
            logo: team.logo,
            record: team.record?.summary ? `${team.record.summary} (${team.record.seasonLabel})` : null
          }),
          breadcrumbSchema([
            {name: 'Teams', path: '/teams'},
            {name: team.displayName, path: `/teams/${teamId}`}
          ])
        ]}
      />
      <PageBreadcrumb items={[{name: 'Teams', href: '/teams'}, {name: team.displayName}]} />

      <TeamPageHeader team={team} />
      <TeamFacts team={team} />

      <TeamSeasonStats
        regularStats={regularStats}
        playoffStats={playoffStats}
        teamId={teamId}
      />
    </main>
  )
}
