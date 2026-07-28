import type {LiveGameState} from '@/lib/games-api'

import {ReplayDifferentialChart} from './replay-differential-chart'
import {computeInsights, elapsedForPlayIndex, periodSegments, teamAccent, totalGameSeconds} from './replay-utils'

type ReplayInsightsPanelProps = {
  game: LiveGameState
}

export function ReplayInsightsPanel({game}: ReplayInsightsPanelProps) {
  const insights = computeInsights(game.plays)
  const runTeam = insights.run.team === 'home' ? game.homeTeam : insights.run.team === 'away' ? game.awayTeam : null

  return (
    <div className='flex flex-col gap-4'>
      <dl className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
        <Stat
          label='Lead changes'
          value={insights.leadChanges}
        />
        <Stat
          label='Ties'
          value={insights.ties}
        />
        <Stat
          label={`${game.awayTeam.abbreviation} biggest lead`}
          value={insights.biggestAwayLead}
        />
        <Stat
          label={`${game.homeTeam.abbreviation} biggest lead`}
          value={insights.biggestHomeLead}
        />
      </dl>

      <div className='border-border rounded-xl border p-3 sm:p-4'>
        <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>Current run</p>
        <p className='mt-1 text-sm'>
          {runTeam && insights.run.points > 0
            ? `${runTeam.abbreviation} on a ${insights.run.points}-0 run`
            : 'No run yet'}
        </p>
      </div>

      <div className='grid grid-cols-2 gap-2'>
        <ShotSplitCard
          label={game.awayTeam.abbreviation}
          split={insights.awayShots}
        />
        <ShotSplitCard
          label={game.homeTeam.abbreviation}
          split={insights.homeShots}
        />
      </div>

      <div className='border-border rounded-xl border p-3 sm:p-4'>
        <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>Score differential</p>
        <p className='text-muted-foreground mt-1 text-xs'>
          Above the line favours {game.homeTeam.abbreviation}, below favours {game.awayTeam.abbreviation}.
        </p>
        <ReplayDifferentialChart
          points={insights.differential}
          currentSeconds={elapsedForPlayIndex(game.timeline, game.playIndex - 1)}
          totalSeconds={totalGameSeconds(game.timeline)}
          segments={periodSegments(game.timeline)}
          homeAbbreviation={game.homeTeam.abbreviation}
          awayAbbreviation={game.awayTeam.abbreviation}
          homeColor={teamAccent(game.homeTeam.color)}
          awayColor={teamAccent(game.awayTeam.color)}
          biggestHomeLead={insights.biggestHomeLead}
          biggestAwayLead={insights.biggestAwayLead}
        />
      </div>
    </div>
  )
}

function Stat({label, value}: {label: string; value: number}) {
  return (
    <div className='border-border rounded-xl border p-3'>
      <dt className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>{label}</dt>
      <dd className='mt-1 text-2xl font-semibold tabular-nums'>{value}</dd>
    </div>
  )
}

function ShotSplitCard({
  label,
  split
}: {
  label: string
  split: {freeThrows: number; twos: number; threes: number; points: number}
}) {
  return (
    <div className='border-border rounded-xl border p-3 sm:p-4'>
      <p className='text-sm font-semibold'>{label}</p>
      <dl className='text-muted-foreground mt-2 grid grid-cols-4 gap-2 text-xs'>
        <SplitEntry
          label='FT'
          value={split.freeThrows}
        />
        <SplitEntry
          label='2PT'
          value={split.twos}
        />
        <SplitEntry
          label='3PT'
          value={split.threes}
        />
        <SplitEntry
          label='PTS'
          value={split.points}
        />
      </dl>
    </div>
  )
}

function SplitEntry({label, value}: {label: string; value: number}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className='text-foreground mt-0.5 text-base font-semibold tabular-nums'>{value}</dd>
    </div>
  )
}
