import type {LivePlayEvent, ReplayTimelineEntry} from '@/lib/games-api'
import {describe, expect, it} from 'vitest'

import {
  clockLabelAtElapsed,
  computeInsights,
  elapsedForPlayIndex,
  periodScoresFromPlays,
  periodSegments,
  playIndexAtElapsed,
  scoringEvents,
  teamAccent,
  totalGameSeconds
} from '../replay-utils'

const timeline: ReplayTimelineEntry[] = [
  {index: 0, period: 1, elapsedSeconds: 0},
  {index: 1, period: 1, elapsedSeconds: 60},
  {index: 2, period: 2, elapsedSeconds: 800},
  {index: 3, period: 4, elapsedSeconds: 2400}
]

function play(overrides: Partial<LivePlayEvent> & {id: string}): LivePlayEvent {
  return {
    sequenceNumber: 1,
    period: 1,
    clock: '12:00',
    elapsedSeconds: 0,
    text: 'Play',
    scoringPlay: false,
    scoreValue: 0,
    homeScore: 0,
    awayScore: 0,
    ...overrides
  }
}

describe('replay timeline maths', () => {
  it('maps an elapsed game time to the last play that already happened', () => {
    expect(playIndexAtElapsed(timeline, 0)).toBe(0)
    expect(playIndexAtElapsed(timeline, 59)).toBe(0)
    expect(playIndexAtElapsed(timeline, 60)).toBe(1)
    expect(playIndexAtElapsed(timeline, 1440)).toBe(2)
    expect(playIndexAtElapsed(timeline, 10_000)).toBe(3)
  })

  it('clamps play indexes when reading elapsed time', () => {
    expect(elapsedForPlayIndex(timeline, -3)).toBe(0)
    expect(elapsedForPlayIndex(timeline, 2)).toBe(800)
    expect(elapsedForPlayIndex(timeline, 99)).toBe(2400)
  })

  it('labels elapsed time with the game clock', () => {
    expect(clockLabelAtElapsed(0)).toBe('Q1 12:00')
    expect(clockLabelAtElapsed(60)).toBe('Q1 11:00')
    expect(clockLabelAtElapsed(800)).toBe('Q2 10:40')
    expect(clockLabelAtElapsed(2880)).toBe('Q4 0:00')
  })

  it('builds one segment per period covering the whole game', () => {
    const segments = periodSegments(timeline)

    expect(segments).toHaveLength(4)
    expect(segments[0]).toEqual({period: 1, label: 'Q1', startSeconds: 0, endSeconds: 720})
    expect(segments[3].endSeconds).toBe(totalGameSeconds(timeline))
  })

  it('adds overtime segments when the timeline goes past regulation', () => {
    const withOvertime = [...timeline, {index: 4, period: 5, elapsedSeconds: 3000}]
    const segments = periodSegments(withOvertime)

    expect(segments).toHaveLength(5)
    expect(segments[4].label).toBe('OT')
    expect(totalGameSeconds(withOvertime)).toBe(2880 + 300)
  })
})

describe('replay derived stats', () => {
  const plays: LivePlayEvent[] = [
    play({id: 'p1', text: 'Tip-off'}),
    play({id: 'p2', period: 1, scoringPlay: true, scoreValue: 2, teamId: 'home', homeScore: 2, awayScore: 0}),
    play({id: 'p3', period: 1, scoringPlay: true, scoreValue: 3, teamId: 'away', homeScore: 2, awayScore: 3}),
    play({id: 'p4', period: 2, scoringPlay: true, scoreValue: 1, teamId: 'away', homeScore: 2, awayScore: 4}),
    play({id: 'p5', period: 2, scoringPlay: true, scoreValue: 2, teamId: 'home', homeScore: 4, awayScore: 4})
  ]

  it('splits scoring by period', () => {
    expect(periodScoresFromPlays(plays)).toEqual([
      {period: 1, label: 'Q1', home: 2, away: 3},
      {period: 2, label: 'Q2', home: 2, away: 1}
    ])
  })

  it('counts lead changes, ties, leads and shot types', () => {
    const insights = computeInsights(plays)

    expect(insights.leadChanges).toBe(1)
    expect(insights.ties).toBe(1)
    expect(insights.biggestHomeLead).toBe(2)
    expect(insights.biggestAwayLead).toBe(2)
    expect(insights.awayShots).toEqual({freeThrows: 1, twos: 0, threes: 1, points: 4})
    expect(insights.homeShots).toEqual({freeThrows: 0, twos: 2, threes: 0, points: 4})
    expect(insights.run).toEqual({team: 'home', points: 2})
    expect(insights.differential).toHaveLength(4)
  })

  it('reads free throws that the archive stores with no score value', () => {
    const freeThrows: LivePlayEvent[] = [
      play({
        id: 'ft1',
        text: 'Kevin Love makes free throw 1 of 2',
        shortText: '+1 Point',
        scoringPlay: true,
        scoreValue: 0,
        teamId: 'away',
        homeScore: 0,
        awayScore: 1
      }),
      play({
        id: 'ft2',
        text: 'Kevin Love misses free throw 2 of 2',
        scoringPlay: false,
        teamId: 'away',
        homeScore: 0,
        awayScore: 1
      })
    ]

    expect(scoringEvents(freeThrows)).toEqual([
      {playIndex: 0, elapsedSeconds: 0, team: 'away', points: 1, kind: 'ft', homeScore: 0, awayScore: 1}
    ])
    expect(computeInsights(freeThrows).awayShots).toEqual({freeThrows: 1, twos: 0, threes: 0, points: 1})
  })

  it('attributes points by the score that moved, even on a play that is not flagged as scoring', () => {
    const gaps: LivePlayEvent[] = [
      play({id: 'g1', text: 'Substitution', teamId: 'away', homeScore: 2, awayScore: 0}),
      play({
        id: 'g2',
        text: 'Anthony Davis misses 26-foot three point jumper',
        teamId: 'home',
        homeScore: 2,
        awayScore: 3
      })
    ]

    expect(scoringEvents(gaps).map(event => [event.team, event.points, event.kind])).toEqual([
      ['home', 2, '2pt'],
      ['away', 3, '3pt']
    ])
  })

  it('keeps team points equal to the running score', () => {
    const insights = computeInsights(plays)

    expect(insights.homeShots.points).toBe(plays[plays.length - 1].homeScore)
    expect(insights.awayShots.points).toBe(plays[plays.length - 1].awayScore)
  })

  it('normalizes team colours to hex', () => {
    expect(teamAccent('00275D')).toBe('#00275D')
    expect(teamAccent('#00275D')).toBe('#00275D')
    expect(teamAccent('')).toBeUndefined()
  })
})
