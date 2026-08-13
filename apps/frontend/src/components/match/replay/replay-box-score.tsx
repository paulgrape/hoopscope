'use client'

import {type BoxScoreLine, BoxScoreTable} from '@/components/match/box-score-table'
import type {LiveGameState, ReplayPlayerStat} from '@/lib/games-api'
import {useMemo} from 'react'

import {type DerivedPlayerLine, deriveBoxScore} from './replay-box-score-derive'

type ReplayBoxScoreProps = {
  game: LiveGameState
}

export function ReplayBoxScore({game}: ReplayBoxScoreProps) {
  const derived = useMemo(
    () => deriveBoxScore(game.plays, game.homeTeam.id, game.awayTeam.id),
    [game.plays, game.homeTeam.id, game.awayTeam.id]
  )

  const isFinal = Boolean(game.finalPlayers)
  const away = toBoxScoreLines(derived.away, game.finalPlayers?.away)
  const home = toBoxScoreLines(derived.home, game.finalPlayers?.home)

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-muted-foreground text-xs'>
        Built from the play-by-play; may trail the official line where a play is missing from the archive.
        {isFinal ? ' Minutes from the final box score.' : ''}
      </p>

      <div className='grid min-w-0 gap-4 lg:grid-cols-2'>
        <BoxScoreTable
          caption={game.awayTeam.name}
          lines={away}
          emptyMessage={`No plays recorded for ${game.awayTeam.name} yet.`}
          showMinutes={isFinal}
        />
        <BoxScoreTable
          caption={game.homeTeam.name}
          lines={home}
          emptyMessage={`No plays recorded for ${game.homeTeam.name} yet.`}
          showMinutes={isFinal}
        />
      </div>
    </div>
  )
}

function toBoxScoreLines(lines: DerivedPlayerLine[], officialPlayers: ReplayPlayerStat[] | undefined): BoxScoreLine[] {
  const minutesByName = new Map((officialPlayers ?? []).map(player => [nameKey(player.name), player.minutes]))

  return lines.map(line => ({
    id: line.name,
    name: line.name,
    href: null,
    meta: null,
    starter: false,
    minutes: minutesByName.get(nameKey(line.name)) ?? null,
    points: line.points,
    rebounds: line.rebounds,
    assists: line.assists,
    steals: line.steals,
    blocks: line.blocks,
    turnovers: line.turnovers,
    fouls: line.fouls,
    fieldGoals: `${line.fieldGoalsMade}-${line.fieldGoalsAttempted}`,
    threePointers: `${line.threesMade}-${line.threesAttempted}`,
    freeThrows: `${line.freeThrowsMade}-${line.freeThrowsAttempted}`
  }))
}

// The feed writes "J.R. Smith" where the official box score says "JR Smith".
function nameKey(name: string) {
  return name.toLowerCase().replace(/[^a-z]/g, '')
}
