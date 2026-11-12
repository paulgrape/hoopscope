import {TeamSeasonSelect} from '@/components/teams/team-season-select'
import {type LeaderCategory, type LeaderStat, type LeadersResponse, leadersHref} from '@/lib/leaders-api'
import {cn} from '@/lib/utils'
import {ArrowLeft, ArrowUpRight} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const qualificationLabels = {
  gp: 'games played',
  fgm: 'field goals made',
  ftm: 'free throws made',
  threePmTotal: 'threes made'
}

export function qualificationNote(categories: LeaderCategory[]) {
  if (!categories.some(category => category.qualification.teamGames > 0)) {
    return 'Qualification minimums will appear once games are played.'
  }
  const floors = new Map(categories.map(category => [category.qualification.stat, category.qualification.minimum]))
  return `Minimums: ${[...floors].map(([stat, minimum]) => `${Math.ceil(minimum)} ${qualificationLabels[stat]}`).join(' · ')}. Pro-rated to games played.`
}

export function LeadersFilters({data, stat}: {data: LeadersResponse; stat?: LeaderStat}) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <TeamSeasonSelect
        season={data.season}
        currentSeason={data.currentSeason}
      />
      <nav
        aria-label='Season type'
        className='bg-card flex w-full gap-1 rounded-lg border p-1 sm:w-auto'
      >
        {(['regular', 'playoffs'] as const).map(seasonType => (
          <Link
            key={seasonType}
            href={leadersHref({season: data.season, seasonType, stat})}
            aria-current={data.seasonType === seasonType ? 'page' : undefined}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center rounded-md px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-none',
              data.seasonType === seasonType
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {seasonType === 'regular' ? 'Regular' : 'Playoffs'}
          </Link>
        ))}
      </nav>
    </div>
  )
}

function LeadersTable({category}: {category: LeaderCategory}) {
  return (
    <table className='w-full text-sm'>
      <caption className='sr-only'>{category.label} leaders</caption>
      <thead className='text-muted-foreground bg-muted/40 border-y text-xs'>
        <tr>
          <th
            scope='col'
            className='px-3 py-2 text-center font-medium'
          >
            Rank
          </th>
          <th
            scope='col'
            className='py-2 text-left font-medium'
          >
            Player
          </th>
          <th
            scope='col'
            className='px-2 py-2 text-right font-medium'
          >
            <abbr
              title='Games played'
              className='no-underline'
            >
              GP
            </abbr>
          </th>
          <th
            scope='col'
            className='px-3 py-2 text-right font-medium'
          >
            <abbr
              title={category.label}
              className='no-underline'
            >
              {category.abbreviation}
            </abbr>
          </th>
        </tr>
      </thead>
      <tbody className='divide-y'>
        {category.leaders.map((leader, index) => (
          <tr
            key={leader.playerId}
            className={index === 0 ? 'bg-primary/5' : undefined}
          >
            <td className='text-muted-foreground px-3 py-3 text-center tabular-nums'>{leader.rank}</td>
            <th
              scope='row'
              className='py-3 text-left font-normal'
            >
              <div className='flex items-center gap-2'>
                {leader.headshot ? (
                  <Image
                    src={leader.headshot}
                    alt=''
                    width={48}
                    height={36}
                    className='hidden h-9 w-12 shrink-0 object-contain min-[380px]:block'
                  />
                ) : null}
                <div className='min-w-0'>
                  <Link
                    href={`/players/${leader.playerId}`}
                    className='font-medium underline-offset-4 hover:underline'
                  >
                    {leader.name}
                  </Link>
                  <div className='text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-xs'>
                    {leader.teamId ? (
                      <Link
                        href={`/teams/${leader.teamId}`}
                        title={leader.teamName ?? undefined}
                        className='underline-offset-4 hover:underline'
                      >
                        {leader.teamAbbreviation ?? leader.teamName ?? 'Team'}
                      </Link>
                    ) : (
                      <span>{leader.teamAbbreviation ?? '—'}</span>
                    )}
                    {leader.position ? (
                      <>
                        <span aria-hidden='true'>·</span>
                        <span>{leader.position}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </th>
            <td className='text-muted-foreground px-2 py-3 text-right tabular-nums'>{leader.gamesPlayed}</td>
            <td
              className={cn(
                'px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums',
                index === 0 && 'text-primary text-lg'
              )}
            >
              {leader.value.toFixed(1)}
              {category.format === 'percent' ? '%' : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function LeadersBoard({data, stat}: {data: LeadersResponse; stat?: LeaderStat}) {
  return (
    <div className='flex min-w-0 flex-col gap-5'>
      {stat ? (
        <Link
          href={leadersHref({season: data.season, seasonType: data.seasonType})}
          className='text-muted-foreground hover:text-foreground flex min-h-11 w-fit items-center gap-2 text-sm'
        >
          <ArrowLeft
            aria-hidden='true'
            className='size-4'
          />
          All leaders
        </Link>
      ) : null}
      <div className={cn('grid min-w-0 gap-4', !stat && 'md:grid-cols-2 xl:grid-cols-3')}>
        {data.categories.map(category => (
          <section
            key={category.stat}
            aria-labelledby={`leaders-${category.stat}`}
            className='bg-card min-w-0 overflow-hidden rounded-xl border'
          >
            <header className='flex items-start justify-between gap-3 px-4 py-4'>
              <div>
                <h2
                  id={`leaders-${category.stat}`}
                  className='font-semibold'
                >
                  {category.label}
                </h2>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {category.format === 'average' ? 'Per game' : 'Shooting percentage'} · Min.{' '}
                  {Math.ceil(category.qualification.minimum)} {qualificationLabels[category.qualification.stat]}
                </p>
              </div>
              {!stat ? (
                <Link
                  href={leadersHref({season: data.season, seasonType: data.seasonType, stat: category.stat})}
                  aria-label={`${category.label} full list`}
                  className='text-muted-foreground hover:text-foreground -my-2 flex min-h-11 shrink-0 items-center gap-1 text-sm'
                >
                  Full list
                  <ArrowUpRight
                    aria-hidden='true'
                    className='size-3.5'
                  />
                </Link>
              ) : null}
            </header>
            {category.leaders.length ? (
              <LeadersTable category={category} />
            ) : (
              <p className='text-muted-foreground border-t px-4 py-8 text-sm'>
                No qualifying players yet for this season and season type.
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
