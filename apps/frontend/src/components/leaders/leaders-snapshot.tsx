import type {Leader, LeaderCategory} from '@/lib/leaders-api'
import Image from 'next/image'
import Link from 'next/link'

const SNAPSHOT_STATS = ['pts', 'ast', 'reb'] as const
const DEFAULT_LEADER_COUNT = 5

type LeadersSnapshotProps = {
  categories: LeaderCategory[]
  leaderCount?: number
}

function formatLeaderValue(value: number, format: LeaderCategory['format']) {
  const rounded = value.toFixed(1)
  return format === 'percent' ? `${rounded}%` : rounded
}

function SnapshotRow({leader, format}: {leader: Leader; format: LeaderCategory['format']}) {
  const team = leader.teamId ? (
    <Link
      href={`/teams/${leader.teamId}`}
      title={leader.teamName ?? undefined}
      className='text-muted-foreground hover:text-foreground shrink-0 text-xs transition-colors'
    >
      {leader.teamAbbreviation ?? leader.teamName ?? 'Team'}
    </Link>
  ) : (
    <span className='text-muted-foreground shrink-0 text-xs'>{leader.teamAbbreviation ?? '—'}</span>
  )

  return (
    <li className='border-border flex min-w-0 items-center gap-2 border-b px-3 py-1.5 last:border-b-0 sm:px-4'>
      <span className='text-muted-foreground w-4 shrink-0 text-center text-sm font-medium tabular-nums'>
        {leader.rank}
      </span>
      <div className='flex min-w-0 flex-1 items-center gap-1.5'>
        <Link
          href={`/players/${leader.playerId}`}
          className='hover:text-foreground flex min-w-0 items-center gap-2 overflow-hidden text-sm font-medium transition-colors'
        >
          {leader.headshot ? (
            <Image
              src={leader.headshot}
              alt=''
              width={36}
              height={28}
              className='h-7 w-9 shrink-0 object-contain'
            />
          ) : (
            <span
              aria-hidden='true'
              className='bg-muted h-7 w-9 shrink-0 rounded-sm'
            />
          )}
          <span className='min-w-0 truncate'>{leader.name}</span>
        </Link>
        {team}
      </div>
      <span className='shrink-0 text-sm font-semibold tabular-nums'>{formatLeaderValue(leader.value, format)}</span>
    </li>
  )
}

export function LeadersSnapshot({categories, leaderCount = DEFAULT_LEADER_COUNT}: LeadersSnapshotProps) {
  const ordered = SNAPSHOT_STATS.flatMap(stat => {
    const category = categories.find(item => item.stat === stat)
    return category ? [category] : []
  })

  if (ordered.length === 0) {
    return (
      <div className='bg-card border-border rounded-xl border p-6 text-center'>
        <p className='text-muted-foreground text-sm'>League leaders are unavailable right now.</p>
      </div>
    )
  }

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {ordered.map(category => {
        const leaders = category.leaders.slice(0, leaderCount)

        return (
          <section
            key={category.stat}
            aria-labelledby={`leaders-snapshot-${category.stat}`}
            className='bg-card border-border flex min-w-0 flex-col overflow-hidden rounded-xl border'
          >
            <header className='border-border flex items-center justify-between gap-3 border-b px-3 py-3 sm:px-4'>
              <h3
                id={`leaders-snapshot-${category.stat}`}
                className='font-semibold'
              >
                {category.label}
              </h3>
              <p className='text-muted-foreground text-xs tracking-wider uppercase'>Top {leaderCount}</p>
            </header>
            {leaders.length ? (
              <ol>
                {leaders.map(leader => (
                  <SnapshotRow
                    key={leader.playerId}
                    leader={leader}
                    format={category.format}
                  />
                ))}
              </ol>
            ) : (
              <p className='text-muted-foreground px-3 py-6 text-center text-sm sm:px-4'>
                No qualifying players yet for this season and season type.
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}
