import Image from 'next/image'
import Link from 'next/link'

import {getTeam, getTeamRoster} from '@/lib/teams-api'

type TeamDetailsPageProps = {
  params: Promise<{
    teamId: string
  }>
}

export default async function TeamDetailsPage({params}: TeamDetailsPageProps) {
  const {teamId} = await params
  const [team, roster] = await Promise.all([getTeam(teamId), getTeamRoster(teamId)])

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8'>
      <Link
        href='/teams'
        className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline'
      >
        Back to all teams
      </Link>

      <header className='bg-card border-border flex items-center gap-8 rounded-xl border p-5'>
        <Image
          src={team.logo ?? ''}
          alt={team.displayName}
          width={100}
          height={100}
        />
        <div>
          <p className='text-muted-foreground text-xs uppercase tracking-wider'>{team.abbreviation}</p>
          <h1 className='text-card-foreground mt-1 text-3xl font-semibold'>{team.displayName}</h1>
          <div className='text-muted-foreground mt-3 flex flex-wrap gap-4 text-sm'>
            <p>
              <span className='text-foreground'>Location:</span> {team.location}
            </p>
            <p>
              <span className='text-foreground'>Record:</span> {team.record ?? 'N/A'}
            </p>
          </div>
        </div>
      </header>

      <section className='bg-card border-border rounded-xl border p-5'>
        <h2 className='text-card-foreground text-xl font-semibold'>Current Roster</h2>
        <div className='mt-4 overflow-x-auto'>
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
                      style={{height: 'auto'}}
                    />{' '}
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
      </section>
    </main>
  )
}
