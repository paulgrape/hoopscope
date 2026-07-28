import type {LivePlayEvent} from '@/lib/games-api'
import {describe, expect, it} from 'vitest'

import {deriveBoxScore} from '../replay-box-score-derive'

const HOME = 'home'
const AWAY = 'away'

function play(text: string, teamId: string, overrides: Partial<LivePlayEvent> = {}): LivePlayEvent {
  return {
    id: text,
    sequenceNumber: 1,
    period: 1,
    clock: '12:00',
    elapsedSeconds: 0,
    text,
    scoringPlay: false,
    scoreValue: 0,
    teamId,
    homeScore: 0,
    awayScore: 0,
    ...overrides
  }
}

function lineFor<T extends {name: string}>(lines: T[], name: string): T {
  const line = lines.find(entry => entry.name === name)
  if (!line) throw new Error(`No line for ${name}`)

  return line
}

describe('deriveBoxScore', () => {
  const plays = [
    play('LeBron James makes driving layup (J.R. Smith assists)', AWAY),
    play('Stephen Curry misses 26-foot three point jumper', HOME),
    play('LeBron James defensive rebound', AWAY),
    play('Kevin Love makes free throw 1 of 2', AWAY),
    play('Kevin Love misses free throw 2 of 2', AWAY),
    play('Draymond Green offensive rebound', HOME),
    play("Tristan Thompson blocks Festus Ezeli's  shot", HOME),
    play('LeBron James  lost ball turnover (Draymond Green steals)', AWAY),
    play('Tristan Thompson personal foul  (Festus Ezeli draws the foul)', AWAY),
    play('Andre Iguodala enters the game for Festus Ezeli', HOME)
  ]

  const {home, away} = deriveBoxScore(plays, HOME, AWAY)

  it('reads makes and misses into shooting lines', () => {
    const james = lineFor(away, 'LeBron James')
    const curry = lineFor(home, 'Stephen Curry')
    const love = lineFor(away, 'Kevin Love')

    expect(james).toMatchObject({points: 2, fieldGoalsMade: 1, fieldGoalsAttempted: 1, threesAttempted: 0})
    expect(curry).toMatchObject({points: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 1, threesAttempted: 1})
    expect(love).toMatchObject({points: 1, freeThrowsMade: 1, freeThrowsAttempted: 2, fieldGoalsAttempted: 0})
  })

  it('credits assists, rebounds and offensive rebounds', () => {
    expect(lineFor(away, 'J.R. Smith').assists).toBe(1)
    expect(lineFor(away, 'LeBron James')).toMatchObject({rebounds: 1, offensiveRebounds: 0})
    expect(lineFor(home, 'Draymond Green')).toMatchObject({rebounds: 1, offensiveRebounds: 1})
  })

  it('gives blocks and steals to the team that does not own the play', () => {
    expect(lineFor(away, 'Tristan Thompson').blocks).toBe(1)
    expect(lineFor(home, 'Draymond Green').steals).toBe(1)
  })

  it('reads turnovers and fouls from names with no delimiter after them', () => {
    expect(lineFor(away, 'LeBron James').turnovers).toBe(1)
    expect(lineFor(away, 'Tristan Thompson').fouls).toBe(1)
    expect(lineFor(home, 'Festus Ezeli').fouls).toBe(0)
  })

  it('handles title-cased turnover phrasing', () => {
    const derived = deriveBoxScore(
      [play('LeBron James makes driving layup', AWAY), play('LeBron James Out-of-Bounds Bad Pass Turnover', AWAY)],
      HOME,
      AWAY
    )

    expect(lineFor(derived.away, 'LeBron James').turnovers).toBe(1)
  })

  it('lists substitutes even before they record a stat', () => {
    expect(lineFor(home, 'Andre Iguodala')).toMatchObject({points: 0, rebounds: 0})
    expect(lineFor(home, 'Festus Ezeli')).toMatchObject({points: 0})
  })

  it('sorts each team by points', () => {
    expect(away[0].name).toBe('LeBron James')
  })
})
