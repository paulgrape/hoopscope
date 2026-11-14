import type {PlayerRecentGame, PlayerRecentGamesResponse} from '@/lib/players-api'
import {cn} from '@/lib/utils'
import Link from 'next/link'

type PlayerRecentGamesProps = {
  recentGames: PlayerRecentGamesResponse
}

const DISPLAY_LOCALE = 'en-US'
const GAME_TIME_ZONE = 'America/New_York'

const linkClass =
  'hover:text-foreground focus-visible:ring-ring/50 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3'

const COLUMNS = [
  {key: 'date', label: 'Date', align: 'left'},
  {key: 'opp', label: 'Opp', align: 'left'},
  {key: 'result', label: 'Result', align: 'left'},
  {key: 'min', label: 'MIN', align: 'right'},
  {key: 'pts', label: 'PTS', align: 'right'},
  {key: 'reb', label: 'REB', align: 'right'},
  {key: 'ast', label: 'AST', align: 'right'},
  {key: 'stl', label: 'STL', align: 'right'},
  {key: 'blk', label: 'BLK', align: 'right'},
  {key: 'tov', label: 'TO', align: 'right'},
  {key: 'fg', label: 'FG', align: 'right'},
  {key: 'three', label: '3PT', align: 'right'},
  {key: 'ft', label: 'FT', align: 'right'}
] as const

export function PlayerRecentGames({recentGames}: PlayerRecentGamesProps) {
  const games = recentGames.games

  return (
    <section className='bg-card border-border min-w-0 rounded-xl border p-3 sm:p-5'>
      <div className='flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4'>
        <h2 className='text-card-foreground text-lg font-semibold sm:text-xl'>Recent games</h2>
        {recentGames.seasonLabel ? <p className='text-muted-foreground text-sm'>{recentGames.seasonLabel}</p> : null}
      </div>

      {games.length === 0 ? (
        <p className='text-muted-foreground mt-4 rounded-lg border border-dashed px-4 py-6 text-sm'>
          No recent games available.
        </p>
      ) : (
        <>
          <div className='mt-4 grid gap-3 md:hidden'>
            {games.map(game => (
              <GameCard
                key={game.id}
                game={game}
              />
            ))}
          </div>

          <div className='mt-4 hidden overflow-x-auto md:block'>
            <table className='w-full min-w-4xl text-left text-sm'>
              <thead className='text-muted-foreground border-b'>
                <tr>
                  {COLUMNS.map(column => (
                    <th
                      key={column.key}
                      scope='col'
                      className={cn('px-2 py-2 font-medium sm:px-3', column.align === 'right' && 'text-right')}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {games.map(game => (
                  <tr
                    key={game.id}
                    className='border-border/70 text-card-foreground border-b'
                  >
                    <td className='px-2 py-2.5 sm:px-3'>
                      <GameLink game={game} />
                    </td>
                    <td className='px-2 py-2.5 sm:px-3'>
                      <OpponentLink game={game} />
                    </td>
                    <td className='px-2 py-2.5 whitespace-nowrap sm:px-3'>
                      <ResultLine game={game} />
                    </td>
                    <StatCell
                      value={formatMinutes(game)}
                      className='font-medium'
                    />
                    <StatCell value={formatCount(game.pts, game.played)} />
                    <StatCell value={formatCount(game.reb, game.played)} />
                    <StatCell value={formatCount(game.ast, game.played)} />
                    <StatCell value={formatCount(game.stl, game.played)} />
                    <StatCell value={formatCount(game.blk, game.played)} />
                    <StatCell value={formatCount(game.tov, game.played)} />
                    <StatCell value={game.played ? (game.fg ?? '—') : '—'} />
                    <StatCell value={game.played ? (game.threePoint ?? '—') : '—'} />
                    <StatCell value={game.played ? (game.freeThrow ?? '—') : '—'} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function GameCard({game}: {game: PlayerRecentGame}) {
  return (
    <article className='bg-background/40 border-border rounded-lg border p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <GameLink game={game} />
          <p className='mt-1'>
            <OpponentLink game={game} />
          </p>
        </div>
        <ResultLine game={game} />
      </div>
      <dl className='text-muted-foreground mt-3 grid grid-cols-4 gap-2 text-xs'>
        <MiniStat
          label='PTS'
          value={formatCount(game.pts, game.played)}
        />
        <MiniStat
          label='REB'
          value={formatCount(game.reb, game.played)}
        />
        <MiniStat
          label='AST'
          value={formatCount(game.ast, game.played)}
        />
        <MiniStat
          label='MIN'
          value={formatMinutes(game)}
        />
      </dl>
    </article>
  )
}

function GameLink({game}: {game: PlayerRecentGame}) {
  const dateLabel = formatGameDate(game.date)
  const opponent = game.opponentAbbr ?? 'opponent'
  const place = game.homeAway === 'away' ? 'at' : 'versus'

  return (
    <Link
      href={`/match-center/${game.id}`}
      className={cn(linkClass, 'text-card-foreground font-medium')}
      aria-label={`${dateLabel} ${place} ${opponent}`}
    >
      {dateLabel}
    </Link>
  )
}

function OpponentLink({game}: {game: PlayerRecentGame}) {
  const prefix = game.homeAway === 'away' ? '@' : 'vs'
  const label = game.opponentAbbr ?? '—'
  const text = `${prefix} ${label}`

  if (!game.opponentId) {
    return <span className='text-muted-foreground text-xs tracking-wider uppercase'>{text}</span>
  }

  return (
    <Link
      href={`/teams/${game.opponentId}`}
      className={cn(linkClass, 'text-muted-foreground text-xs tracking-wider uppercase')}
    >
      {text}
    </Link>
  )
}

function ResultLine({game}: {game: PlayerRecentGame}) {
  if (!game.result && !game.score) {
    return <span className='text-muted-foreground'>—</span>
  }

  const resultLabel = game.result === 'W' ? 'Win' : game.result === 'L' ? 'Loss' : game.result

  return (
    <span className='inline-flex items-center gap-2'>
      {game.result ? (
        <span
          className={cn(
            'inline-flex size-5 items-center justify-center rounded text-[11px] leading-none font-semibold',
            game.result === 'W' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
            game.result === 'L' && 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
            game.result !== 'W' && game.result !== 'L' && 'bg-muted text-muted-foreground'
          )}
          aria-hidden='true'
        >
          {game.result}
        </span>
      ) : null}
      {resultLabel ? <span className='sr-only'>{resultLabel}</span> : null}
      {game.score ? <span className='tabular-nums'>{game.score}</span> : null}
    </span>
  )
}

function StatCell({value, className}: {value: string; className?: string}) {
  return <td className={cn('px-2 py-2.5 text-right tabular-nums sm:px-3', className)}>{value}</td>
}

function MiniStat({label, value}: {label: string; value: string}) {
  return (
    <div className='text-center'>
      <dt className='text-[10px] font-medium tracking-wide uppercase'>{label}</dt>
      <dd className='text-card-foreground mt-0.5 font-medium tabular-nums'>{value}</dd>
    </div>
  )
}

function formatGameDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: GAME_TIME_ZONE
  }).format(date)
}

function formatMinutes(game: PlayerRecentGame): string {
  if (!game.played) return 'DNP'
  if (game.min == null) return '—'
  return Number.isInteger(game.min) ? String(game.min) : game.min.toFixed(1)
}

function formatCount(value: number | null, played: boolean): string {
  if (!played || value == null) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
