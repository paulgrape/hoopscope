import {JsonLd} from '@/components/seo/json-ld'
import {TeamSeasonStats} from '@/components/teams/team-season-stats'
import {breadcrumbSchema, sportsTeamSchema} from '@/lib/seo-schema'
import {SITE_NAME, createPageMetadata} from '@/lib/site'
import {getTeam, getTeamSeasonStats} from '@/lib/teams-api'
import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'

type TeamDetailsPageProps = {
  params: Promise<{
    teamId: string
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

export default async function TeamDetailsPage({params}: TeamDetailsPageProps) {
  const {teamId} = await params
  const team = await getTeam(teamId)

  if (!team) {
    notFound()
  }

  const [regularStats, playoffStats] = await Promise.all([
    getTeamSeasonStats(teamId, {seasonType: 'regular'}),
    getTeamSeasonStats(teamId, {seasonType: 'playoffs'})
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
            record: team.record
          }),
          breadcrumbSchema([
            {name: 'Teams', path: '/teams'},
            {name: team.displayName, path: `/teams/${teamId}`}
          ])
        ]}
      />
      <Link
        href='/teams'
        className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
      >
        Back to all teams
      </Link>

      <header className='bg-card border-border flex flex-col items-start gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:gap-8 sm:p-5'>
        <Image
          src={team.logo ?? ''}
          alt={team.displayName}
          className='h-20 w-20 shrink-0 object-contain sm:h-25 sm:w-25'
          width={100}
          height={100}
        />
        <div className='min-w-0'>
          <p className='text-muted-foreground text-xs tracking-wider uppercase'>{team.abbreviation}</p>
          <h1 className='text-card-foreground mt-1 text-2xl font-semibold sm:text-3xl'>{team.displayName}</h1>
          <div className='text-muted-foreground mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-4'>
            <p>
              <span className='text-foreground'>Location:</span> {team.location}
            </p>
            <p>
              <span className='text-foreground'>Record:</span> {team.record ?? 'N/A'}
            </p>
          </div>
        </div>
      </header>

      <TeamSeasonStats
        regularStats={regularStats}
        playoffStats={playoffStats}
        teamId={teamId}
      />
    </main>
  )
}
