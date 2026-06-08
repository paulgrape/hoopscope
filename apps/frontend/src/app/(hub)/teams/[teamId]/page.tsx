import Image from 'next/image'
import Link from 'next/link'

import {TeamSeasonStats} from '@/components/team-season-stats'
import {SITE_NAME, createPageMetadata} from '@/lib/site'
import {buildSeasonOptions, getTeam, getTeamRoster, getTeamSeasonStats, type TeamRosterPlayer} from '@/lib/teams-api'
import type {Metadata} from 'next'

type TeamDetailsPageProps = {
  params: Promise<{
    teamId: string
  }>
}

export async function generateMetadata({params}: TeamDetailsPageProps): Promise<Metadata> {
  const {teamId} = await params
  const team = await getTeam(teamId)

  return createPageMetadata({
    title: team.displayName,
    description: `${team.displayName} roster, record, and team details on ${SITE_NAME}.`
  })
}

export default async function TeamDetailsPage({params}: TeamDetailsPageProps) {
  const {teamId} = await params
  const [team, roster, seasonStats] = await Promise.all([
    getTeam(teamId),
    getTeamRoster(teamId),
    getTeamSeasonStats(teamId)
  ])

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
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

      {/* <section className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'>
        <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Current Roster</h2>

        <div className='mt-4 grid gap-3 md:hidden'>
          {roster.map(player => (
            <RosterPlayerCard key={player.id} player={player} />
          ))}
        </div>

        <div className='mt-4 hidden overflow-x-auto md:block'>
          <table className='w-full min-w-155 text-left text-sm'>
            <thead className='text-muted-foreground border-b'>
              <tr>
                <th className='py-2 pr-4 font-medium'>Player</th>
                <th className='py-2 pr-4 font-medium'>#</th>
                <th className='py-2 pr-4 font-medium'>Pos</th>
                <th className='py-2 pr-4 font-medium'>Age</th>
                <th className='py-2 pr-4 font-medium'>Experience</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(player => (
                <tr
                  key={player.id}
                  className='border-border/70 text-card-foreground border-b'
                >
                  <td className='flex items-center gap-2 py-2 pr-4'>
                    <Image
                      src={player.headshot ?? ''}
                      alt={player.fullName}
                      width={60}
                      height={60}
                      className='h-auto w-15 shrink-0'
                    />
                    <div>{player.fullName}</div>
                  </td>
                  <td className='py-2 pr-4'>{player.jersey ?? '-'}</td>
                  <td className='py-2 pr-4'>{player.position ?? '-'}</td>
                  <td className='py-2 pr-4'>{player.age ?? '-'}</td>
                  <td className='py-2 pr-4'>{player.experience}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section> */}

      <TeamSeasonStats
        teamId={teamId}
        initialStats={seasonStats}
        seasonOptions={buildSeasonOptions(seasonStats.season)}
      />
    </main>
  )
}

function RosterPlayerCard({player}: {player: TeamRosterPlayer}) {
  return (
    <article className='bg-background/40 border-border flex items-center gap-3 rounded-lg border p-3'>
      {player.headshot ? (
        <Image
          src={player.headshot}
          alt={player.fullName}
          width={56}
          height={56}
          className='h-14 w-14 shrink-0 rounded-full object-cover'
        />
      ) : (
        <div className='bg-muted h-14 w-14 shrink-0 rounded-full' />
      )}
      <div className='min-w-0 flex-1'>
        <p className='text-card-foreground truncate font-semibold'>{player.fullName}</p>
        <div className='text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm'>
          <span>#{player.jersey ?? '-'}</span>
          <span>{player.position ?? '-'}</span>
          <span>Age {player.age ?? '-'}</span>
          <span>{player.experience} yrs</span>
        </div>
      </div>
    </article>
  )
}
