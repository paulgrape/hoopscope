import type {LivePlayEvent, ReplayTimelineEntry} from '@/lib/games-api'
import {fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {ReplayTimeline} from '../replay-timeline'

const TRACK_WIDTH = 200

const timeline: ReplayTimelineEntry[] = [
  {index: 0, period: 1, elapsedSeconds: 0},
  {index: 1, period: 1, elapsedSeconds: 60},
  {index: 2, period: 2, elapsedSeconds: 800},
  {index: 3, period: 4, elapsedSeconds: 2400}
]

const seenPlays: (LivePlayEvent | undefined)[] = [
  undefined,
  {
    id: 'p2',
    sequenceNumber: 2,
    period: 1,
    clock: '11:00',
    elapsedSeconds: 60,
    text: 'Home bucket',
    scoringPlay: true,
    scoreValue: 2,
    teamId: 'home',
    homeScore: 2,
    awayScore: 0
  },
  undefined,
  undefined
]

function renderTimeline(playIndex: number, onSeek = vi.fn()) {
  render(
    <ReplayTimeline
      timeline={timeline}
      playIndex={playIndex}
      seenPlays={seenPlays}
      maxSeenIndex={1}
      homeTeamId='home'
      awayTeamId='away'
      homeColor='00275D'
      awayColor='860038'
      onSeek={onSeek}
    />
  )

  return {slider: screen.getByRole('slider', {name: 'Replay position'}), onSeek}
}

describe('ReplayTimeline', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: TRACK_WIDTH,
      bottom: 40,
      width: TRACK_WIDTH,
      height: 40,
      toJSON: () => ({})
    })

    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.hasPointerCapture = vi.fn(() => false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exposes the current position as a slider value', () => {
    const {slider} = renderTimeline(3)

    expect(slider).toHaveAttribute('aria-valuenow', '2')
    expect(slider).toHaveAttribute('aria-valuemax', '3')
    expect(slider).toHaveAttribute('aria-valuetext', 'Q2 10:40')
  })

  it('seeks to the play that matches the clicked game time', () => {
    const {slider, onSeek} = renderTimeline(1)

    // Half of a 200px track over a 2880s game lands on 1440s, i.e. the Q2 play.
    fireEvent.pointerDown(slider, {clientX: TRACK_WIDTH / 2, pointerId: 1})
    fireEvent.pointerUp(slider, {clientX: TRACK_WIDTH / 2, pointerId: 1})

    expect(onSeek).toHaveBeenCalledWith(2)
  })

  it('follows the pointer while dragging and commits on release', () => {
    const {slider, onSeek} = renderTimeline(1)

    fireEvent.pointerDown(slider, {clientX: TRACK_WIDTH, pointerId: 1})
    expect(slider).toHaveAttribute('aria-valuenow', '3')

    fireEvent.pointerMove(slider, {clientX: 0, pointerId: 1})
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    expect(onSeek).not.toHaveBeenCalled()

    // Released back on the play that is already showing, so no seek is sent.
    fireEvent.pointerUp(slider, {clientX: 0, pointerId: 1})
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('steps by play with the arrow keys and jumps with Home and End', () => {
    const {slider, onSeek} = renderTimeline(2)

    fireEvent.keyDown(slider, {key: 'ArrowRight'})
    expect(onSeek).toHaveBeenLastCalledWith(2)

    fireEvent.keyDown(slider, {key: 'ArrowLeft'})
    expect(onSeek).toHaveBeenLastCalledWith(0)

    fireEvent.keyDown(slider, {key: 'End'})
    expect(onSeek).toHaveBeenLastCalledWith(3)

    fireEvent.keyDown(slider, {key: 'Home'})
    expect(onSeek).toHaveBeenLastCalledWith(0)
  })

  it('pages backwards by a minute of game time', () => {
    const {slider, onSeek} = renderTimeline(3)

    fireEvent.keyDown(slider, {key: 'PageDown'})

    // 800s minus 60s falls back to the play at 60s.
    expect(onSeek).toHaveBeenCalledWith(1)
  })
})
