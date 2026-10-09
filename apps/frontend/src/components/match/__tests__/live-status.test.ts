import {formatLiveClock} from '@/components/match/live-status'
import {describe, expect, it} from 'vitest'

describe('formatLiveClock', () => {
  it('formats a running regulation clock', () => {
    expect(formatLiveClock({status: 'live', statusDetail: '6:44 - 4th', period: 4, clock: '6:44'})).toBe('Q4 6:44')
  })

  it('formats overtime', () => {
    expect(formatLiveClock({status: 'live', statusDetail: '1:12 - OT', period: 5, clock: '1:12'})).toBe('OT 1:12')
    expect(formatLiveClock({status: 'live', statusDetail: '0:40 - 2OT', period: 6, clock: '0:40'})).toBe('2OT 0:40')
  })

  it('keeps break labels when the clock is stopped or missing', () => {
    expect(formatLiveClock({status: 'live', statusDetail: 'Halftime', period: 2, clock: '0:00'})).toBe('Halftime')
    expect(formatLiveClock({status: 'live', statusDetail: 'End of 3rd', period: 3, clock: null})).toBe('End of 3rd')
  })

  it('keeps final and scheduled detail', () => {
    expect(formatLiveClock({status: 'final', statusDetail: 'Final', period: 4, clock: '0:00'})).toBe('Final')
    expect(formatLiveClock({status: 'scheduled', statusDetail: '7:00 PM EDT', period: null, clock: null})).toBe(
      '7:00 PM EDT'
    )
  })
})
