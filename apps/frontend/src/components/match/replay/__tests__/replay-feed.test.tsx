import type {GameTeam, LivePlayEvent} from '@/lib/games-api'
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {ReplayFeed, arrivingPlayId} from '../replay-feed'

vi.mock('next/image', () => ({
  default: ({alt, src}: {alt: string; src: string}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
    />
  )
}))

const home: GameTeam = {id: 'home', name: 'Celtics', abbreviation: 'BOS', logo: '', color: '007A33'}
const away: GameTeam = {id: 'away', name: 'Lakers', abbreviation: 'LAL', logo: '', color: '552583'}

function makePlay(id: string, text: string): LivePlayEvent {
  return {
    id,
    sequenceNumber: 1,
    period: 4,
    clock: '2:00',
    elapsedSeconds: 2000,
    text,
    scoringPlay: true,
    scoreValue: 2,
    teamId: 'home',
    homeScore: 2,
    awayScore: 0
  }
}

function playRow(text: string) {
  const row = screen.getByRole('button', {name: new RegExp(text)}).closest('li')
  if (!row) throw new Error(`Missing row for ${text}`)
  return row
}

describe('arrivingPlayId', () => {
  it('returns the latest id when one play is appended', () => {
    expect(arrivingPlayId(2, [{id: 'a'}, {id: 'b'}, {id: 'c'}])).toBe('c')
  })

  it('returns null when the list grows by more than one play', () => {
    expect(arrivingPlayId(1, [{id: 'a'}, {id: 'b'}, {id: 'c'}])).toBeNull()
  })

  it('returns null when the list shrinks or stays the same length', () => {
    expect(arrivingPlayId(3, [{id: 'a'}])).toBeNull()
    expect(arrivingPlayId(2, [{id: 'a'}, {id: 'b'}])).toBeNull()
  })
})

describe('ReplayFeed', () => {
  it('animates only a single newly appended play', () => {
    const plays = [makePlay('a', 'Jump ball')]
    const {rerender} = render(
      <ReplayFeed
        plays={plays}
        homeTeam={home}
        awayTeam={away}
        onSelectPlay={vi.fn()}
      />
    )

    expect(playRow('Jump ball')).not.toHaveClass('animate-text-arrive')

    rerender(
      <ReplayFeed
        plays={[...plays, makePlay('b', 'Layup good')]}
        homeTeam={home}
        awayTeam={away}
        onSelectPlay={vi.fn()}
      />
    )

    expect(playRow('Layup good')).toHaveClass('animate-text-arrive')
    expect(playRow('Jump ball')).not.toHaveClass('animate-text-arrive')

    rerender(
      <ReplayFeed
        plays={[...plays, makePlay('b', 'Layup good'), makePlay('c', 'Steal'), makePlay('d', 'Three pointer')]}
        homeTeam={home}
        awayTeam={away}
        onSelectPlay={vi.fn()}
      />
    )

    expect(playRow('Three pointer')).not.toHaveClass('animate-text-arrive')
    expect(playRow('Layup good')).not.toHaveClass('animate-text-arrive')
  })
})
