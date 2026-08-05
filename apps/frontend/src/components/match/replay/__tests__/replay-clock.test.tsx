import {act, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {ReplayClock} from '../replay-clock'

function renderClock(overrides: Partial<Parameters<typeof ReplayClock>[0]> = {}) {
  return render(
    <ReplayClock
      clock='10:00'
      playIndex={1}
      quarter={1}
      paused={false}
      isFinal={false}
      pace={1}
      {...overrides}
    />
  )
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('ReplayClock', () => {
  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down while the replay runs', () => {
    renderClock()

    advance(2_000)

    expect(screen.getByText('9:58')).toBeInTheDocument()
  })

  it('scales the countdown with the playback pace', () => {
    renderClock({pace: 4})

    advance(2_000)

    expect(screen.getByText('9:52')).toBeInTheDocument()
  })

  it('holds the clock while paused', () => {
    renderClock({paused: true})

    advance(4_000)

    expect(screen.getByText('10:00')).toBeInTheDocument()
  })

  it('resyncs to the server clock on the next play', () => {
    const {rerender} = renderClock()

    advance(2_000)
    rerender(
      <ReplayClock
        clock='9:44'
        playIndex={2}
        quarter={1}
        paused={false}
        isFinal={false}
        pace={1}
      />
    )

    expect(screen.getByText('9:44')).toBeInTheDocument()
  })

  it('shows a dash and the final label once the game ends', () => {
    renderClock({isFinal: true})

    expect(screen.getAllByText('Final')).toHaveLength(1)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
