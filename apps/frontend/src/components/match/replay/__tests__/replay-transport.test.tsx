import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {ReplayTransport} from '../replay-transport'

function renderTransport(overrides: Partial<Parameters<typeof ReplayTransport>[0]> = {}) {
  const handlers = {
    onTogglePlay: vi.fn(),
    onRestart: vi.fn(),
    onStep: vi.fn(),
    onSeek: vi.fn(),
    onPaceChange: vi.fn()
  }

  render(
    <ReplayTransport
      paused={false}
      isFinal={false}
      pace={1}
      canStepBack
      canStepForward
      {...handlers}
      {...overrides}
    />
  )

  return handlers
}

describe('ReplayTransport', () => {
  it('pauses a running replay', async () => {
    const {onTogglePlay} = renderTransport()

    await userEvent.click(screen.getByRole('button', {name: 'Pause replay'}))

    expect(onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it('resumes a paused replay', async () => {
    const {onTogglePlay} = renderTransport({paused: true})

    await userEvent.click(screen.getByRole('button', {name: 'Resume replay'}))

    expect(onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it('restarts instead of resuming once the replay is final', async () => {
    const {onRestart, onTogglePlay} = renderTransport({isFinal: true, paused: true})

    await userEvent.click(screen.getByRole('button', {name: 'Replay from start'}))

    expect(onRestart).toHaveBeenCalledTimes(1)
    expect(onTogglePlay).not.toHaveBeenCalled()
  })

  it('steps one play in each direction', async () => {
    const {onStep} = renderTransport()

    await userEvent.click(screen.getByRole('button', {name: 'Next play'}))
    await userEvent.click(screen.getByRole('button', {name: 'Previous play'}))

    expect(onStep).toHaveBeenNthCalledWith(1, 1)
    expect(onStep).toHaveBeenNthCalledWith(2, -1)
  })

  it('jumps to the previous scoring play and disables unknown jumps', async () => {
    const {onSeek} = renderTransport()

    await userEvent.click(screen.getByRole('button', {name: 'Previous scoring play'}))

    expect(onSeek).toHaveBeenCalledWith(12)
    expect(screen.getByRole('button', {name: 'Next scoring play'})).toBeDisabled()
  })

  it('disables stepping at the edges of the replay', () => {
    renderTransport({canStepBack: false, canStepForward: false})

    expect(screen.getByRole('button', {name: 'Previous play'})).toBeDisabled()
    expect(screen.getByRole('button', {name: 'Next play'})).toBeDisabled()
  })

  it('changes the playback pace', async () => {
    const {onPaceChange} = renderTransport()

    await userEvent.click(screen.getByRole('button', {name: 'Replay pace x2'}))

    expect(onPaceChange).toHaveBeenCalledWith(2)
  })
})
